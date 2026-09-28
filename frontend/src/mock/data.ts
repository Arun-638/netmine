import type {
  TrafficFlow, Anomaly, Device, ProtocolStat,
  TrafficTrendPoint, Cluster, AssociationRule,
  MLMetrics, SystemStatus, MetricCardData,
} from "../types";

export const mockSystemStatus: SystemStatus = {
  captureActive: false,
  captureRate: 0,
  processingRate: 0,
  queueSize: 0,
  droppedPackets: 0,
  processingLatencyMs: 0,
  uptime: "00:00:00",
  dataSource: "DEMO",
};

export const mockMetricCards: MetricCardData[] = [
  { id: "total-packets",  title: "Total Packets",     value: "2,847,392", unit: "pkts",  change: 12.4, trend: "up"      },
  { id: "total-bytes",    title: "Total Bytes",       value: "18.3",      unit: "GB",    change: 8.7,  trend: "up"      },
  { id: "packets-sec",    title: "Packets / sec",     value: "1,247",     unit: "pkt/s", change: -3.2, trend: "down"    },
  { id: "active-devices", title: "Active Devices",    value: "42",        unit: "hosts", change: 2.1,  trend: "up"      },
  { id: "anomalies",      title: "Active Anomalies",  value: "7",         unit: "alerts",change: -12,  trend: "down"    },
  { id: "net-health",     title: "Network Health",    value: "94",        unit: "%",     change: 1.5,  trend: "up"      },
];

