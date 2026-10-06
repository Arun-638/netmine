# NetMine AI — AI-Powered Network Traffic Analytics & Anomaly Detection Platform

**Team:** Arun A Raj · Adithyan H · Vaishnav Prakash  
**Domains:** Data Mining · Machine Learning · Cybersecurity · Network Traffic Analytics · Full-Stack Web Development  

---

## 📌 Project Overview

**NetMine AI** is an enterprise-grade, real-time network traffic analytics and anomaly detection system. It captures live network packets, extracts bi-directional network flow features (conforming to CICIDS2017 specifications), performs real-time Machine Learning and Data Mining inference, and visualizes network health, active devices, protocol distribution, and detected security threats on a sleek, responsive dashboard.

```
                              ┌───────────────────────────────────────────────┐
                              │            Live Network Interface             │
                              │          (Wi-Fi / Ethernet Adapter)           │
                              └──────────────────────┬────────────────────────┘
                                                     │ Live Packets (TShark / Npcap)
                                                     ▼
                              ┌───────────────────────────────────────────────┐
                              │          NetMine Packet Capture Engine        │
                              │    (Flow Aggregation & Feature Extraction)    │
                              └──────────────────────┬────────────────────────┘
                                                     │ 78-Dimensional Flow Vectors
                                                     ▼
                              ┌───────────────────────────────────────────────┐
                              │           FastAPI Analytics Backend           │
                              │   ├── Machine Learning (Random Forest / XGB)  │
                              │   ├── Data Mining (DBSCAN + Isolation Forest) │
                              │   ├── Device Discovery (ARP + MAC resolution) │
                              │   └── SQLAlchemy SQLite / Telemetry Store     │
                              └──────────────────────┬────────────────────────┘
                                                     │ REST API & Real-Time Sync
                                                     ▼
                              ┌───────────────────────────────────────────────┐
                              │            React 19 + Vite Frontend           │
                              │   ├── Collapsible Responsive Navigation       │
                              │   ├── Real-Time Dashboard (Zero Horizontal    │
                              │   │   Scroll, Tabbed Flows & Threat Alerts)   │
                              │   ├── Live Traffic Monitor & Packet Inspector │
                              │   ├── Device Discovery & Protocol Analytics   │
                              │   └── Data Mining & ML Performance Analytics  │
                              └───────────────────────────────────────────────┘
```

---

## 🚀 Key Features

- **Real-Time Packet Capture**: Multi-threaded packet sniffer leveraging TShark/Npcap with socket-level fallback, continuously aggregating packets into conversational network flows.
- **Live Threat Classification**: Automated feature engineering extracting 78 CICIDS2017-compliant attributes with real-time ML inference (Random Forest, Decision Tree, XGBoost) classifying flows as `BENIGN`, `PortScan`, `DDoS`, `DoS`, or `Botnet`.
- **Unsupervised Anomaly Detection & Clustering**: Unsupervised DBSCAN clustering and Isolation Forest detecting zero-day anomalies and outliers.
- **Association Rule Mining**: Apriori algorithm discovering frequent co-occurring protocol, port, and threat patterns.
- **Active Device Discovery**: Automatically scans and monitors active LAN devices (`/api/devices`), resolving IP addresses, MAC vendors, and activity states.
- **Protocol Analytics**: Real-time traffic breakdown across TCP, UDP, ICMP, DNS, HTTP, and TLS protocols.
- **Enterprise-Grade UI**:
  - Full-width streaming live traffic table with smart IP truncation, eliminating annoying horizontal rightward scrolling.
  - Interactive tabs switching seamlessly between **Recent Traffic Flows** and **Security Anomalies**.
  - Collapsible sidebar with top-left toggle button and `Ctrl+B` keyboard shortcut.
  - Live throughput trend graph with rolling history buffer.
  - High-priority security threat alerts displayed instantly upon intrusion detection.

---

## 🛠️ System Requirements

### Hardware
- **Operating System:** Windows 10/11 (64-bit) or Linux
- **RAM:** Minimum 8 GB (16 GB recommended for model training)
- **Processor:** Multi-core x86_64 CPU

### Software
| Dependency | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Backend, ML inference, and packet engine |
| Node.js | 18+ | Frontend runtime |
| npm | 8+ | Frontend package manager |
| Wireshark / TShark | 4.x+ | Packet capture engine |
| Npcap | Latest | Windows raw packet capture driver |
| Git | Any | Version control |

