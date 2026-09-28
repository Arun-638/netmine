# =========================================================
# NetMine AI — FastAPI Application Entry Point (Phase 4)
#
# CHANGES FROM PHASE 3:
#   - Added lifespan context manager (startup/shutdown)
#   - On startup: creates all SQLite tables + seeds demo data
#   - API routes now injected with DB session via Depends(get_db)
#
# HOW TO RUN (from f:\netmine):
#   .\start_backend.ps1
#   OR: Set-Location backend; ..\\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
#
# Swagger UI: http://localhost:8000/docs
# =========================================================
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.database import models  # noqa: registers models with Base
from app.services.seed import seed_demo_data
from app.api import health, dashboard, traffic, anomalies, devices, clusters, rules, ml


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context — runs startup code before serving requests.

    STARTUP:
      1. Create all tables if they don't exist (idempotent)
      2. Seed demo data if DB is empty

    SHUTDOWN:
      Nothing to clean up for SQLite. For PostgreSQL we'd close the pool.
    """
    # ── Create tables ─────────────────────────────────────
    # Base.metadata.create_all() reads all registered ORM models
    # and issues CREATE TABLE IF NOT EXISTS statements.
    Base.metadata.create_all(bind=engine)
    print("[NetMine] SQLite tables created (or already exist)")

    # ── Seed demo data ────────────────────────────────────
    with SessionLocal() as db:
        result = seed_demo_data(db)
        print(f"[NetMine] Seed result: {result['status']} — "
              f"flows={result.get('flows_inserted', 0)} "
              f"anomalies={result.get('anomalies_inserted', 0)} "
              f"devices={result.get('devices_inserted', 0)}")

    yield  # ← server is live here

    # ── Shutdown ──────────────────────────────────────────
    print("[NetMine] Shutting down...")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
        description="""
## NetMine AI — Network Traffic Analytics API

**Team:** Arun A Raj · Adithyan H · Vaishnav Prakash

### Phase Status
| Phase | Status |
|-------|--------|
| Phase 3 — API Foundation | ✅ Done |
| **Phase 4 — Database (SQLite)** | ✅ **Done** |
| Phase 5 — CICIDS2017 EDA | 🔜 Next |
| Phase 6 — ML Training | 🔜 |

### Data Source Labels
| Label | Meaning |
|-------|---------|
| `DEMO` | Demo data seeded into SQLite |
| `NOT_YET_EVALUATED` | ML not yet trained |
| `LIVE` | Real TShark capture (Phase 9+) |
        """,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_tags=[
            {"name": "Health",           "description": "Server health and database status"},
            {"name": "Dashboard",        "description": "Aggregated dashboard data (DB-backed)"},
            {"name": "Traffic",          "description": "Traffic flows — queried from SQLite"},
            {"name": "Anomalies",        "description": "Anomaly records — queried from SQLite"},
            {"name": "Devices",          "description": "Device inventory — queried from SQLite"},
            {"name": "Data Mining",      "description": "DBSCAN clusters and association rules"},
            {"name": "Machine Learning", "description": "ML model metrics — NOT_YET_EVALUATED"},
        ],
    )

    # ── CORS ──────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.FRONTEND_ORIGIN,
            "http://localhost:5173",
            "http://localhost:4173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routes ────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(dashboard.router)
    app.include_router(traffic.router)
    app.include_router(anomalies.router)
    app.include_router(devices.router)
    app.include_router(clusters.router)
    app.include_router(rules.router)
    app.include_router(ml.router)

    @app.get("/", include_in_schema=False)
    async def root():
        return JSONResponse({
            "app":     settings.APP_NAME,
            "version": settings.APP_VERSION,
            "phase":   "Phase 4 — Database Integration complete",
            "docs":    "/docs",
            "health":  "/api/health",
        })

    return app


app = create_app()