export const mockTrafficTrend: TrafficTrendPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, "0")}:00`,
  packetsPerSec: Math.floor(800 + Math.random() * 800 + (i > 8 && i < 18 ? 600 : 0)),
  bytesPerSec:   Math.floor(500_000 + Math.random() * 1_000_000),
  anomalies:     Math.floor(Math.random() * (i === 14 ? 12 : 3)),
}));

export const mockProtocols: ProtocolStat[] = [
  { protocol: "TCP",   packets: 1_823_000, bytes: 12_400_000_000, percentage: 64 },
  { protocol: "UDP",   packets:   712_000, bytes:  3_200_000_000, percentage: 25 },
  { protocol: "ICMP",  packets:   198_000, bytes:    320_000_000, percentage:  7 },
  { protocol: "DNS",   packets:    82_000, bytes:    180_000_000, percentage:  3 },
  { protocol: "Other", packets:    32_000, bytes:     40_000_000, percentage:  1 },
];

export const mockFlows: TrafficFlow[] = [
  { id:"f1", timestamp:"2026-09-28T05:00:01Z", srcIp:"192.168.1.10", dstIp:"8.8.8.8",       srcPort:54231, dstPort:53,   protocol:"UDP",  bytes:248,      packets:2,  duration:0.1,  label:"BENIGN",    confidence:0.98 },
  { id:"f2", timestamp:"2026-09-28T05:00:03Z", srcIp:"192.168.1.22", dstIp:"104.18.22.1",   srcPort:49812, dstPort:443,  protocol:"TCP",  bytes:18432,    packets:24, duration:2.4,  label:"BENIGN",    confidence:0.97 },
  { id:"f3", timestamp:"2026-09-28T05:00:07Z", srcIp:"10.0.0.5",     dstIp:"192.168.1.1",   srcPort:12340, dstPort:80,   protocol:"TCP",  bytes:2048,     packets:8,  duration:0.8,  label:"PortScan",  confidence:0.89 },
  { id:"f4", timestamp:"2026-09-28T05:00:12Z", srcIp:"192.168.1.33", dstIp:"172.217.0.1",   srcPort:58901, dstPort:443,  protocol:"TCP",  bytes:104857,   packets:88, duration:5.2,  label:"BENIGN",    confidence:0.96 },
  { id:"f5", timestamp:"2026-09-28T05:00:15Z", srcIp:"10.0.0.99",    dstIp:"192.168.1.100", srcPort:65432, dstPort:22,   protocol:"TCP",  bytes:512,      packets:4,  duration:0.2,  label:"SSHBrute",  confidence:0.82 },
  { id:"f6", timestamp:"2026-09-28T05:00:18Z", srcIp:"192.168.1.5",  dstIp:"1.1.1.1",       srcPort:52201, dstPort:53,   protocol:"UDP",  bytes:180,      packets:1,  duration:0.05, label:"BENIGN",    confidence:0.99 },
  { id:"f7", timestamp:"2026-09-28T05:00:22Z", srcIp:"192.168.1.88", dstIp:"192.168.1.1",   srcPort:34567, dstPort:3389, protocol:"TCP",  bytes:1024,     packets:6,  duration:0.5,  label:"RDPAttack", confidence:0.77 },
  { id:"f8", timestamp:"2026-09-28T05:00:30Z", srcIp:"192.168.1.77", dstIp:"216.58.0.1",    srcPort:56712, dstPort:80,   protocol:"TCP",  bytes:32768,    packets:32, duration:3.1,  label:"BENIGN",    confidence:0.95 },
];

export const mockAnomalies: Anomaly[] = [
  { id:"a1", timestamp:"2026-09-28T04:58:12Z", srcIp:"10.0.0.5",     dstIp:"192.168.1.1",   type:"Port Scan",           severity:"high",     score:0.91, description:"Sequential port scanning detected across 128 ports.",               status:"active"        },
  { id:"a2", timestamp:"2026-09-28T05:00:15Z", srcIp:"10.0.0.99",    dstIp:"192.168.1.100", type:"SSH Brute Force",     severity:"high",     score:0.87, description:"Repeated SSH login attempts — 47 failures in 60 seconds.",          status:"investigating" },
  { id:"a3", timestamp:"2026-09-28T05:00:22Z", srcIp:"192.168.1.88", dstIp:"192.168.1.1",   type:"Unusual RDP",         severity:"medium",   score:0.76, description:"RDP connection attempt from internal host at unusual hour.",         status:"active"        },
  { id:"a4", timestamp:"2026-09-28T03:12:04Z", srcIp:"172.16.0.200", dstIp:"10.0.0.1",      type:"Large Data Transfer", severity:"medium",   score:0.68, description:"Unusually large outbound transfer (>2 GB in 5 minutes).",          status:"resolved"      },
  { id:"a5", timestamp:"2026-09-28T02:44:33Z", srcIp:"192.168.1.50", dstIp:"185.10.5.22",   type:"Suspicious DNS",      severity:"low",      score:0.55, description:"DNS queries to known DGA-pattern domains.",                         status:"resolved"      },
  { id:"a6", timestamp:"2026-09-28T04:30:10Z", srcIp:"10.0.0.77",    dstIp:"192.168.1.255", type:"Broadcast Flood",     severity:"critical", score:0.94, description:"High-volume broadcast traffic consistent with network flooding.",   status:"active"        },
  { id:"a7", timestamp:"2026-09-28T05:01:00Z", srcIp:"192.168.1.15", dstIp:"10.0.0.88",     type:"ICMP Tunnel",         severity:"medium",   score:0.71, description:"Anomalous ICMP payload sizes suggesting covert channel usage.",     status:"investigating" },
];

export const mockDevices: Device[] = [
  { id:"d1", ip:"192.168.1.1",   hostname:"gateway",          firstSeen:"2026-09-28T00:00:01Z", lastSeen:"2026-09-28T05:02:00Z", totalBytes:4_294_967_296, totalPackets:3_200_000, protocols:["TCP","UDP","ICMP"], status:"active"     },
  { id:"d2", ip:"192.168.1.10",  hostname:"arun-laptop",      firstSeen:"2026-09-28T00:01:00Z", lastSeen:"2026-09-28T05:01:55Z", totalBytes:1_073_741_824, totalPackets:820_000,   protocols:["TCP","UDP"],        status:"active"     },
  { id:"d3", ip:"192.168.1.22",  hostname:"desktop-adithyan", firstSeen:"2026-09-28T00:02:10Z", lastSeen:"2026-09-28T05:01:44Z", totalBytes:536_870_912,   totalPackets:420_000,   protocols:["TCP"],              status:"active"     },
  { id:"d4", ip:"10.0.0.5",      hostname:"unknown",          firstSeen:"2026-09-28T04:55:00Z", lastSeen:"2026-09-28T05:00:10Z", totalBytes:65_536,        totalPackets:512,       protocols:["TCP"],              status:"suspicious" },
  { id:"d5", ip:"10.0.0.99",     hostname:"unknown",          firstSeen:"2026-09-28T05:00:10Z", lastSeen:"2026-09-28T05:00:20Z", totalBytes:32_768,        totalPackets:128,       protocols:["TCP"],              status:"suspicious" },
  { id:"d6", ip:"192.168.1.33",  hostname:"vaishnav-pc",      firstSeen:"2026-09-28T00:10:00Z", lastSeen:"2026-09-28T05:01:30Z", totalBytes:268_435_456,   totalPackets:210_000,   protocols:["TCP","UDP"],        status:"active"     },
];

export const mockClusters: Cluster[] = [
  { id:0,  label:"Normal Web Traffic",   size:12_420, description:"HTTP/HTTPS flows to common CDN and web services.",                        avgPackets:35,  avgBytes:45_000,   color:"#22c55e" },
  { id:1,  label:"DNS/NTP Background",   size:8_200,  description:"Periodic short UDP flows — background resolution and time sync.",          avgPackets:2,   avgBytes:320,      color:"#3b82f6" },
  { id:2,  label:"Bulk Data Transfers",  size:3_840,  description:"Long-duration, high-volume TCP flows consistent with file downloads.",      avgPackets:880, avgBytes:1_200_000,color:"#8b5cf6" },
  { id:3,  label:"Interactive Sessions", size:2_110,  description:"SSH and RDP-sized flows with regular inter-packet timing.",                 avgPackets:62,  avgBytes:28_000,   color:"#f59e0b" },
  { id:-1, label:"Anomalous (Noise)",    size:312,    description:"Flows that do not fit any cluster. Requires further investigation.",        avgPackets:180, avgBytes:750,      color:"#ef4444" },
];

export const mockAssociationRules: AssociationRule[] = [
  { id:"r1", antecedent:["dstPort=80"],                          consequent:["protocol=TCP","label=BENIGN"], support:0.42, confidence:0.91, lift:1.8  },
  { id:"r2", antecedent:["dstPort=443"],                         consequent:["protocol=TCP","label=BENIGN"], support:0.38, confidence:0.95, lift:1.9  },
  { id:"r3", antecedent:["dstPort=22","shortDuration=true"],     consequent:["label=SSHBrute"],              support:0.02, confidence:0.83, lift:12.4 },
  { id:"r4", antecedent:["highPackets=true","dstPort=80"],       consequent:["label=DDoS"],                  support:0.01, confidence:0.79, lift:18.2 },
  { id:"r5", antecedent:["dstPort=53","udp=true"],               consequent:["label=BENIGN"],                support:0.14, confidence:0.97, lift:1.2  },
  { id:"r6", antecedent:["scanPorts=true"],                      consequent:["label=PortScan"],              support:0.03, confidence:0.88, lift:15.7 },
];

export const mockMLMetrics: MLMetrics[] = [
  { model:"Decision Tree", accuracy:0, precision:0, recall:0, f1Score:0, status:"not_trained" },
  { model:"Random Forest", accuracy:0, precision:0, recall:0, f1Score:0, status:"not_trained" },
  { model:"XGBoost",       accuracy:0, precision:0, recall:0, f1Score:0, status:"not_trained" },
];