---

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Arun-638/netmine.git
cd netmine
```

### 2. Python Environment Setup
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### 4. Running the Application

You can start both services using the provided PowerShell scripts:

#### Terminal 1 — Start Backend Engine
```powershell
.\start_backend.ps1
```
> Starts FastAPI on **http://localhost:8000** with interactive Swagger API docs at **http://localhost:8000/docs**.

#### Terminal 2 — Start Frontend Dashboard
```powershell
.\start_frontend.ps1
```
> Starts the Vite development server on **http://localhost:5173** with automatic `/api` proxying to port 8000.

---

## 📡 Core API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | `GET` | Health check and engine telemetry |
| `/api/dashboard` | `GET` | Aggregated metrics, traffic trends, and protocol distribution |
| `/api/capture/start` | `POST` | Starts real-time live packet capture on active network adapter |
| `/api/capture/stop` | `POST` | Stops packet capture engine |
| `/api/capture/status` | `GET` | Current capture engine state and total captured packets |
| `/api/capture/flows` | `GET` | Real-time classified flows with ML predictions |
| `/api/devices` | `GET` | Live discovered network devices and status |
| `/api/traffic/statistics` | `GET` | Detailed protocol throughput and volume breakdowns |
| `/api/anomalies` | `GET` | Filterable log of detected security anomalies and threat scores |
| `/api/ml/metrics` | `GET` | Model training evaluation (Accuracy, Precision, Recall, F1) |

---

## 📂 Project Architecture

```
netmine/
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI application entry & router registration
│       ├── api/
│       │   ├── dashboard.py         # Summary metrics & rolling traffic trend
│       │   ├── devices.py           # Device discovery & MAC resolution
│       │   ├── traffic.py           # Protocol stats & capture engine control
│       │   ├── anomalies.py         # Security anomaly reporting
│       │   └── ml.py                # Machine learning endpoints
│       ├── core/                    # Application configuration & security
│       ├── database/                # SQLAlchemy database connection & session
│       ├── models/                  # Database entity models
│       └── services/                # Device scanner, telemetry, and seeders
│
├── frontend/
│   ├── src/
│   │   ├── components/layout/       # Sidebar, Topbar, and navigation components
│   │   ├── context/
│   │   │   └── SidebarContext.tsx   # Collapsible sidebar state & Ctrl+B shortcut
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Live overview with responsive flows & alerts
│   │   │   ├── LiveTraffic.tsx      # Real-time traffic stream & packet sniffer controls
│   │   │   ├── Anomalies.tsx        # Security threat analysis & investigation
│   │   │   ├── Devices.tsx          # Live network device inventory
│   │   │   ├── Protocols.tsx        # In-depth protocol analytics
│   │   │   ├── KnowledgeDiscovery.tsx # DBSCAN clusters & Apriori association rules
│   │   │   ├── MLAnalytics.tsx      # Supervised classification metrics & confusion matrix
│   │   │   └── Reports.tsx          # Exportable network security reports
│   │   ├── charts/                  # Recharts visualization modules
│   │   └── services/api.ts          # Unified API client & endpoint resolver
│   ├── vite.config.ts               # Vite proxy configuration
│   └── package.json
│
├── packet_capture/
│   └── capture_engine.py            # Live TShark/raw socket capture, flow builder & ML classifier
│
├── ml/                              # Supervised model training scripts (CICIDS2017)
├── data_mining/                     # DBSCAN, Isolation Forest, and Apriori pipelines
├── models/                          # Serialized trained model weights (.joblib / .pkl)
├── scripts/                         # Verification & utility scripts
├── start_backend.ps1                # Automated backend launcher
└── start_frontend.ps1               # Automated frontend launcher
```

---

## 🎓 Academic Demonstration & Defense

This project serves as a comprehensive Capstone / B.Tech Final Year Project demonstrating:
1. **Data Mining:** Unsupervised DBSCAN density clustering, Isolation Forest anomaly scoring, and Apriori frequent itemset mining.
2. **Supervised Machine Learning:** Multi-class network intrusion classification trained and evaluated on the benchmark **CICIDS2017** dataset.
3. **Cybersecurity Operations:** Real-time port scan detection, DoS/DDoS mitigation signaling, and host reconnaissance monitoring.
4. **Network Engineering:** High-performance packet sniffing, raw socket handling, and bi-directional conversational flow reconstruction.
5. **Full-Stack Engineering:** High-throughput asynchronous Python FastAPI backend paired with a reactive, modern React TypeScript frontend.

---

## 📄 License

Academic research and educational project — created by Arun A Raj, Adithyan H, and Vaishnav Prakash.
