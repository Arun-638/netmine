# =========================================================
# NetMine AI — Flow Tracker (Phase 9)
#
# Aggregates raw packet streams into 5-tuple bidirectional flows.
# Computes the 70 CICIDS2017 features in real-time for live
# ML inference.
# =========================================================
import math
import numpy as np


class Flow:
    def __init__(self, src_ip, dst_ip, src_port, dst_port, protocol, start_time):
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port
        self.dst_port = dst_port
        self.protocol = protocol
        self.start_time = start_time
        self.last_time = start_time

        # Forward & Backward packet streams
        self.fwd_pkt_times = [start_time]
        self.bwd_pkt_times = []
        self.fwd_pkt_lens = []
        self.bwd_pkt_lens = []

        # Flags & Headers
        self.fin_cnt = 0
        self.syn_cnt = 0
        self.rst_cnt = 0
        self.psh_cnt = 0
        self.ack_cnt = 0
        self.urg_cnt = 0
        self.fwd_psh = 0
        self.fwd_urg = 0
        self.fwd_hdr_len = 0
        self.bwd_hdr_len = 0
        self.init_win_fwd = 0
        self.init_win_bwd = 0
        self.act_data_pkt_fwd = 0

    def add_packet(self, pkt):
        is_fwd = (pkt["src_ip"] == self.src_ip and pkt["src_port"] == self.src_port)
        t = pkt["time"]
        l = pkt["len"]
        self.last_time = t

        if is_fwd:
            if len(self.fwd_pkt_lens) > 0:
                self.fwd_pkt_times.append(t)
            self.fwd_pkt_lens.append(l)
            self.fwd_hdr_len += 20 if self.protocol == "TCP" else 8
            if l > 0:
                self.act_data_pkt_fwd += 1
            if pkt.get("flags", 0) & 0x08:
                self.fwd_psh += 1
            if pkt.get("flags", 0) & 0x20:
                self.fwd_urg += 1
            if self.init_win_fwd == 0 and "window" in pkt:
                self.init_win_fwd = pkt["window"]
        else:
            self.bwd_pkt_times.append(t)
            self.bwd_pkt_lens.append(l)
            self.bwd_hdr_len += 20 if self.protocol == "TCP" else 8
            if self.init_win_bwd == 0 and "window" in pkt:
                self.init_win_bwd = pkt["window"]

        # Track TCP flags
        flags = pkt.get("flags", 0)
        if flags & 0x01: self.fin_cnt += 1
        if flags & 0x02: self.syn_cnt += 1
        if flags & 0x04: self.rst_cnt += 1
        if flags & 0x08: self.psh_cnt += 1
        if flags & 0x10: self.ack_cnt += 1
        if flags & 0x20: self.urg_cnt += 1

    def to_feature_vector(self, feature_names):
        """Builds 1D numpy array matching exact order of feature_names."""
        duration_sec = max(self.last_time - self.start_time, 1e-6)
        duration_us = duration_sec * 1e6

        tot_fwd_pkts = len(self.fwd_pkt_lens)
        tot_bwd_pkts = len(self.bwd_pkt_lens)
        tot_pkts = tot_fwd_pkts + tot_bwd_pkts

        tot_fwd_bytes = sum(self.fwd_pkt_lens)
        tot_bwd_bytes = sum(self.bwd_pkt_lens)
        tot_bytes = tot_fwd_bytes + tot_bwd_bytes

        all_lens = self.fwd_pkt_lens + self.bwd_pkt_lens
        all_times = sorted(self.fwd_pkt_times + self.bwd_pkt_times)

        # IAT calculations
        flow_iats = [all_times[i] - all_times[i-1] for i in range(1, len(all_times))] if len(all_times) > 1 else [0]
        fwd_iats = [self.fwd_pkt_times[i] - self.fwd_pkt_times[i-1] for i in range(1, len(self.fwd_pkt_times))] if len(self.fwd_pkt_times) > 1 else [0]
        bwd_iats = [self.bwd_pkt_times[i] - self.bwd_pkt_times[i-1] for i in range(1, len(self.bwd_pkt_times))] if len(self.bwd_pkt_times) > 1 else [0]

        feat_dict = {
            "Destination Port": float(self.dst_port),
            "Flow Duration": duration_us,
            "Total Fwd Packets": float(tot_fwd_pkts),
            "Total Backward Packets": float(tot_bwd_pkts),
            "Total Length of Fwd Packets": float(tot_fwd_bytes),
            "Total Length of Bwd Packets": float(tot_bwd_bytes),
            "Fwd Packet Length Max": float(max(self.fwd_pkt_lens)) if self.fwd_pkt_lens else 0.0,
            "Fwd Packet Length Min": float(min(self.fwd_pkt_lens)) if self.fwd_pkt_lens else 0.0,
            "Fwd Packet Length Mean": float(np.mean(self.fwd_pkt_lens)) if self.fwd_pkt_lens else 0.0,
            "Fwd Packet Length Std": float(np.std(self.fwd_pkt_lens)) if self.fwd_pkt_lens else 0.0,
            "Bwd Packet Length Max": float(max(self.bwd_pkt_lens)) if self.bwd_pkt_lens else 0.0,
            "Bwd Packet Length Min": float(min(self.bwd_pkt_lens)) if self.bwd_pkt_lens else 0.0,
            "Bwd Packet Length Mean": float(np.mean(self.bwd_pkt_lens)) if self.bwd_pkt_lens else 0.0,
            "Bwd Packet Length Std": float(np.std(self.bwd_pkt_lens)) if self.bwd_pkt_lens else 0.0,
            "Flow Bytes/s": float(tot_bytes / duration_sec),
            "Flow Packets/s": float(tot_pkts / duration_sec),
            "Flow IAT Mean": float(np.mean(flow_iats) * 1e6),
            "Flow IAT Std": float(np.std(flow_iats) * 1e6),
            "Flow IAT Max": float(np.max(flow_iats) * 1e6),
            "Flow IAT Min": float(np.min(flow_iats) * 1e6),
            "Fwd IAT Total": float(sum(fwd_iats) * 1e6),
            "Fwd IAT Mean": float(np.mean(fwd_iats) * 1e6),
            "Fwd IAT Std": float(np.std(fwd_iats) * 1e6),
            "Fwd IAT Max": float(np.max(fwd_iats) * 1e6),
            "Fwd IAT Min": float(np.min(fwd_iats) * 1e6),
            "Bwd IAT Total": float(sum(bwd_iats) * 1e6),
            "Bwd IAT Mean": float(np.mean(bwd_iats) * 1e6),
            "Bwd IAT Std": float(np.std(bwd_iats) * 1e6),
            "Bwd IAT Max": float(np.max(bwd_iats) * 1e6),
            "Bwd IAT Min": float(np.min(bwd_iats) * 1e6),
            "Fwd PSH Flags": float(self.fwd_psh),
            "Fwd URG Flags": float(self.fwd_urg),
            "Fwd Header Length": float(self.fwd_hdr_len),
            "Bwd Header Length": float(self.bwd_hdr_len),
            "Fwd Packets/s": float(tot_fwd_pkts / duration_sec),
            "Bwd Packets/s": float(tot_bwd_pkts / duration_sec),
            "Min Packet Length": float(min(all_lens)) if all_lens else 0.0,
            "Max Packet Length": float(max(all_lens)) if all_lens else 0.0,
            "Packet Length Mean": float(np.mean(all_lens)) if all_lens else 0.0,
            "Packet Length Std": float(np.std(all_lens)) if all_lens else 0.0,
            "Packet Length Variance": float(np.var(all_lens)) if all_lens else 0.0,
            "FIN Flag Count": float(self.fin_cnt),
            "SYN Flag Count": float(self.syn_cnt),
            "RST Flag Count": float(self.rst_cnt),
            "PSH Flag Count": float(self.psh_cnt),
            "ACK Flag Count": float(self.ack_cnt),
            "URG Flag Count": float(self.urg_cnt),
            "CWE Flag Count": 0.0,
            "ECE Flag Count": 0.0,
            "Down/Up Ratio": float(tot_bwd_pkts / max(tot_fwd_pkts, 1)),
            "Average Packet Size": float(np.mean(all_lens)) if all_lens else 0.0,
            "Avg Fwd Segment Size": float(np.mean(self.fwd_pkt_lens)) if self.fwd_pkt_lens else 0.0,
            "Avg Bwd Segment Size": float(np.mean(self.bwd_pkt_lens)) if self.bwd_pkt_lens else 0.0,
            "Fwd Header Length.1": float(self.fwd_hdr_len),
            "Subflow Fwd Packets": float(tot_fwd_pkts),
            "Subflow Fwd Bytes": float(tot_fwd_bytes),
            "Subflow Bwd Packets": float(tot_bwd_pkts),
            "Subflow Bwd Bytes": float(tot_bwd_bytes),
            "Init_Win_bytes_forward": float(self.init_win_fwd),
            "Init_Win_bytes_backward": float(self.init_win_bwd),
            "act_data_pkt_fwd": float(self.act_data_pkt_fwd),
            "min_seg_size_forward": 20.0,
            "Active Mean": duration_us if duration_sec < 5 else 0.0,
            "Active Std": 0.0,
            "Active Max": duration_us,
            "Active Min": duration_us,
            "Idle Mean": 0.0,
            "Idle Std": 0.0,
            "Idle Max": 0.0,
            "Idle Min": 0.0,
        }

        # Return vector in exact order expected by model
        return np.array([feat_dict.get(k, 0.0) for k in feature_names], dtype=np.float32)


