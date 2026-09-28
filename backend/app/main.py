# =========================================================
# NetMine AI — FastAPI Application Entry Point
#
# HOW TO RUN:
#   From project root (f:\netmine):
#   .venv\Scripts\uvicorn.exe backend.app.main:app --reload --host 0.0.0.0 --port 8000
#
# API DOCUMENTATION (auto-generated):
#   http://localhost:8000/docs       ← Swagger UI
#   http://localhost:8000/redoc      ← ReDoc
#   http://localhost:8000/openapi.json ← OpenAPI spec
#
# CORS:
#   Allows requests from the React dev server at localhost:5173.
#   In production, set FRONTEND_ORIGIN in .env.
#
# PHASE STATUS:
#   Phase 3 ✅ — API structure, schemas, health check, demo data
#   Phase 4 🔜 — SQLAlchemy + SQLite database
#   Phase 9 🔜 — Live TShark WebSocket stream
# =========================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api import health, dashboard, traffic, anomalies, devices, clusters, rules, ml


def create_app() -> FastAPI:
    """
    Application factory.
    Creates and configures the FastAPI instance.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="""
## NetMine AI — Network Traffic Analytics API

AI-Powered Network Traffic Analytics & Anomaly Detection Platform.

**Team:** Arun A Raj · Adithyan H · Vaishnav Prakash

---

### Current Status
- **Phase 3** ✅ — API foundation complete
- **All ML/Data Mining endpoints** return `NOT_YET_EVALUATED` demo data
- **Capture endpoints** are not yet connected to TShark (Phase 9)

### Data Source Labels
| Label | Meaning |
|-------|---------|
| `DEMO` | Hardcoded demo values, realistic but not measured |
| `NOT_YET_EVALUATED` | ML training has not been run yet |
| `LIVE` | Real TShark capture (Phase 9+) |
| `FILE` | Loaded from CICIDS2017 processed file |
        """,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_tags=[
            {"name": "Health",           "description": "Server health and status checks"},
            {"name": "Dashboard",        "description": "Aggregated dashboard data"},
            {"name": "Traffic",          "description": "Network flow data and statistics"},
            {"name": "Anomalies",        "description": "Detected anomalies and threat indicators"},
            {"name": "Devices",          "description": "Network host inventory"},
            {"name": "Data Mining",      "description": "DBSCAN clusters and Apriori association rules"},
            {"name": "Machine Learning", "description": "ML model training status and evaluation metrics"},
        ],
    )

    # ── CORS ────────────────────────────────────────────────
    # Allow the React Vite dev server to call this API.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.FRONTEND_ORIGIN,
            "http://localhost:5173",   # Vite default
            "http://localhost:4173",   # Vite preview
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Route registration ───────────────────────────────────
    app.include_router(health.router)
    app.include_router(dashboard.router)
    app.include_router(traffic.router)
    app.include_router(anomalies.router)
    app.include_router(devices.router)
    app.include_router(clusters.router)
    app.include_router(rules.router)
    app.include_router(ml.router)

    # ── Root redirect ────────────────────────────────────────
    @app.get("/", include_in_schema=False)
    async def root():
        return JSONResponse({
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/api/health",
            "status": "Phase 3 — API foundation complete",
        })

    return app


# Create the app instance used by uvicorn
app = create_app()
