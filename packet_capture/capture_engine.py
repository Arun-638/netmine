# =========================================================
# NetMine AI — Real-Time Capture & Live ML Inference Engine
#
# Phase 9:
#   - Captures live packets using TShark on Windows
#   - Reassembles bidirectional network flows
#   - Runs real-time inference via XGBoost & Isolation Forest
#   - Broadcasts real-time events to FastAPI & WebSockets
# =========================================================
import asyncio
import collections
import ipaddress
import json
import os
import re
import socket
import subprocess
import threading
import time
from pathlib import Path
import joblib
import numpy as np

from packet_capture.flow_tracker import FlowTracker

ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"
DATA_DIR = ROOT / "data" / "processed"


class LiveCaptureEngine:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.is_running = False
        self.interface = "3"
        self.interface_name = "Wi-Fi"
        self.process = None
        self.worker_thread = None

        # Statistics
        self.start_time = 0.0
        self.total_packets = 0
        self.total_bytes = 0
        self.total_flows = 0
        self.attack_count = 0
        self.packets_per_sec = 0.0
        self.bytes_per_sec = 0.0
        self._last_stats_calc = time.time()
        self._recent_pkts = 0
        self._recent_bytes = 0

        # Ring buffer of recent classified flows & anomalies
        self.recent_flows = collections.deque(maxlen=200)
        self.recent_anomalies = collections.deque(maxlen=200)
        self.throughput_history = collections.deque(maxlen=60)
        self._scan_tracker = collections.defaultdict(lambda: collections.deque(maxlen=150))
        self._active_scanners: dict[tuple[str, str], float] = {}  # (src_ip, dst_ip) -> expiry_timestamp
        self.lock = threading.Lock()

        # Live device tracking & hardware mapping
        self._live_devices: dict[str, dict] = {}
        self._ip_mac_map: dict[str, str] = {}
        self._hostname_cache: dict[str, str] = {}
        try:
            self._local_hostname = socket.gethostname()
            self._local_ip = socket.gethostbyname(self._local_hostname)
        except Exception:
            self._local_hostname = "NetMine-Host"
            self._local_ip = "127.0.0.1"

        # Auto-detect default interface (prefer Wi-Fi or active Ethernet)
        try:
            for iface in self.list_interfaces():
                if iface.get("is_default"):
                    self.interface = str(iface["id"])
                    self.interface_name = iface["name"]
                    break
        except Exception:
            pass

        # ML Models
        self.models_loaded = False
        self.xgb_model = None
        self.scaler = None
        self.iso_model = None
        self.feature_names = []
        self.label_map = {}
        self.load_models()

        # Connected WebSocket listeners
        self.subscribers = set()

    def load_models(self):
        try:
            xgb_path = MODELS_DIR / "xgboost.joblib"
            scaler_path = MODELS_DIR / "scaler.joblib"
            iso_path = MODELS_DIR / "isolation_forest.joblib"
            ml_json = DATA_DIR / "ml_results.json"

            if xgb_path.exists() and scaler_path.exists() and ml_json.exists():
                self.xgb_model = joblib.load(xgb_path)
                self.scaler = joblib.load(scaler_path)
                if iso_path.exists():
                    self.iso_model = joblib.load(iso_path)

                with open(ml_json, encoding="utf-8") as f:
                    data = json.load(f)
                    self.feature_names = data["feature_names"]
                    self.label_map = data["label_mapping"]

                self.models_loaded = True
                print("[CaptureEngine] ML models loaded successfully for live inference.")
        except Exception as e:
            print(f"[CaptureEngine] Error loading models: {e}")

    def list_interfaces(self):
        """Discovers available capture interfaces via tshark -D."""
        interfaces = []
        try:
            res = subprocess.run(["tshark", "-D"], capture_output=True, text=True, timeout=5)
            for line in res.stdout.strip().split("\n"):
                if not line.strip():
                    continue
                match = re.match(r"^(\d+)\.\s+(.*)", line.strip())
                if match:
                    idx = match.group(1)
                    raw_name = match.group(2)
                    # Extract friendly name in parenthesis if available
                    name_match = re.search(r"\((.*?)\)", raw_name)
                    friendly_name = name_match.group(1) if name_match else raw_name
                    interfaces.append({
                        "id": idx,
                        "device": raw_name,
                        "name": friendly_name,
                        "is_default": "Wi-Fi" in friendly_name,
                    })
        except Exception as e:
            print(f"[CaptureEngine] Error detecting interfaces: {e}")

        if not interfaces:
            interfaces.append({"id": "3", "device": "Wi-Fi", "name": "Wi-Fi", "is_default": True})
        return interfaces

    @staticmethod
    def _is_valid_device_ip(ip_str: str) -> bool:
        """Validates that an IP is a real unicast host, excluding multicast, broadcast, loopback, and zero IPs."""
        if not ip_str or ip_str in ("0.0.0.0", "::", "localhost", "none"):
            return False
        if "," in ip_str:
            ip_str = ip_str.split(",")[0].strip()
        try:
            ip = ipaddress.ip_address(ip_str)
            if ip.is_multicast or ip.is_unspecified or ip.is_loopback:
                return False
            if isinstance(ip, ipaddress.IPv4Address):
                if ip_str == "255.255.255.255" or ip_str.endswith(".255"):
                    return False
            return True
        except ValueError:
            return False

    @staticmethod
    def _is_local_lan_ip(ip_str: str) -> bool:
        """Checks if an IP belongs to a private or link-local subnet (same local network)."""
        if not ip_str or ip_str in ("0.0.0.0", "::", "localhost", "none"):
            return False
        if "," in ip_str:
            ip_str = ip_str.split(",")[0].strip()
        try:
            ip = ipaddress.ip_address(ip_str)
            if ip.is_multicast or ip.is_unspecified or ip.is_loopback:
                return False
            if isinstance(ip, ipaddress.IPv4Address):
                if ip_str == "255.255.255.255" or ip_str.endswith(".255"):
                    return False
            return ip.is_private or ip.is_link_local
        except ValueError:
            return False

    def _is_this_machine_ip(self, ip_str: str) -> bool:
        """Checks if the given IP belongs to the local machine hosting the application."""
        if not ip_str:
            return False
        if ip_str in ("127.0.0.1", "::1", "localhost", self._local_ip):
            return True
        return False

    def _refresh_arp_cache(self) -> dict[str, str]:
        """Reads the Windows ARP table to map IPv4 addresses to physical MAC addresses."""
        table = {}
        try:
            out = subprocess.check_output(["arp", "-a"], text=True, timeout=2)
            for line in out.splitlines():
                p = line.strip().split()
                if len(p) >= 3 and "-" in p[1]:
                    mac = p[1].replace("-", ":").lower()
                    if not mac.startswith("ff:ff:ff") and not mac.startswith("01:00:5e"):
                        table[p[0]] = mac
        except Exception:
            pass
        return table

    def _resolve_hostname(self, ip_str: str) -> str:
        """Resolves friendly hostnames or returns a clean device role."""
        if ip_str in self._hostname_cache:
            return self._hostname_cache[ip_str]
        if ip_str == self._local_ip:
            name = f"{self._local_hostname} (This Device)"
            self._hostname_cache[ip_str] = name
            return name
        if ip_str.endswith(".1") and (ip_str.startswith("192.168.") or ip_str.startswith("10.") or ip_str.startswith("172.")):
            name = "Default Gateway"
            self._hostname_cache[ip_str] = name
            return name
        try:
            host, _, _ = socket.gethostbyaddr(ip_str)
            self._hostname_cache[ip_str] = host
            return host
        except Exception:
            self._hostname_cache[ip_str] = ip_str
            return ip_str

    def start_capture(self, interface=None, interface_name=None):
        if self.is_running:
            return {"status": "already_running", "interface": self.interface_name}

        if interface:
            self.interface = str(interface)
        if interface_name:
            self.interface_name = interface_name
        self.is_running = True
        self.start_time = time.time()
        self.total_packets = 0
        self.total_bytes = 0
        self.total_flows = 0
        self.attack_count = 0
        self._recent_pkts = 0
        self._recent_bytes = 0
        self._last_stats_calc = time.time()

        self.worker_thread = threading.Thread(target=self._capture_worker, daemon=True)
        self.worker_thread.start()
        print(f"[CaptureEngine] Started live capture on interface {self.interface} ({self.interface_name})")
        return {"status": "started", "interface": self.interface_name, "id": self.interface}

    def stop_capture(self):
        if not self.is_running:
            return {"status": "not_running"}

        self.is_running = False
        if self.process:
            try:
                self.process.terminate()
                self.process.kill()
            except Exception:
                pass
            self.process = None

        print("[CaptureEngine] Stopped live capture.")
        return {"status": "stopped", "total_packets": self.total_packets, "total_flows": self.total_flows}

    def _capture_worker(self):
        tracker = FlowTracker(timeout_sec=2.0)

        cmd = [
            "tshark", "-i", self.interface,
            "-l",
            "-T", "fields",
            "-e", "frame.time_epoch",
            "-e", "ip.src",
            "-e", "ipv6.src",
            "-e", "ip.dst",
            "-e", "ipv6.dst",
            "-e", "_ws.col.Protocol",
            "-e", "tcp.srcport",
            "-e", "udp.srcport",
            "-e", "tcp.dstport",
            "-e", "udp.dstport",
            "-e", "frame.len",
            "-e", "tcp.flags",
            "-e", "tcp.window_size_value",
            "-e", "eth.src",
            "-e", "eth.dst",
            "-e", "tcp.len",
        ]

        try:
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                bufsize=1,
            )
        except Exception as e:
            print(f"[CaptureEngine] Failed to launch tshark: {e}")
            self.is_running = False
            return

        while self.is_running and self.process and self.process.poll() is None:
            line = self.process.stdout.readline()
            if not line:
                break

            parts = line.strip().split("\t")
            if len(parts) < 7:
                continue

            try:
                epoch = float(parts[0]) if parts[0] else time.time()
                src_ip = parts[1] if parts[1] else (parts[2] if len(parts) > 2 and parts[2] else "0.0.0.0")
                dst_ip = parts[3] if len(parts) > 3 and parts[3] else (parts[4] if len(parts) > 4 and parts[4] else "0.0.0.0")
                proto = parts[5] if len(parts) > 5 and parts[5] else "TCP"

                sport = int(parts[6]) if len(parts) > 6 and parts[6] else (int(parts[7]) if len(parts) > 7 and parts[7] else 0)
                dport = int(parts[8]) if len(parts) > 8 and parts[8] else (int(parts[9]) if len(parts) > 9 and parts[9] else 0)
                pkt_len = int(parts[10]) if len(parts) > 10 and parts[10] else 60

                flags = 0
                if len(parts) > 11 and parts[11]:
                    try:
                        flags = int(parts[11], 16)
                    except ValueError:
                        flags = 0

                win = int(parts[12]) if len(parts) > 12 and parts[12] else 0

                # Ethernet MAC addresses
                eth_src = parts[13].strip().lower() if len(parts) > 13 and parts[13] else ""
                eth_dst = parts[14].strip().lower() if len(parts) > 14 and parts[14] else ""
                if eth_src and self._is_valid_device_ip(src_ip) and not eth_src.startswith("ff:ff:ff") and not eth_src.startswith("01:00:5e"):
                    self._ip_mac_map[src_ip] = eth_src
                if eth_dst and self._is_valid_device_ip(dst_ip) and not eth_dst.startswith("ff:ff:ff") and not eth_dst.startswith("01:00:5e"):
                    self._ip_mac_map[dst_ip] = eth_dst

                # TCP application data payload length
                tcp_len = None
                if len(parts) > 15 and parts[15]:
                    try:
                        tcp_len = int(parts[15].split(",")[0].strip())
                    except ValueError:
                        tcp_len = 0

                payload_len = tcp_len if tcp_len is not None else (0 if proto == "TCP" else max(0, pkt_len - 28))

                pkt = {
                    "time": epoch,
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "protocol": proto,
                    "src_port": sport,
                    "dst_port": dport,
                    "len": pkt_len,
                    "payload_len": payload_len,
                    "flags": flags,
                    "window": win,
                }

                # Update live stats
                self.total_packets += 1
                self.total_bytes += pkt_len
                self._recent_pkts += 1
                self._recent_bytes += pkt_len

                # Update throughput calculations every 1.0 second
                now = time.time()
                if now - self._last_stats_calc >= 1.0:
                    delta = now - self._last_stats_calc
                    self.packets_per_sec = round(self._recent_pkts / delta, 1)
                    self.bytes_per_sec = round(self._recent_bytes / delta, 1)
                    self._recent_pkts = 0
                    self._recent_bytes = 0
                    self._last_stats_calc = now
                    with self.lock:
                        self.throughput_history.append({
                            "time": time.strftime("%H:%M:%S", time.localtime(now)),
                            "packets_per_sec": self.packets_per_sec,
                            "bytes_per_sec": self.bytes_per_sec,
                            "anomalies": self.attack_count,
                        })

                # Feed packet to flow tracker
                completed_flows = tracker.process_packet(pkt)
                for f in completed_flows:
                    self._classify_and_store_flow(f)

            except Exception:
                continue

        # Flush remaining flows on stop
        for f in tracker.flush():
            self._classify_and_store_flow(f)

        self.is_running = False

    def _classify_and_store_flow(self, flow):
        self.total_flows += 1
        predicted_label = "BENIGN"
        confidence = 0.99
        anomaly_score = 0.05

        if self.models_loaded and len(self.feature_names) == 70:
            try:
                x_vec = flow.to_feature_vector(self.feature_names).reshape(1, -1)
                x_scaled = self.scaler.transform(x_vec)

                pred_idx = int(self.xgb_model.predict(x_scaled)[0])
                predicted_label = self.label_map.get(str(pred_idx), "BENIGN")

                proba_arr = self.xgb_model.predict_proba(x_scaled)[0]
                confidence = float(np.max(proba_arr))

                if self.iso_model:
                    raw_s = float(self.iso_model.decision_function(x_scaled[:, :16])[0])
                    anomaly_score = float(np.clip(1.0 - (raw_s + 0.5), 0.0, 1.0))
            except Exception as e:
                pass

        # ── Behavioral PortScan Correlator ──────────────────────
        # An individual TCP SYN probe in isolation looks identical to
        # the start of a benign handshake to a static per-flow classifier.
        # But an IP scanning multiple distinct ports within a short window
        # is the canonical signature of a real-world PortScan (Nmap, Zenmap, mobile TCP sweeps).
        # We track destination ports probed per (src_ip, dst_ip) pair within a 20-second sliding window.
        is_loopback = (
            flow.src_ip in ("127.0.0.1", "::1", "localhost", "0.0.0.0") or
            flow.dst_ip in ("127.0.0.1", "::1", "localhost", "0.0.0.0") or
            flow.src_ip.startswith("127.") or
            flow.dst_ip.startswith("127.")
        )

        distinct_probed_ports = set()
        if not is_loopback:
            now_ts = flow.last_time if flow.last_time > 0 else time.time()
            pair_key = (flow.src_ip, flow.dst_ip)
            is_active_scanner = (now_ts < self._active_scanners.get(pair_key, 0))

            q = self._scan_tracker[pair_key]
            while q and (now_ts - q[0]["time"]) > 20.0:
                q.popleft()
            q.append({
                "time": now_ts,
                "dst_port": flow.dst_port,
                "syn": flow.syn_cnt,
                "rst": flow.rst_cnt,
                "act_data": flow.act_data_pkt_fwd,
            })
            # A reconnaissance probe transmits minimal or zero application payload
            distinct_probed_ports = {item["dst_port"] for item in q if item["act_data"] <= 1}

            # A port scan probes 4 or more distinct ports within 20 seconds, or matches PortScan ML signature
            is_portscan_detected = (
                len(distinct_probed_ports) >= 4 or
                is_active_scanner or
                (predicted_label == "PortScan")
            )
            if is_portscan_detected:
                # Mark scanner as active for the next 25 seconds
                self._active_scanners[pair_key] = now_ts + 25.0
                predicted_label = "PortScan"
                confidence = max(confidence, 0.98)
                anomaly_score = max(anomaly_score, 0.94)

                # Retroactively upgrade any previous probes from this sweep in recent_flows
                with self.lock:
                    for rf in self.recent_flows:
                        if rf["src_ip"] == flow.src_ip and rf["dst_ip"] == flow.dst_ip and rf["label"] != "PortScan":
                            rf["label"] = "PortScan"
                            rf["confidence"] = 0.98
                            rf["anomaly_score"] = 0.94

        # ── Standard LAN control and discovery protocols are not cyber attacks ──
        is_lan_control = (
            flow.protocol in ("ICMPv6", "IGMP", "IGMPv3", "ARP", "DHCP", "DHCPv6", "MDNS", "LLMNR", "SSDP") or
            flow.dst_port in (5353, 5355, 1900, 67, 68, 546, 547)
        )
        if is_lan_control and predicted_label != "BENIGN":
            predicted_label = "BENIGN"
            anomaly_score = min(anomaly_score, 0.15)

        is_threat = (predicted_label != "BENIGN") or (anomaly_score >= 0.70)
        if is_threat and not is_lan_control:
            self.attack_count += 1

            if anomaly_score >= 0.85 or predicted_label in ["DDoS", "DoS Hulk", "Heartbleed"]:
                severity = "critical"
            elif anomaly_score >= 0.65 or predicted_label in ["PortScan", "Bot", "Infiltration"]:
                severity = "high"
            elif anomaly_score >= 0.45 or "Patator" in predicted_label:
                severity = "medium"
            else:
                severity = "low"

            tot_b = sum(flow.fwd_pkt_lens) + sum(flow.bwd_pkt_lens)
            tot_p = len(flow.fwd_pkt_lens) + len(flow.bwd_pkt_lens)
            if predicted_label == "PortScan":
                num_ports = len(distinct_probed_ports) if distinct_probed_ports else 1
                anom_desc = (
                    f"Live PortScan sweep detected from {flow.src_ip} -> {flow.dst_ip} "
                    f"probing {num_ports} distinct ports (latest: port {flow.dst_port}/{flow.protocol})."
                )
            elif predicted_label != "BENIGN":
                anom_desc = (
                    f"Live wire {predicted_label} threat detected from {flow.src_ip} -> {flow.dst_ip}:{flow.dst_port} "
                    f"({flow.protocol}, {tot_b:,} bytes, {tot_p} pkts)."
                )
            else:
                anom_desc = (
                    f"Isolation Forest volume outlier (score: {anomaly_score:.2f}) on {flow.src_ip} -> {flow.dst_ip}:{flow.dst_port}."
                )

            anom_record = {
                "id": f"anom-live-{self.attack_count}",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(flow.start_time)),
                "src_ip": flow.src_ip,
                "dst_ip": flow.dst_ip,
                "type": predicted_label if predicted_label != "BENIGN" else "Isolation Forest Outlier",
                "severity": severity,
                "score": round(anomaly_score if anomaly_score >= 0.5 else confidence, 3),
                "description": anom_desc,
                "status": "active",
                "data_source": "LIVE_CAPTURE",
            }
            with self.lock:
                self.recent_anomalies.appendleft(anom_record)

        flow_record = {
            "id": f"flow-live-{self.total_flows}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(flow.start_time)),
            "src_ip": flow.src_ip,
            "dst_ip": flow.dst_ip,
            "src_port": flow.src_port,
            "dst_port": flow.dst_port,
            "protocol": flow.protocol,
            "bytes": sum(flow.fwd_pkt_lens) + sum(flow.bwd_pkt_lens),
            "packets": len(flow.fwd_pkt_lens) + len(flow.bwd_pkt_lens),
            "duration": round(max(flow.last_time - flow.start_time, 0.001), 3),
            "label": predicted_label,
            "confidence": round(confidence, 3),
            "anomaly_score": round(anomaly_score, 3),
            "data_source": "LIVE_CAPTURE",
        }

        with self.lock:
            self.recent_flows.appendleft(flow_record)
            # Update live device registry only for valid unicast host endpoints
            tot_fwd_b = sum(flow.fwd_pkt_lens)
            tot_fwd_p = len(flow.fwd_pkt_lens)
            tot_bwd_b = sum(flow.bwd_pkt_lens)
            tot_bwd_p = len(flow.bwd_pkt_lens)
            # Update live device registry ONLY for local LAN / Wi-Fi endpoints (never external web servers)
            endpoints = []
            if self._is_local_lan_ip(flow.src_ip):
                endpoints.append((flow.src_ip, tot_fwd_b, tot_fwd_p))
            if self._is_local_lan_ip(flow.dst_ip) and flow.dst_ip != flow.src_ip:
                endpoints.append((flow.dst_ip, tot_bwd_b, tot_bwd_p))

            for ip, b, p in endpoints:
                if ip not in self._live_devices:
                    self._live_devices[ip] = {
                        "bytes": 0,
                        "packets": 0,
                        "protocols": set(),
                        "last_seen": flow.last_time,
                        "first_seen": flow.start_time,
                        "status": "active",
                    }
                dev = self._live_devices[ip]
                dev["bytes"] += b
                dev["packets"] += p
                dev["protocols"].add(flow.protocol)
                dev["last_seen"] = max(dev["last_seen"], flow.last_time)

            # Mark as suspicious only for verified external threats (never the user's own machine)
            if is_threat and predicted_label != "BENIGN" and not is_lan_control:
                attacker_ip = flow.src_ip
                if self._is_valid_device_ip(attacker_ip) and attacker_ip in self._live_devices:
                    if not self._is_this_machine_ip(attacker_ip):
                        self._live_devices[attacker_ip]["status"] = "suspicious"

    def get_status(self):
        duration = round(time.time() - self.start_time, 1) if self.is_running else 0.0
        return {
            "active": self.is_running,
            "interface": self.interface_name,
            "interface_id": self.interface,
            "duration_seconds": duration,
            "packets_captured": self.total_packets,
            "bytes_captured": self.total_bytes,
            "flows_analyzed": self.total_flows,
            "attacks_detected": self.attack_count,
            "packets_per_sec": self.packets_per_sec,
            "bytes_per_sec": self.bytes_per_sec,
            "models_active": self.models_loaded,
        }

    def get_recent_flows(self, limit=50):
        with self.lock:
            return list(self.recent_flows)[:limit]

    def get_recent_anomalies(self, limit=50):
        with self.lock:
            return list(self.recent_anomalies)[:limit]

    def add_anomaly(self, anom):
        with self.lock:
            self.attack_count += 1
            if "id" not in anom:
                anom["id"] = f"anom-live-{self.attack_count}"
            if "timestamp" not in anom:
                anom["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            if "status" not in anom:
                anom["status"] = "active"
            if "data_source" not in anom:
                anom["data_source"] = "LIVE_CAPTURE"
            self.recent_anomalies.appendleft(anom)
            return anom

    def update_anomaly_status(self, anom_id, new_status):
        with self.lock:
            for a in self.recent_anomalies:
                if a.get("id") == anom_id:
                    a["status"] = new_status
                    return True
            return False

    def clear_anomalies(self):
        with self.lock:
            self.recent_anomalies.clear()
            self._scan_tracker.clear()
            self._active_scanners.clear()

    def clear_flows(self):
        with self.lock:
            self.recent_flows.clear()
            self.recent_anomalies.clear()
            self.throughput_history.clear()
            self._scan_tracker.clear()
            self._active_scanners.clear()
            self._live_devices.clear()
            self._ip_mac_map.clear()
            self.total_flows = 0
            self.total_packets = 0
            self.total_bytes = 0
            self.attack_count = 0
            self._recent_pkts = 0
            self._recent_bytes = 0
            self.packets_per_sec = 0.0
            self.bytes_per_sec = 0.0
        return {"status": "cleared"}

    def get_live_devices(self) -> list[dict]:
        """Return live devices derived from recent captured flows."""
        cutoff = time.time() - 300  # 5-minute active window
        arp = self._refresh_arp_cache()
        with self.lock:
            devices = []
            for ip, d in self._live_devices.items():
                if not self._is_valid_device_ip(ip):
                    continue
                status = d["status"]
                if d["last_seen"] < cutoff and status != "suspicious":
                    status = "inactive"

                mac = self._ip_mac_map.get(ip) or arp.get(ip) or d.get("mac") or "--:--:--:--:--:--"
                hostname = self._resolve_hostname(ip)
                is_local = False
                try:
                    ip_obj = ipaddress.ip_address(ip)
                    is_local = ip_obj.is_private or ip_obj.is_link_local
                except Exception:
                    pass

                clean_id = f"dev-{ip.replace(':', '-').replace('.', '-')}"
                devices.append({
                    "id": clean_id,
                    "ip": ip,
                    "mac": mac,
                    "hostname": hostname,
                    "total_bytes": d["bytes"],
                    "total_packets": d["packets"],
                    "protocols": sorted(list(d["protocols"])),
                    "last_seen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(d["last_seen"])),
                    "first_seen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(d["first_seen"])),
                    "status": status,
                    "is_local": is_local,
                })
            # Sort: suspicious first, then local devices, then by bytes desc
            devices.sort(key=lambda x: (
                0 if x["status"] == "suspicious" else 1 if x["is_local"] else 2,
                -x["total_bytes"]
            ))
            return devices

    def get_live_protocol_stats(self) -> list[dict]:
        """Compute protocol distribution from recent_flows in-memory."""
        counts: dict[str, dict] = {}
        with self.lock:
            for f in self.recent_flows:
                proto = f.get("protocol", "TCP")
                b = f.get("bytes", 0)
                p = f.get("packets", 0)
                if proto not in counts:
                    counts[proto] = {"packets": 0, "bytes": 0}
                counts[proto]["packets"] += p
                counts[proto]["bytes"] += b

        if not counts:
            return []
        total_pkts = sum(v["packets"] for v in counts.values()) or 1
        result = [
            {
                "protocol": proto,
                "packets": v["packets"],
                "bytes": v["bytes"],
                "percentage": round((v["packets"] / total_pkts) * 100, 1),
            }
            for proto, v in counts.items()
        ]
        result.sort(key=lambda x: x["packets"], reverse=True)
        return result

    def get_throughput_history(self, limit: int = 30) -> list[dict]:
        """Return rolling history of throughput data points for real-time trend charts."""
        with self.lock:
            history = list(self.throughput_history)
        now = time.time()
        # If history has fewer than 2 points, generate a rolling baseline so charts render a smooth line
        if len(history) < 2:
            pps = self.packets_per_sec
            bps = self.bytes_per_sec
            anom = self.attack_count
            points = []
            count = 12 if self.is_running else 6
            for i in range(count, 0, -1):
                t_str = time.strftime("%H:%M:%S", time.localtime(now - (i * 2)))
                factor = 1.0 if not self.is_running else (0.88 + ((i % 3) * 0.08))
                points.append({
                    "time": t_str,
                    "packets_per_sec": round(pps * factor, 1) if self.is_running else 0.0,
                    "bytes_per_sec": round(bps * factor, 1) if self.is_running else 0.0,
                    "anomalies": anom,
                })
            points.append({
                "time": time.strftime("%H:%M:%S", time.localtime(now)),
                "packets_per_sec": pps,
                "bytes_per_sec": bps,
                "anomalies": anom,
            })
            return points[-limit:]
        return history[-limit:]

