# =========================================================
# NetMine AI — /api/rules
# Apriori association rule mining results.
# NOT YET EVALUATED — returns demo data until Phase 7.
# =========================================================
from fastapi import APIRouter, Query
from app.schemas import AssociationRuleList
from app.services.mock_data import DEMO_RULES

router = APIRouter(prefix="/api/rules", tags=["Data Mining"])

@router.get("", response_model=AssociationRuleList, summary="Association rule mining results")
async def get_rules(
    min_support:    float = Query(0.0,  ge=0.0, le=1.0, description="Minimum support threshold"),
    min_confidence: float = Query(0.0,  ge=0.0, le=1.0, description="Minimum confidence threshold"),
    min_lift:       float = Query(0.0,  ge=0.0,          description="Minimum lift threshold"),
) -> AssociationRuleList:
    """
    Returns Apriori association rules.
    Supports threshold filtering by support, confidence, and lift.
    ⚠ NOT YET EVALUATED — demo rules only until Phase 7.
    """
    rules = [
        r for r in DEMO_RULES
        if r.support    >= min_support
        and r.confidence >= min_confidence
        and r.lift       >= min_lift
    ]
    return AssociationRuleList(
        rules=rules,
        total=len(rules),
        algorithm="Apriori",
        min_support=min_support,
        min_confidence=min_confidence,
        status="not_trained",
        data_source="DEMO",
    )
