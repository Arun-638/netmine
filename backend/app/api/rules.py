# =========================================================
# NetMine AI — /api/rules  (Phase 7 updated)
#
# Reads REAL Apriori association rules from
# data/processed/association_rules.json
# =========================================================
import json
from pathlib import Path
from fastapi import APIRouter, Query
from app.schemas import AssociationRuleList, AssociationRule
from app.services.mock_data import DEMO_RULES
from data_mining.apriori_rules import load_association_rules

router = APIRouter(prefix="/api/rules", tags=["Data Mining"])


@router.get("", response_model=AssociationRuleList, summary="Association rule mining results")
async def get_rules(
    min_support:    float = Query(0.0,  ge=0.0, le=1.0, description="Minimum support threshold"),
    min_confidence: float = Query(0.0,  ge=0.0, le=1.0, description="Minimum confidence threshold"),
    min_lift:       float = Query(0.0,  ge=0.0,          description="Minimum lift threshold"),
) -> AssociationRuleList:
    """
    Returns Apriori association rules.
    - If Phase 7 has run: returns REAL measured rules mined from CICIDS2017.
    - Supports dynamic client-side / query threshold filtering.
    """
    data = load_association_rules()
    if not data:
        rules = [
            r for r in DEMO_RULES
            if r.support >= min_support
            and r.confidence >= min_confidence
            and r.lift >= min_lift
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

    all_rules = [
        AssociationRule(
            id=r["id"],
            antecedent=r["antecedent"],
            consequent=r["consequent"],
            support=r["support"],
            confidence=r["confidence"],
            lift=r["lift"],
        )
        for r in data["rules"]
    ]

    filtered_rules = [
        r for r in all_rules
        if r.support >= min_support
        and r.confidence >= min_confidence
        and r.lift >= min_lift
    ]

    return AssociationRuleList(
        rules=filtered_rules,
        total=len(filtered_rules),
        algorithm="Apriori",
        min_support=min_support,
        min_confidence=min_confidence,
        status="trained",
        data_source="APRIORI_MEASURED",
    )
