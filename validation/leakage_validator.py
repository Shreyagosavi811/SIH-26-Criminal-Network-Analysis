"""
SIH26189 Zero Label-Leakage Auditor
MANDATORY AUDITOR: Scans all observed files (JSON, CSV, TXT) for hidden ground-truth analytical labels.
Fails generation immediately if any forbidden term is detected in observed datasets.
"""

import json
import re
from typing import Dict, Any, List, Tuple


FORBIDDEN_LEAKAGE_TERMS = [
    "MASTERMIND", "MULE", "SPOTTER", "KINGPIN", "CONSPIRATOR",
    "GUILTY", "TARGET_SUSPECT", "GROUND_TRUTH", "GOLD_LABEL",
    "CRIMINAL_NETWORK_MEMBER", "ROLE_IN_SCENARIO", "CANONICAL_ID"
]


class LabelLeakageValidator:
    def __init__(self, forbidden_terms: List[str] = None):
        self.forbidden_terms = forbidden_terms or FORBIDDEN_LEAKAGE_TERMS

    def audit_text_content(self, text_content: str, filename: str) -> Tuple[bool, List[str]]:
        errors = []
        for term in self.forbidden_terms:
            pattern = re.compile(r'\b' + re.escape(term) + r'\b', re.IGNORECASE)
            matches = pattern.findall(text_content)
            if matches:
                errors.append(f"STRICT LEAKAGE AUDIT FAILURE in {filename}: Found forbidden analytical term '{term}' ({len(matches)} occurrences)")
        return len(errors) == 0, errors

    def audit_dict_object(self, obj: Any, filename: str) -> Tuple[bool, List[str]]:
        text_repr = json.dumps(obj)
        return self.audit_text_content(text_repr, filename)