class FlowTracker:
    def __init__(self, timeout_sec=2.0):
        self.timeout_sec = timeout_sec
        self.active_flows = {}  # key -> Flow

    def get_flow_key(self, pkt):
        # Canonical bidirectional flow key
        ip1, ip2 = sorted([pkt["src_ip"], pkt["dst_ip"]])
        p1, p2 = sorted([pkt["src_port"], pkt["dst_port"]])
        return (ip1, ip2, p1, p2, pkt["protocol"])

    def process_packet(self, pkt):
        """
        Processes a packet.
        Returns list of expired/completed Flow objects.
        """
        key = self.get_flow_key(pkt)
        t = pkt["time"]

        expired = []
        # Check expired flows
        dead_keys = []
        for k, flow in list(self.active_flows.items()):
            if t - flow.last_time > self.timeout_sec:
                expired.append(flow)
                dead_keys.append(k)
        for k in dead_keys:
            del self.active_flows[k]

        # Add or update flow
        if key not in self.active_flows:
            self.active_flows[key] = Flow(
                src_ip=pkt["src_ip"],
                dst_ip=pkt["dst_ip"],
                src_port=pkt["src_port"],
                dst_port=pkt["dst_port"],
                protocol=pkt["protocol"],
                start_time=t,
            )

        flow = self.active_flows[key]
        flow.add_packet(pkt)

        # Check TCP FIN or RST flag for immediate flow completion
        flags = pkt.get("flags", 0)
        if flags & 0x01 or flags & 0x04:  # FIN or RST
            expired.append(flow)
            del self.active_flows[key]

        return expired

    def flush(self):
        """Flushes all currently active flows."""
        flows = list(self.active_flows.values())
        self.active_flows.clear()
        return flows
