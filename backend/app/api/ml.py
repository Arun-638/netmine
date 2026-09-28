# =========================================================
# NetMine AI — /api/ml  (Phase 8 updated)
#
# Serves:
#   - CICIDS2017 real metrics
#   - UNSW-NB15 real benchmark evaluation metrics
#   - Cross-Dataset Benchmark Comparison
# =========================================================
import json
from pathlib import Path
from fastapi import APIRouter
from app.schemas import MLMetricsList, MLModelMetrics
from app.services.mock_data import DEMO_ML_METRICS

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "processed"
CICIDS_RESULTS = DATA_DIR / "ml_results.json"
UNSW_RESULTS = DATA_DIR / "unsw_results.json"
COMPARISON_RESULTS = DATA_DIR / "cross_dataset_comparison.json"


def load_json(path: Path) -> dict | None:
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return None


@router.get("/metrics", response_model=MLMetricsList, summary="CICIDS2017 ML model metrics")
async def get_ml_metrics() -> MLMetricsList:
    data = load_json(CICIDS_RESULTS)
    if not data:
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


@router.get("/unsw", summary="UNSW-NB15 benchmark evaluation metrics")
async def get_unsw_metrics() -> dict:
    data = load_json(UNSW_RESULTS)
    if not data:
        return {"status": "NOT_EVALUATED", "dataset": "UNSW-NB15"}

    models = []
    for model_name, r in data["results"].items():
        models.append({
            "model": model_name,
            "accuracy": r["accuracy"],
            "precision": r["precision"],
            "recall": r["recall"],
            "f1_score": r["f1_score"],
            "train_time_sec": r.get("train_time_sec"),
            "status": "trained",
        })

    return {
        "status": "TRAINED",
        "dataset": "UNSW-NB15",
        "generated_at": data.get("generated_at"),
        "train_rows": data.get("train_rows"),
        "test_rows": data.get("test_rows"),
        "feature_count": data.get("feature_count"),
        "best_model": data.get("best_model"),
        "models": models,
        "multi_class_accuracy": data.get("multi_class_accuracy"),
        "category_breakdown": data.get("category_breakdown", []),
    }


@router.get("/comparison", summary="Cross-Dataset Benchmark Comparison (CICIDS2017 vs UNSW-NB15)")
async def get_benchmark_comparison() -> dict:
    data = load_json(COMPARISON_RESULTS)
    if not data:
        return {"status": "NOT_AVAILABLE", "message": "Run notebooks/04_unsw_evaluation.py"}
    return {
        "status": "AVAILABLE",
        "generated_at": data.get("generated_at"),
        "benchmarks": data.get("benchmarks", []),
        "models_comparison": data.get("models_comparison", []),
    }


@router.get("/status", summary="Training pipeline status and dataset info")
async def get_training_status() -> dict:
    data = load_json(CICIDS_RESULTS)
    if not data:
        return {
            "pipeline_status": "NOT_TRAINED",
            "phase": "Phase 6 & 8",
            "dataset": "CICIDS2017 + UNSW-NB15",
        }
    return {
        "pipeline_status": "TRAINED",
        "phase": "Phase 8 COMPLETE",
        "dataset": "CICIDS2017 + UNSW-NB15",
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
    data = load_json(CICIDS_RESULTS)
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
    data = load_json(CICIDS_RESULTS)
    if not data:
        return {"status": "NOT_TRAINED", "classes": []}
    return {
        "classes": data["classes"],
        "label_mapping": data["label_mapping"],
        "class_count": len(data["classes"]),
    }
