"""
SIH26189 Deterministic Evidence Confidence Calculator
Calculates relationship and hypothesis confidence scores based on multi-source evidence diversity,
temporal consistency, identity resolution confidence, and contradiction penalties.
"""

from typing import List, Dict, Any


class EvidenceConfidenceCalculator:
    SOURCE_WEIGHTS = {
        "cctns_fir_records": 0.90,
        "criminal_history_db": 0.85,
        "telecom_cdr_logs": 0.95,
        "telecom_caf_kyc": 0.90,
        "cbs_bank_transactions": 0.98,
        "fiu_str_alerts": 0.88,
        "toll_anpr_logs": 0.92,
        "cell_tower_dumps": 0.40,  # High ambiguity without CDR/ANPR
        "osint_social_posts": 0.50,
        "field_intelligence_notes": 0.70
    }

    @classmethod
    def calculate_confidence(
        cls,
        evidence_sources: List[str],
        temporal_consistency_score: float = 1.0,
        identity_confidence_score: float = 1.0,
        contradiction_penalty: float = 0.0
    ) -> float:
        """
        Confidence = (weighted evidence strength) * temporal_consistency * identity_confidence * source_diversity - contradiction_penalty
        """
        if not evidence_sources:
            return 0.0

        weights = [cls.SOURCE_WEIGHTS.get(src, 0.50) for src in evidence_sources]
        avg_weight = sum(weights) / len(weights)

        # Source diversity bonus: Multi-source evidence (e.g. CDR + Bank + ANPR) increases confidence
        unique_sources = len(set(evidence_sources))
        source_diversity_factor = min(1.0, 0.7 + (unique_sources * 0.10))

        confidence = (avg_weight * source_diversity_factor * temporal_consistency_score * identity_confidence_score) - contradiction_penalty
        return round(max(0.0, min(1.0, confidence)), 4)
