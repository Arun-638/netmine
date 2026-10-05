// =========================================================
// NetMine AI — useSimulatedTraffic
// Simulates a live traffic feed using setInterval.
//
// WHY: Phase 12 will replace this with a real WebSocket
//      connected to FastAPI. This hook mimics that API
//      contract so the UI code won't change.
//
// INPUT:  maxFlows (int), intervalMs (int)
// OUTPUT: flows[], isRunning, packetsPerSec, start(), stop(), clear()
// =========================================================
import { useState, useEffect, useRef, useCallback } from "react";
import type { TrafficFlow } from "../types";
import { getApiUrl } from "../services/api";

const PROTOCOLS = ["TCP", "TCP", "TCP", "UDP", "UDP", "ICMP"];
const LABELS    = ["BENIGN", "BENIGN", "BENIGN", "BENIGN", "BENIGN", "PortScan", "SSHBrute", "DDoS", "RDPAttack"];
const SRC_IPS   = ["192.168.1.10", "192.168.1.22", "192.168.1.33", "192.168.1.5", "10.0.0.5", "10.0.0.99"];
const DST_IPS   = ["8.8.8.8", "1.1.1.1", "104.18.22.1", "172.217.0.1", "192.168.1.1", "192.168.1.100"];

let _idCounter = 1000;

function generateFlow(): TrafficFlow {
  const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
  const label    = LABELS[Math.floor(Math.random() * LABELS.length)];
  const isAttack = label !== "BENIGN";
  return {
    id:         `live-${_idCounter++}`,
    timestamp:  new Date().toISOString(),
    srcIp:      isAttack
      ? `${Math.floor(Math.random()*100+10)}.0.0.${Math.floor(Math.random()*200+10)}`
      : SRC_IPS[Math.floor(Math.random() * SRC_IPS.length)],
    dstIp:      DST_IPS[Math.floor(Math.random() * DST_IPS.length)],
    srcPort:    Math.floor(Math.random() * 50000) + 1024,
    dstPort:    [80, 443, 53, 22, 3389, 8080][Math.floor(Math.random() * 6)],
    protocol,
    bytes:      Math.floor(Math.random() * 200_000) + 64,
    packets:    Math.floor(Math.random() * 200) + 1,
    duration:   parseFloat((Math.random() * 10).toFixed(2)),
    label,
    confidence: parseFloat((0.7 + Math.random() * 0.29).toFixed(2)),
  };
}

export interface UseSimulatedTrafficReturn {
  flows: TrafficFlow[];
  isRunning: boolean;
  packetsPerSec: number;
  start: () => void;
  stop:  () => void;
  clear: () => void;
}

export function useSimulatedTraffic(
  maxFlows   = 60,
  intervalMs = 800,
): UseSimulatedTrafficReturn {
  const [flows,         setFlows]      = useState<TrafficFlow[]>([]);
  const [isRunning,     setIsRunning]  = useState(false);
  const [packetsPerSec, setPPS]        = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ppsRef      = useRef(0);

  const tick = useCallback(() => {
    const count    = Math.floor(Math.random() * 3) + 1;
    const newFlows = Array.from({ length: count }, generateFlow);
    ppsRef.current += newFlows.reduce((s, f) => s + f.packets, 0);
    setFlows(prev => [...newFlows, ...prev].slice(0, maxFlows));

    // Dispatch any generated attacks to backend so Anomalies page and Dashboard stay synchronized
    const threats = newFlows.filter(f => f.label !== "BENIGN");
    if (threats.length > 0) {
      try {
        const api = getApiUrl();
        threats.forEach(f => {
          fetch(`${api}/api/anomalies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              src_ip: f.srcIp,
              dst_ip: f.dstIp,
              type: f.label,
              severity: f.label === "DDoS" ? "critical" : (f.label === "PortScan" ? "medium" : "high"),
              score: f.confidence,
              description: `Live simulated threat detected: ${f.label} targeting ${f.dstIp}:${f.dstPort}`,
              status: "active",
            }),
          }).catch(() => {});
        });
      } catch {}
    }
  }, [maxFlows]);

  useEffect(() => {
    if (!isRunning) return;
    const ppsTimer = setInterval(() => {
      setPPS(Math.round(ppsRef.current / 2));
      ppsRef.current = 0;
    }, 2000);
    return () => clearInterval(ppsTimer);
  }, [isRunning]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(tick, intervalMs);
  }, [tick, intervalMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false);
    setPPS(0);
    ppsRef.current = 0;
  }, []);

  const clear = useCallback(() => {
    stop();
    setFlows([]);
    try {
      const api = getApiUrl();
      fetch(`${api}/api/anomalies/clear`, { method: "POST" }).catch(() => {});
    } catch {}
  }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { flows, isRunning, packetsPerSec, start, stop, clear };
}
