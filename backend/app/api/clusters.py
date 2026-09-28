# =========================================================
# NetMine AI — /api/clusters
# DBSCAN clustering results.
# NOT YET EVALUATED — returns demo data until Phase 7.
# =========================================================
from fastapi import APIRouter
from app.schemas import ClusterList
from app.services.mock_data import DEMO_CLUSTERS

router = APIRouter(prefix="/api/clusters", tags=["Data Mining"])

@router.get("", response_model=ClusterList, summary="DBSCAN cluster results")
async def get_clusters() -> ClusterList:
    """
    Returns DBSCAN cluster assignments.
    - cluster.id == -1 means the flow is noise (potentially anomalous).
    - status == "not_trained" means DBSCAN has not been run yet.
    - ⚠ NOT YET EVALUATED — real results come from Phase 7.
    """
    noise_count = sum(1 for c in DEMO_CLUSTERS if c.id == -1)
    total_flows  = sum(c.size for c in DEMO_CLUSTERS)
    return ClusterList(
        clusters=DEMO_CLUSTERS,
        total_flows=total_flows,
        noise_count=noise_count,
        algorithm="DBSCAN",
        status="not_trained",
        data_source="DEMO",
    )
