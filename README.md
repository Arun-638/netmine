# NetMine AI — AI-Powered Network Traffic Analytics & Anomaly Detection Platform

**Team:** Arun A Raj · Adithyan H · Vaishnav Prakash

**Domains:** Data Mining · Machine Learning · Cybersecurity · Network Traffic Analytics · Full-Stack Development

---

## ⚠️ Project Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Environment Validation | ✅ Done |
| Phase 1 | React + Vite Frontend Foundation | ✅ Done |
| Phase 2 | Frontend Analytics UI | ✅ Done |
| Phase 3 | FastAPI Backend Foundation | ✅ Done |
| Phase 4 | Database Integration | ✅ Done |
| Phase 5 | CICIDS2017 Exploration | ✅ Done |
| Phase 6 | ML Training Pipeline (CICIDS2017) | ✅ Done |
| Phase 7 | Data Mining & Anomaly Detection (DBSCAN + Apriori + IsoForest) | ✅ Done |
| Phase 8 | UNSW-NB15 Benchmark & Cross-Dataset Evaluation | ✅ Done |
| Phase 9 | Real-Time Packet Capture & Flow Engine (TShark + Live ML) | ✅ Done |
| Phase 10 | Live Alerting, Database Logging & System Telemetry | 🔜 Next |
| Phase 11–15 | Automated Reporting, End-to-End Testing & VIVA Defense | 🔜 |

---

## Architecture

```
React + Vite (TypeScript)
        │
        │  REST API / WebSocket
        ▼
    FastAPI (Python)
        │
        ├── Machine Learning (Decision Tree, Random Forest, XGBoost)
        ├── Data Mining (DBSCAN, Isolation Forest, Apriori)
        ├── Packet Capture (TShark / Npcap / PyShark)
        └── Database (SQLite → PostgreSQL)
```

---

## Requirements

### Hardware
- Windows 10/11 (64-bit)
- Minimum 8 GB RAM (16 GB recommended for CICIDS2017)
- Minimum 15 GB free disk space for datasets

### Software
| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.9+ | Backend + ML + Data Mining |
| Node.js | 18+ | Frontend build |
| npm | 8+ | Package management |
| Git | Any | Version control |
| Wireshark / TShark | 4.x | Packet capture |
| Npcap | Latest | Windows packet capture driver |

---

## Installation

### Step 1 — Clone the repository
```bash
git clone https://github.com/Arun-638/netmine.git
cd netmine
```

### Step 2 — Validate your environment
```bash
python scripts/check_environment.py
```
Fix any CRITICAL FAILURES before proceeding.

### Step 3 — Install Python dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Install frontend dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 5 — Place datasets (see Dataset Setup below)

---

## Dataset Setup

### CICIDS2017

1. Download from: https://www.unb.ca/cic/datasets/ids-2017.html
   (Look for: "Machine Learning CSV Files")
2. Extract and place the CSV files in:
   ```
   data/raw/CICIDS2017/
   ```
3. Do NOT rename the original files.
4. Expected files:
   - Monday-WorkingHours.pcap_ISCX.csv
   - Tuesday-WorkingHours.pcap_ISCX.csv
   - Wednesday-workingHours.pcap_ISCX.csv
   - Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv
   - Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv
   - Friday-WorkingHours-Morning.pcap_ISCX.csv
   - Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv
   - Friday-WorkingHours-Afternoon-DDoS.pcap_ISCX.csv

5. Verify:
   ```bash
   python scripts/check_environment.py
   ```

> ⚠️ **IMPORTANT:** Raw datasets are in .gitignore and will NEVER be committed to Git.

### UNSW-NB15

To be used in Phase 8. Place in: `data/raw/UNSW-NB15/`

---

## Folder Structure

```
netmine/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── layouts/             # Layout wrappers
│   │   ├── charts/              # Recharts chart components
│   │   ├── mock/                # DEMO data (clearly labelled)
│   │   ├── types/               # TypeScript interfaces
│   │   └── services/            # API clients (Phase 3+)
│   └── package.json
│
├── backend/                     # FastAPI (Phase 3+)
│   └── app/
│       ├── main.py
│       ├── api/
│       ├── services/
│       ├── schemas/
│       ├── database/
│       └── core/
│
├── ml/                          # ML training scripts (Phase 6+)
├── data_mining/                 # Data mining scripts (Phase 7+)
├── packet_capture/              # TShark / flow scripts (Phase 9+)
│
├── data/
│   ├── raw/CICIDS2017/          # ← place your CSVs here
│   ├── raw/UNSW-NB15/           # ← phase 8
│   ├── processed/               # cleaned/engineered datasets
│   ├── sample/                  # small dev samples
│   └── metadata/                # dataset descriptions
│
├── models/                      # serialized ML models
├── notebooks/                   # Jupyter exploration notebooks
├── scripts/                     # utility scripts
│   └── check_environment.py     # Phase 0 validator
├── tests/                       # Pytest tests
├── docs/                        # documentation
├── requirements.txt
└── README.md
```

---

## Running the Frontend (Phase 1)

```bash
cd frontend
npm run dev
```

Open: **http://localhost:5173**

> ⚠️ All data shown is DEMO DATA. The dashboard clearly displays "DEMO MODE".
> No real network traffic is captured in Phase 1.

---

## Running the Backend (Phase 3+)

NOT YET IMPLEMENTED

```bash
# Future command:
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs will be available at: http://localhost:8000/docs

---

## What is Real vs Mock

| Component | Status | Notes |
|-----------|--------|-------|
| React dashboard UI | ✅ Real | Built and running |
| Mock metric cards | ⚠️ DEMO | Hardcoded demo values |
| Traffic trend chart | ⚠️ DEMO | Random generated data |
| Anomaly table | ⚠️ DEMO | Hardcoded example anomalies |
| ML metrics | ⚠️ PLACEHOLDER | All zeros — not yet trained |
| DBSCAN clusters | ⚠️ DEMO | Example clusters only |
| Association rules | ⚠️ DEMO | Manually created examples |
| FastAPI backend | ❌ NOT IMPLEMENTED | Phase 3 |
| Live traffic capture | ❌ NOT IMPLEMENTED | Phase 9 |
| Real ML inference | ❌ NOT IMPLEMENTED | Phase 11 |

---

## Known Limitations

- Phase 1 only: all data is demo/mock
- No real packet capture yet
- ML models are not trained
- No real anomaly detection yet
- WebSocket streaming not yet connected
- Settings and Reports pages are placeholders

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + TypeScript |
| Styling | Vanilla CSS (custom design system) |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router DOM v7 |
| Backend | FastAPI + Uvicorn |
| ML | Scikit-learn + XGBoost + Joblib |
| Data Mining | Scikit-learn + mlxtend (Apriori) |
| Network | TShark + Npcap + PyShark |
| Database | SQLite (SQLAlchemy ORM) |

---

## Academic Context

This is a B.Tech final year project demonstrating:
- **Data Mining:** DBSCAN clustering, Isolation Forest, Apriori association rules
- **Machine Learning:** Supervised traffic classification (Decision Tree, Random Forest, XGBoost)
- **Cybersecurity:** Network anomaly detection
- **Full-Stack:** React frontend + FastAPI backend
- **Network Analysis:** Flow-level feature extraction from real traffic

---

## License

Academic project — not for commercial use.
