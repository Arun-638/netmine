# ==============================================================================
# NetMine AI — Live Viva Demonstration & Attack Simulator
#
# Provides 3 foolproof demonstration modes for External Viva evaluation:
#   Mode 1: Live Wire PortScan against authorized target (scanme.nmap.org)
#           -> Emits real TCP packets across your physical Wi-Fi/Ethernet adapter.
#           -> Caught live by TShark sniffer, FlowTracker, and XGBoost.
#   Mode 2: Rapid Volumetric Traffic Burst
#           -> Sends high-rate packet bursts to trigger DoS / Outlier detection.
#   Mode 3: Benchmark Attack Flow Replay (CICIDS2017 Labeled Data)
#           -> Reads real attack flows (DDoS, DoS Hulk, PortScan, Brute Force)
#              from clean parquet and feeds them to the live dashboard.
# ==============================================================================
import argparse
import socket
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))


def mode_live_portscan(target_host="scanme.nmap.org"):
    """
    Mode 1: Probes scanme.nmap.org across 10 ports using raw socket handshakes.
    TShark running in NetMine captures these real SYN probes on the wire.
    """
    print(f"\n[+] Resolving authorized target: {target_host} ...")
    try:
        target_ip = socket.gethostbyname(target_host)
        print(f"[+] Target IP: {target_ip} ({target_host})")
    except socket.gaierror as e:
        print(f"[-] Could not resolve hostname: {e}")
        target_ip = "45.33.32.156"  # Official fallback IP for scanme.nmap.org
        print(f"[!] Using static fallback IP: {target_ip}")

    ports_to_probe = [21, 22, 23, 25, 53, 80, 110, 139, 443, 8080, 8443, 3389]
    print(f"[+] Initiating rapid TCP SYN probe sequence across {len(ports_to_probe)} ports ...")
    print("    Watch your NetMine Dashboard (http://localhost:5173) in real-time!")

    probes_sent = 0
    for p in ports_to_probe:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.35)
        t0 = time.time()
        try:
            # Connect attempt sends a real TCP SYN packet on the local physical network adapter
            s.connect((target_ip, p))
            print(f"    -> Probed port {p:5d}/TCP : OPEN (took {(time.time()-t0)*1000:.1f}ms)")
            s.close()
        except (socket.timeout, ConnectionRefusedError, OSError):
            print(f"    -> Probed port {p:5d}/TCP : CLOSED/FILTERED (SYN transmitted on wire)")
        finally:
            probes_sent += 1
            time.sleep(0.08)  # Rapid 80ms interval = canonical port scan cadence

    print(f"\n[✓] Sent {probes_sent} real wire probes to {target_ip}.")
    print("[✓] Check NetMine Dashboard -> 'Security Threat Alert' banner should now be ACTIVE!")


def mode_volumetric_burst(target_ip="127.0.0.1", port=8080, count=150):
    """
    Mode 2: Sends a high-frequency burst of packets to simulate volumetric rate anomaly.
    """
    print(f"\n[+] Emitting rapid packet rate burst ({count} packets to {target_ip}:{port}) ...")
    for i in range(count):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.sendto(b"NETMINE_TEST_FLOOD_PAYLOAD_" * 4, (target_ip, port))
            s.close()
            if i % 30 == 0:
                print(f"    -> Dispatched {i+1}/{count} datagrams ...")
            time.sleep(0.005)  # 200 packets/second burst
        except Exception:
            pass
    print("[✓] Volumetric flood burst finished. Check Throughput graph & Outlier scores!")


