# =========================================================
# NetMine AI — Phase 9: Real-Time Packet Capture & Flow Engine
#
# Connects to TShark to capture live network traffic,
# aggregates packets into bidirectional IP flows, and runs
# live inference using our trained XGBoost and Isolation Forest models.
# =========================================================

import json
import os
import re
import subprocess
import threading
import time
from collections import deque
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).parent.parent.parent.parent
MODELS_DIR = ROOT / "models"
PROCESSED_DIR = ROOT / "data" / "processed"

# Load models and mappings on module initialization
XGB_PATH = MODELS_DIR / "xgboost.joblib"
SCALER_PATH = MODELS_DIR / "scaler.joblib"
ISO_PATH = MODELS_DIR / "isolation_forest.joblib"
ML_RESULTS_PATH = PROCESSED_DIR / "ml_results.json"

xgb_model = None
scaler_model = None
iso_model = None
feature_names = []
label_mapping = {}

try:
    if XGB_PATH.exists():
        xgb_model = joblib.load(XGB_PATH)
    if SCALER_PATH.exists():
        scaler_model = joblib.load(SCALER_PATH)
    if ISO_PATH.exists():
        iso_model = joblib.load(ISO_PATH)
    if ML_RESULTS_PATH.exists():
        with open(ML_RESULTS_PATH, encoding="utf-8") as f:
            meta = json.load(f)
            feature_names = meta.get("feature_names", [])
            label_mapping = meta.get("label_mapping", {})
except Exception as e:
    print(f"[CaptureService] Warning loading models: {e}")


class FlowRecord:
    def __init__(self, key, src_ip, dst_ip, src_port, dst_port, proto_name, start_time):
        self.key = key
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.protocol = proto_name
        self.start_time = start_time
        self.last_time = start_time
        self.fwd_packets = 0
        self.bwd_packets = 0
        self.fwd_bytes = 0
        self.bwd_bytes = 0
        self.fwd_lens = []
        self.bwd_lens = []
        self.syn_count = 0
        self.ack_count = 0
        self.fin_count = 0
        self.rst_count = 0

    def add_packet(self, src_ip, length, flags_int, pkt_time):
        is_fwd = (src_ip == self.src_ip)
        self.last_time = pkt_time

        if is_fwd:
            self.fwd_packets += 1
            self.fwd_bytes += length
            self.fwd_lens.append(length)
        else:
            self.bwd_packets += 1
            self.bwd_bytes += length
            self.bwd_lens.append(length)

        if flags_int & 0x02:
            self.syn_count += 1
        if flags_int & 0x10:
            self.ack_count += 1
        if flags_int & 0x01:
            self.fin_count += 1
        if flags_int & 0x04:
            self.rst_count += 1


