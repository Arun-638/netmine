// =========================================================
// NetMine AI — Shared TypeScript Types
// =========================================================

export interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  trend?: "up" | "down" | "neutral";
}

export interface TrafficFlow {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  bytes: number;
  packets: number;
  duration: number;
  label: string;
  confidence: number;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  description: string;
  status: "active" | "resolved" | "investigating";
}

export interface Device {
  id: string;
  ip: string;
  mac?: string;
  hostname?: string;
  firstSeen: string;
  lastSeen: string;
  totalBytes: number;
  totalPackets: number;
  protocols: string[];
  status: "active" | "inactive" | "suspicious";
}

export interface ProtocolStat {
  protocol: string;
  packets: number;
  bytes: number;
  percentage: number;
}

export interface TrafficTrendPoint {
  time: string;
  packetsPerSec: number;
  bytesPerSec: number;
  anomalies: number;
}

export interface Cluster {
  id: number;
  label: string;
  size: number;
  description: string;
  avgPackets: number;
  avgBytes: number;
  color?: string;
}

export interface AssociationRule {
  id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface MLMetrics {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  status: "trained" | "not_trained" | "training";
}

export interface SystemStatus {
  captureActive: boolean;
  captureRate: number;
  processingRate: number;
  queueSize: number;
  droppedPackets: number;
  processingLatencyMs: number;
  uptime: string;
  dataSource: "LIVE" | "DEMO" | "FILE";
}