def mode_replay_benchmark(sample_count=15):
    """
    Mode 3: Injects real labeled attack flow vectors from CICIDS2017 clean parquet.
    Guaranteed to trigger multi-class ML detections (DDoS, DoS Hulk, PortScan, etc.).
    """
    from packet_capture.capture_engine import LiveCaptureEngine
    import pandas as pd

    engine = LiveCaptureEngine.get_instance()
    parquet_path = ROOT_DIR / "data" / "processed" / "cicids2017_clean.parquet"

    if not parquet_path.exists():
        print(f"[-] Parquet file not found at {parquet_path}")
        return

    print("\n[+] Loading real benchmark attack vectors from cicids2017_clean.parquet ...")
    df = pd.read_parquet(parquet_path)
    attack_samples = df[df["label"] != "BENIGN"].sample(n=min(sample_count, len(df)), random_state=42)

    print(f"[+] Injecting {len(attack_samples)} real attack vectors into Live Capture Engine ...")

    class MockFlow:
        def __init__(self, row):
            self.src_ip = "172.16.0.1"
            self.dst_ip = "192.168.10.50"
            self.src_port = 49152
            self.dst_port = int(row.get("Destination Port", 80))
            self.protocol = "TCP"
            self.start_time = time.time()
            self.last_time = time.time() + float(row.get("Flow Duration", 1000)) / 1e6
            self.fwd_pkt_lens = [int(row.get("Total Length of Fwd Packets", 100))]
            self.bwd_pkt_lens = [int(row.get("Total Length of Bwd Packets", 0))]
            self.syn_cnt = int(row.get("SYN Flag Count", 1))
            self.rst_cnt = int(row.get("RST Flag Count", 0))
            self.act_data_pkt_fwd = 1
            self._row = row

        def to_feature_vector(self, feature_names):
            import numpy as np
            return np.array([float(self._row.get(k, 0.0)) for k in feature_names], dtype=np.float32)

    for idx, (_, row) in enumerate(attack_samples.iterrows(), 1):
        flow = MockFlow(row)
        engine._classify_and_store_flow(flow)
        print(f"    [{idx:02d}/{len(attack_samples)}] Injected: {row['label']:<25} -> Port {flow.dst_port}")
        time.sleep(0.4)

    print(f"\n[✓] Successfully injected {len(attack_samples)} benchmark attack flows!")
    print("[✓] Open http://localhost:5173/ -> Review Recent Traffic Flows and Security Anomalies!")


def main():
    parser = argparse.ArgumentParser(description="NetMine AI Live Viva Demonstration Tool")
    parser.add_argument("--mode", choices=["1", "2", "3", "all"], default="interactive",
                        help="1: Live Wire PortScan, 2: Volumetric Flood, 3: CICIDS2017 Attack Replay")
    args = parser.parse_args()

    print("=" * 70)
    print("NetMine AI — External Viva Live Demonstration Suite")
    print("=" * 70)

    if args.mode == "interactive":
        print("\nSelect a Demonstration Scenario for your External Examiner:")
        print("  [1] Live Wire PortScan against 'scanme.nmap.org' (REAL PACKETS ON WIRE)")
        print("      -> Authorized target. Emits real TCP SYN probes caught live by TShark.")
        print("  [2] High-Rate Volumetric Burst (DoS & Isolation Forest Outlier)")
        print("      -> Fires rapid datagrams to trigger packet/sec spike & anomaly scores.")
        print("  [3] CICIDS2017 Benchmark Attack Injection (FAILSAFE OFFLINE MODE)")
        print("      -> Injects real DDoS, DoS Hulk, PortScan & Brute Force vectors.")
        print("  [4] Run All Demonstrations in Sequence")
        print("  [0] Exit")

        choice = input("\nEnter choice [1-4]: ").strip()
    else:
        choice = args.mode

    if choice == "1":
        mode_live_portscan()
    elif choice == "2":
        mode_volumetric_burst()
    elif choice == "3":
        mode_replay_benchmark()
    elif choice == "4" or choice == "all":
        mode_live_portscan()
        time.sleep(1)
        mode_volumetric_burst()
        time.sleep(1)
        mode_replay_benchmark()
    else:
        print("Exiting.")


if __name__ == "__main__":
    main()