class CaptureService:
    def __init__(self):
        self.is_capturing = False
        self.interface_index = "5"
        self.interface_name = "Wi-Fi"
        self.process: Optional[subprocess.Popen] = None
        self.worker_thread: Optional[threading.Thread] = None
        self.flusher_thread: Optional[threading.Thread] = None

        self.lock = threading.Lock()
        self.active_flows: Dict[str, FlowRecord] = {}
        self.recent_flows = deque(maxlen=200)
        self.recent_anomalies = deque(maxlen=200)

        self.packets_captured = 0
        self.flows_processed = 0
        self.threats_detected = 0
        self.start_timestamp = 0.0

    def list_interfaces(self) -> List[dict]:
        try:
            res = subprocess.run(["tshark", "-D"], capture_output=True, text=True, timeout=5)
            interfaces = []
            for line in res.stdout.strip().split("\n"):
                m = re.match(r"(\d+)\.\s+(\S+)\s+\((.+)\)", line.strip())
                if m:
                    interfaces.append({
                        "index": m.group(1),
                        "device": m.group(2),
                        "name": m.group(3),
                    })
                else:
                    m2 = re.match(r"(\d+)\.\s+(\S+)", line.strip())
                    if m2:
                        interfaces.append({
                            "index": m2.group(1),
                            "device": m2.group(2),
                            "name": m2.group(2),
                        })
            return interfaces
        except Exception as e:
            return [{"index": "5", "device": "default", "name": f"Wi-Fi (fallback: {e})"}]

    def start_capture(self, iface_idx: Optional[str] = None) -> dict:
        with self.lock:
            if self.is_capturing:
                return {"status": "already_running", "interface": self.interface_name}

            if iface_idx:
                self.interface_index = iface_idx

            # Find friendly name
            all_ifaces = self.list_interfaces()
            for iface in all_ifaces:
                if iface["index"] == self.interface_index:
                    self.interface_name = iface["name"]
                    break

            self.is_capturing = True
            self.packets_captured = 0
            self.flows_processed = 0
            self.threats_detected = 0
            self.start_timestamp = time.time()
            self.active_flows.clear()

            self.worker_thread = threading.Thread(target=self._capture_worker, daemon=True)
            self.worker_thread.start()

            self.flusher_thread = threading.Thread(target=self._flow_flusher, daemon=True)
            self.flusher_thread.start()

            return {
                "status": "started",
                "interface": self.interface_name,
                "interface_index": self.interface_index,
            }

    def stop_capture(self) -> dict:
        with self.lock:
            if not self.is_capturing:
                return {"status": "not_running"}

            self.is_capturing = False
            if self.process:
                try:
                    self.process.terminate()
                except Exception:
                    pass
                self.process = None

            # Flush any remaining active flows
            for flow in list(self.active_flows.values()):
                self._emit_flow(flow)
            self.active_flows.clear()

            return {
                "status": "stopped",
                "packets_captured": self.packets_captured,
                "flows_processed": self.flows_processed,
                "threats_detected": self.threats_detected,
            }

    def get_status(self) -> dict:
        duration = time.time() - self.start_timestamp if self.is_capturing else 0.0
        return {
            "active": self.is_capturing,
            "interface": self.interface_name,
            "interface_index": self.interface_index,
            "packets_captured": self.packets_captured,
            "flows_processed": self.flows_processed,
            "threats_detected": self.threats_detected,
            "duration_seconds": round(duration, 1),
            "message": "Live Capture Active (TShark + AI Inference)" if self.is_capturing else "Capture Idle",
        }

    def get_recent_flows(self, limit: int = 50) -> List[dict]:
        with self.lock:
            flows = list(self.recent_flows)
            return flows[-limit:]

    def get_recent_anomalies(self, limit: int = 50) -> List[dict]:
        with self.lock:
            return list(self.recent_anomalies)[:limit]

    def add_anomaly(self, anom: dict) -> dict:
        with self.lock:
            self.threats_detected += 1
            if "id" not in anom:
                anom["id"] = f"anom-live-{self.threats_detected:04d}"
            if "timestamp" not in anom:
                anom["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            if "status" not in anom:
                anom["status"] = "active"
            if "data_source" not in anom:
                anom["data_source"] = "LIVE_CAPTURE"
            self.recent_anomalies.appendleft(anom)
            return anom

    def update_anomaly_status(self, anom_id: str, new_status: str) -> bool:
        with self.lock:
            for a in self.recent_anomalies:
                if a.get("id") == anom_id:
                    a["status"] = new_status
                    return True
            return False

    def clear(self):
        with self.lock:
            self.recent_flows.clear()
            self.recent_anomalies.clear()

    def clear_anomalies(self):
        with self.lock:
            self.recent_anomalies.clear()

    def _capture_worker(self):
        cmd = [
            "tshark", "-i", self.interface_index, "-l", "-n",
            "-T", "fields", "-E", "separator=/t",
            "-e", "frame.time_epoch",
            "-e", "ip.src", "-e", "ip.dst",
            "-e", "tcp.srcport", "-e", "tcp.dstport",
            "-e", "udp.srcport", "-e", "udp.dstport",
            "-e", "ip.proto", "-e", "frame.len", "-e", "tcp.flags",
        ]

        try:
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                bufsize=1,
            )

            for line in self.process.stdout:
                if not self.is_capturing:
                    break

                line = line.strip("\r\n")
                if not line:
                    continue

                parts = line.split("\t")
                if len(parts) < 10:
                    continue

                try:
                    epoch_str, ip_src, ip_dst, tcp_sp, tcp_dp, udp_sp, udp_dp, ip_proto, frame_len, tcp_flags = parts[:10]
                    pkt_time = float(epoch_str) if epoch_str else time.time()
                    length = int(frame_len) if frame_len else 64

                    # Protocol
                    proto_num = int(ip_proto) if ip_proto else (6 if (tcp_sp or tcp_dp) else 17 if (udp_sp or udp_dp) else 1)
                    proto_name = "TCP" if proto_num == 6 else ("UDP" if proto_num == 17 else ("ICMP" if proto_num == 1 else f"P-{proto_num}"))

                    # Ports
                    src_port = int(tcp_sp or udp_sp or 0)
                    dst_port = int(tcp_dp or udp_dp or 0)

                    flags_int = 0
                    if tcp_flags:
                        try:
                            flags_int = int(tcp_flags, 16)
                        except Exception:
                            flags_int = 0

                    if not ip_src or not ip_dst:
                        ip_src = "192.168.29.1"
                        ip_dst = "192.168.29.112"

                    self.packets_captured += 1

                    # Canonical flow key
                    tup1 = f"{ip_src}:{src_port}"
                    tup2 = f"{ip_dst}:{dst_port}"
                    flow_key = f"{proto_name}:" + ("<->".join(sorted([tup1, tup2])))

                    with self.lock:
                        if flow_key not in self.active_flows:
                            self.active_flows[flow_key] = FlowRecord(
                                flow_key, ip_src, ip_dst, src_port, dst_port, proto_name, pkt_time
                            )
                        flow = self.active_flows[flow_key]
                        flow.add_packet(ip_src, length, flags_int, pkt_time)

                        # End flow on TCP FIN or RST
                        if flags_int & 0x05:
                            self._emit_flow(flow)
                            del self.active_flows[flow_key]

                except Exception:
                    continue

        except Exception as e:
            print(f"[CaptureService] Worker error: {e}")
        finally:
            self.is_capturing = False

    def _flow_flusher(self):
        while self.is_capturing:
            time.sleep(2.0)
            now = time.time()
            to_flush = []
            with self.lock:
                for key, flow in list(self.active_flows.items()):
                    # Emit flows idle for >= 3 seconds or with > 50 packets
                    if (now - flow.last_time >= 3.0) or (flow.fwd_packets + flow.bwd_packets >= 50):
                        to_flush.append(key)

                for key in to_flush:
                    if key in self.active_flows:
                        self._emit_flow(self.active_flows[key])
                        del self.active_flows[key]

    def _emit_flow(self, flow: FlowRecord):
        total_packets = flow.fwd_packets + flow.bwd_packets
        total_bytes = flow.fwd_bytes + flow.bwd_bytes
        duration = max(flow.last_time - flow.start_time, 0.001)

        fwd_mean = float(np.mean(flow.fwd_lens)) if flow.fwd_lens else 0.0
        fwd_std = float(np.std(flow.fwd_lens)) if len(flow.fwd_lens) > 1 else 0.0
        fwd_max = max(flow.fwd_lens) if flow.fwd_lens else 0
        fwd_min = min(flow.fwd_lens) if flow.fwd_lens else 0

        bwd_mean = float(np.mean(flow.bwd_lens)) if flow.bwd_lens else 0.0
        bwd_std = float(np.std(flow.bwd_lens)) if len(flow.bwd_lens) > 1 else 0.0
        bwd_max = max(flow.bwd_lens) if flow.bwd_lens else 0
        bwd_min = min(flow.bwd_lens) if flow.bwd_lens else 0

        flow_bytes_sec = total_bytes / duration
        flow_pkts_sec = total_packets / duration

        # Default prediction
        predicted_label = "BENIGN"
        confidence = 0.99
        anomaly_score = 0.05

        # ML Inference via Scaler + XGBoost + Isolation Forest
        if xgb_model is not None and scaler_model is not None and feature_names:
            try:
                feat_dict = {f: 0.0 for f in feature_names}
                feat_dict["Destination Port"] = float(flow.dst_port)
                feat_dict["Flow Duration"] = duration * 1e6  # us
                feat_dict["Total Fwd Packets"] = float(flow.fwd_packets)
                feat_dict["Total Backward Packets"] = float(flow.bwd_packets)
                feat_dict["Total Length of Fwd Packets"] = float(flow.fwd_bytes)
                feat_dict["Total Length of Bwd Packets"] = float(flow.bwd_bytes)
                feat_dict["Fwd Packet Length Max"] = float(fwd_max)
                feat_dict["Fwd Packet Length Min"] = float(fwd_min)
                feat_dict["Fwd Packet Length Mean"] = fwd_mean
                feat_dict["Fwd Packet Length Std"] = fwd_std
                feat_dict["Bwd Packet Length Max"] = float(bwd_max)
                feat_dict["Bwd Packet Length Min"] = float(bwd_min)
                feat_dict["Bwd Packet Length Mean"] = bwd_mean
                feat_dict["Bwd Packet Length Std"] = bwd_std
                feat_dict["Flow Bytes/s"] = flow_bytes_sec
                feat_dict["Flow Packets/s"] = flow_pkts_sec
                feat_dict["SYN Flag Count"] = float(flow.syn_count)
                feat_dict["ACK Flag Count"] = float(flow.ack_count)
                feat_dict["FIN Flag Count"] = float(flow.fin_count)
                feat_dict["RST Flag Count"] = float(flow.rst_count)
                feat_dict["Average Packet Size"] = float(total_bytes / max(total_packets, 1))

                vec = np.array([[feat_dict.get(f, 0.0) for f in feature_names]])
                vec_scaled = scaler_model.transform(vec)

                pred_idx = xgb_model.predict(vec_scaled)[0]
                probs = xgb_model.predict_proba(vec_scaled)
                confidence = float(np.max(probs))
                predicted_label = label_mapping.get(str(pred_idx), "BENIGN")

                # Isolation Forest Anomaly Scoring
                if iso_model is not None:
                    # 16 features Isolation Forest was trained on
                    raw_s = iso_model.decision_function(vec_scaled[:, :16])[0]
                    anomaly_score = max(0.0, min(1.0, 0.5 - raw_s))
            except Exception:
                pass

        is_threat = (predicted_label != "BENIGN") or (anomaly_score >= 0.70)
        if is_threat:
            self.threats_detected += 1

            if anomaly_score >= 0.85 or predicted_label in ["DDoS", "DoS Hulk", "Heartbleed"]:
                severity = "critical"
            elif anomaly_score >= 0.65 or predicted_label in ["PortScan", "Bot", "Infiltration"]:
                severity = "high"
            elif anomaly_score >= 0.45 or "Patator" in predicted_label:
                severity = "medium"
            else:
                severity = "low"

            anom_type = predicted_label if predicted_label != "BENIGN" else "Isolation Forest Outlier"
            anom_desc = (
                f"Live {predicted_label} threat detected from {flow.src_ip} -> {flow.dst_ip}:{flow.dst_port} "
                f"({flow.protocol}, {total_bytes:,} bytes, {total_packets} pkts)."
                if predicted_label != "BENIGN" else
                f"Statistical traffic volume outlier flagged by Isolation Forest (score: {anomaly_score:.2f}) on {flow.src_ip} -> {flow.dst_ip}."
            )

            anom_item = {
                "id": f"anom-live-{self.threats_detected:04d}",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(flow.last_time)),
                "src_ip": flow.src_ip,
                "dst_ip": flow.dst_ip,
                "type": anom_type,
                "severity": severity,
                "score": round(anomaly_score if anomaly_score >= 0.5 else confidence, 3),
                "description": anom_desc,
                "status": "active",
                "data_source": "LIVE_CAPTURE",
            }
            self.recent_anomalies.appendleft(anom_item)

        self.flows_processed += 1
        flow_item = {
            "id": f"flow-live-{self.flows_processed:04d}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(flow.last_time)),
            "src_ip": flow.src_ip,
            "dst_ip": flow.dst_ip,
            "src_port": flow.src_port,
            "dst_port": flow.dst_port,
            "protocol": flow.protocol,
            "bytes": total_bytes,
            "packets": total_packets,
            "duration": round(duration, 3),
            "label": predicted_label,
            "confidence": round(confidence, 3),
            "anomaly_score": round(anomaly_score, 3),
            "data_source": "LIVE_CAPTURE",
        }
        self.recent_flows.append(flow_item)


# Global singleton instance
capture_service = CaptureService()
