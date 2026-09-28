# =========================================================
# NetMine AI — /api/ml  (Phase 6 updated)
#
# Phase 6 complete: reads REAL metrics from ml_results.json
# produced by notebooks/02_train.py
# =========================================================
import json
from pathlib import Path
from fastapi import APIRouter
from app.schemas import MLMetricsList, MLModelMetrics

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

# Path to the real results file
RESULTS_JSON = Path(__file__).parent.parent.parent.parent / "data" / "processed" / "ml_results.json"


def load_real_results() -> dict | None:
    """Load ml_results.json if it exists (Phase 6 trained)."""
    if RESULTS_JSON.exists():
        with open(RESULTS_JSON, encoding="utf-8") as f:
            return json.load(f)
    return None


@router.get("/metrics", response_model=MLMetricsList, summary="Real ML model evaluation metrics")
async def get_ml_metrics() -> MLMetricsList:
    """
    Returns accuracy, precision, recall, F1 for each model.
    - Phase 6 complete: returns REAL measured values from CICIDS2017 training.
    - data_source == 'CICIDS2017_TRAINED' confirms these are real results.
    - If ml_results.json does not exist: returns NOT_YET_EVALUATED placeholder.
    """
    data = load_real_results()
    if not data:
        from app.services.mock_data import DEMO_ML_METRICS
        return MLMetricsList(models=DEMO_ML_METRICS, best_model=None, data_source="NOT_YET_EVALUATED")

    models = []
    for model_name, r in data["results"].items():
        models.append(MLModelMetrics(
            model=model_name,
            accuracy=r["accuracy"],
            precision=r["precision"],
            recall=r["recall"],
            f1_score=r["f1_score"],
            status="trained",
            trained_at=data.get("generated_at"),
            dataset=data.get("dataset", "CICIDS2017"),
        ))

    return MLMetricsList(
        models=models,
        best_model=data.get("best_model"),
        data_source="CICIDS2017_TRAINED",
    )


@router.get("/status", summary="Training pipeline status and dataset info")
async def get_training_status() -> dict:
    data = load_real_results()
    if not data:
        return {
            "pipeline_status": "NOT_TRAINED",
            "phase": "Phase 6 — run notebooks/02_train.py",
            "dataset": "CICIDS2017",
        }
    return {
        "pipeline_status": "TRAINED",
        "phase": "Phase 6 COMPLETE",
        "dataset": data["dataset"],
        "generated_at": data["generated_at"],
        "train_rows": data["train_rows"],
        "test_rows": data["test_rows"],
        "feature_count": data["feature_count"],
        "best_model": data["best_model"],
        "classes": data["classes"],
        "models": list(data["results"].keys()),
    }


@router.get("/features", summary="Feature list used in training")
async def get_features() -> dict:
    data = load_real_results()
    if not data:
        return {"status": "NOT_TRAINED", "features": []}
    return {
        "feature_count": data["feature_count"],
        "feature_names": data["feature_names"],
        "scaler": "StandardScaler",
        "dataset": data["dataset"],
    }


@router.get("/classes", summary="Label mapping (class index to name)")
async def get_classes() -> dict:
    data = load_real_results()
    if not data:
        return {"status": "NOT_TRAINED", "classes": []}
    return {
        "classes": data["classes"],
        "label_mapping": data["label_mapping"],
        "class_count": len(data["classes"]),
    }
