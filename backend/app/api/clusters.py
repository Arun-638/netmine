# =========================================================
# NetMine AI — /api/clusters  (Phase 7 updated)
#
# Reads REAL DBSCAN results from data/processed/dbscan_results.json
# =========================================================
import json
from pathlib import Path
from fastapi import APIRouter
from app.schemas import ClusterList, Cluster
from app.services.mock_data import DEMO_CLUSTERS

router = APIRouter(prefix="/api/clusters", tags=["Data Mining"])

DBSCAN_JSON = Path(__file__).parent.parent.parent.parent / "data" / "processed" / "dbscan_results.json"


def load_real_dbscan() -> dict | None:
    if DBSCAN_JSON.exists():
        with open(DBSCAN_JSON, encoding="utf-8") as f:
            return json.load(f)
    return None


@router.get("", response_model=ClusterList, summary="DBSCAN cluster results")
async def get_clusters() -> ClusterList:
    """
    Returns DBSCAN cluster assignments.
    - If Phase 7 has run: returns REAL measured clusters from CICIDS2017.
    - cluster.id == -1 means noise (potential anomaly/scan).
    """
    data = load_real_dbscan()
    if not data:
        noise_count = sum(1 for c in DEMO_CLUSTERS if c.id == -1)
        total_flows = sum(c.size for c in DEMO_CLUSTERS)
        return ClusterList(
            clusters=DEMO_CLUSTERS,
            total_flows=total_flows,
            noise_count=noise_count,
            algorithm="DBSCAN",
            status="not_trained",
            data_source="DEMO",
        )

    clusters = [
        Cluster(
            id=c["id"],
            label=c["label"],
            size=c["size"],
            description=c["description"],
            avg_packets=c["avg_packets"],
            avg_bytes=c["avg_bytes"],
            color=c.get("color"),
        )
        for c in data["clusters"]
    ]

    return ClusterList(
        clusters=clusters,
        total_flows=data["total_flows"],
        noise_count=data["noise_count"],
        algorithm="DBSCAN",
        status="trained",
        data_source="DBSCAN_MEASURED",
    )


@router.get("/scatter", summary="DBSCAN 2D PCA scatter points for visualization")
async def get_scatter_points() -> dict:
    data = load_real_dbscan()
    if not data:
        return {"status": "not_trained", "points": []}
    return {
        "status": "trained",
        "algorithm": "DBSCAN + PCA",
        "total_points": len(data.get("scatter_points", [])),
        "points": data.get("scatter_points", []),
    }
