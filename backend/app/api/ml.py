# =========================================================
# NetMine AI — /api/ml
# ML model training status and metrics.
# NOT YET EVALUATED — returns placeholder data.
# =========================================================
from fastapi import APIRouter
from app.schemas import MLMetricsList
from app.services.mock_data import DEMO_ML_METRICS

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.get("/metrics", response_model=MLMetricsList, summary="ML model evaluation metrics")
async def get_ml_metrics() -> MLMetricsList:
    """
    Returns accuracy, precision, recall, F1 for each model.
    - All values are 0.0 until Phase 6 training completes.
    - data_source == "NOT_YET_EVALUATED" is the truthful state.
    - ⚠ NO metrics are fabricated. 0.0 means not evaluated.
    """
    return MLMetricsList(
        models=DEMO_ML_METRICS,
        best_model=None,
        data_source="NOT_YET_EVALUATED",
    )

@router.get("/status", summary="Training pipeline status")
async def get_training_status() -> dict:
    """Returns the current training pipeline status."""
    return {
        "pipeline_status": "NOT_IMPLEMENTED",
        "phase": "Phase 6 — not yet started",
        "dataset": "CICIDS2017",
        "dataset_ready": True,
        "message": "Run Phase 6 training scripts to populate ML metrics.",
    }
