"""
SIH26189 Dataset Engine v1.1 — Corrected Noise Engine

NOISE RATIO DEFINITION:
  noise_ratio = noise_records / total_observed_records
  where total_observed_records = clean_records + noise_records

The engine adjusts the number of noise records injected to approximate
the target ratio given the number of clean records already generated.

Six independent noise mechanisms:
  1. spatial_overlap       — extra MSISDNs added inside tower dump records
  2. identity_collision    — new CAF records with common conflicting names
  3. ocr_typo              — plate/number transposition in existing ANPR records
  4. recycled_sim          — historical CDR records from before SIM reassignment
  5. benign_financial      — legitimate-looking bank transactions
  6. distractor_subgraph   — unrelated network fragment (field notes + CDR pair)
"""

import random
from typing import Dict, Any, List, Tuple


NOISE_RATIO_MAP = {
    1: 0.20,
    2: 0.40,
    3: 0.60,
    4: 0.80,
    5: 0.90,
}

COMMON_NAMES = [
    "Rajesh Kumar", "Amit Sharma", "Suresh Kumar", "Rahul Patil",
    "Priya Sharma", "Anjali Singh", "Manoj Verma", "Ravi Gupta",
]


class NoiseEngine:
    """
    Noise is injected AFTER clean record generation.
    The engine calculates how many noise records to inject so that
    the resulting noise_ratio ≈ target.

    For N clean records and target ratio T:
      noise_needed = round(N * T / (1 - T))
    """

    def __init__(self, seed: int = 26189, noise_level: int = 3):
        self.seed = seed
        self.noise_level = max(1, min(5, noise_level))
        self.target_ratio = NOISE_RATIO_MAP[self.noise_level]
        self.rng = random.Random(seed)

        self._clean_records = 0
        self._noise_by_mechanism: Dict[str, int] = {
            "spatial_overlap": 0,
            "identity_collision": 0,
            "ocr_typo": 0,
            "recycled_sim": 0,
            "benign_financial": 0,
            "distractor_subgraph": 0,
        }

    def set_clean_record_count(self, n: int):
        """Must be called after clean serialization, before noise injection."""
        self._clean_records = n

    def _noise_budget(self) -> int:
        """Total noise records to inject given the clean count and target ratio."""
        if self._clean_records == 0:
            return 0
        T = self.target_ratio
        return max(1, round(self._clean_records * T / (1 - T)))

    # ── 1. Spatial Overlap ─────────────────────────────────────────────────
    def inject_spatial_overlap(
        self, tower_dumps: List[Dict[str, Any]], count: int = None
    ) -> List[Dict[str, Any]]:
        """Add random commuter MSISDNs to each tower dump record.
        Count = number of NEW MSISDNs per dump (not new records)."""
        if count is None:
            n_per_dump = max(1, self.noise_level * 3)
        else:
            n_per_dump = count
        for dump in tower_dumps:
            added = 0
            for _ in range(n_per_dump):
                num = f"+91-{self.rng.randint(9000000000, 9999999999)}"
                if num not in dump.get("phone_numbers", []):
                    dump.setdefault("phone_numbers", []).append(num)
                    added += 1
            self._noise_by_mechanism["spatial_overlap"] += added
        return tower_dumps

    # ── 2. Identity Collision ─────────────────────────────────────────────
    def inject_name_collisions(
        self, caf_records: List[Dict[str, Any]], count: int = None
    ) -> List[Dict[str, Any]]:
        """Inject new CAF records with common Indian names (entity resolution challenge)."""
        n = count if count is not None else max(1, self.noise_level * 2)
        for i in range(n):
            caf_records.append({
                "caf_id": f"CAF-NOISE-{self.seed}-{i+1:04d}",
                "phone_number": f"+91-{self.rng.randint(9700000000, 9799999999)}",
                "subscriber_name": self.rng.choice(COMMON_NAMES),
                "synthetic_address": f"Street {self.rng.randint(1,200)}, Locality, Delhi",
                "district": self.rng.choice(["New Delhi", "South Delhi", "West Delhi"]),
                "activation_date": "2026-01-01T00:00:00Z",
                "deactivation_date": None,
                "operator": self.rng.choice(["Airtel", "Jio", "Vi"]),
                "document_type": "Aadhaar Card",
            })
            self._noise_by_mechanism["identity_collision"] += 1
        return caf_records

    # ── 3. OCR Typos ─────────────────────────────────────────────────────
    def inject_ocr_typos(
        self, anpr_logs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Transpose 1-2 chars in plate numbers for some ANPR records."""
        typo_prob = min(0.15 + self.noise_level * 0.08, 0.60)
        for log in anpr_logs:
            plate = log.get("vehicle_id_or_plate", "")
            if len(plate) >= 6 and self.rng.random() < typo_prob:
                # Swap last two characters
                typo = plate[:-2] + plate[-1] + plate[-2]
                log["vehicle_id_or_plate"] = typo
                log["ocr_corrected"] = plate  # keep original for audit
                self._noise_by_mechanism["ocr_typo"] += 1
        return anpr_logs

    # ── 4. Recycled SIM Historical Records ───────────────────────────────
    def inject_recycled_sims(
        self, cdr_logs: List[Dict[str, Any]], recycled_msisdn: str = None,
        count: int = None
    ) -> List[Dict[str, Any]]:
        """Inject historical CDR records (pre-reassignment) for a recycled MSISDN."""
        n = count if count is not None else max(1, self.noise_level)
        msisdn = recycled_msisdn or "+91-9810011223"
        for i in range(n):
            cdr_logs.append({
                "cdr_id": f"CDR-RECYCLE-{self.seed}-{i+1:04d}",
                "caller_phone": msisdn,
                "receiver_phone": f"+91-{self.rng.randint(9100000000, 9199999999)}",
                "timestamp": f"2025-0{self.rng.randint(1,6)}-{self.rng.randint(1,28):02d}T10:00:00Z",
                "duration_seconds": self.rng.randint(15, 180),
                "tower_id": f"TOWER-HIST-{self.rng.randint(1,10):02d}",
                "direction": "OUTGOING",
                "call_type": "VOICE",
            })
            self._noise_by_mechanism["recycled_sim"] += 1
        return cdr_logs

    # ── 5. Benign Financial Records ────────────────────────────────────────
    def inject_benign_financials(
        self, transactions: List[Dict[str, Any]], count: int = None
    ) -> List[Dict[str, Any]]:
        """Inject legitimate-looking transactions (salary, rent, utilities)."""
        n = count if count is not None else max(2, self.noise_level * 4)
        remarks = ["Monthly Salary", "Electricity Bill", "UPI Payment", "Rent", "Subscription"]
        for i in range(n):
            transactions.append({
                "transaction_id": f"CBS-BENIGN-{self.seed}-{i+1:05d}",
                "timestamp": f"2026-08-{self.rng.randint(1,28):02d}T{self.rng.randint(8,20):02d}:{self.rng.randint(0,59):02d}:00Z",
                "source_account": f"ACC-BENIGN-{self.rng.randint(100,999)}",
                "destination_account": f"ACC-MERCHANT-{self.rng.randint(100,999)}",
                "amount": round(self.rng.uniform(200, 25000), 2),
                "transaction_type": self.rng.choice(["UPI", "NEFT", "IMPS"]),
                "branch_id": "BR-BENIGN",
                "channel": "UPI_APP",
                "balance_after": round(self.rng.uniform(5000, 80000), 2),
                "reference_text": self.rng.choice(remarks),
            })
            self._noise_by_mechanism["benign_financial"] += 1
        return transactions

    # ── 6. Distractor Subgraph ────────────────────────────────────────────
    def inject_distractor_subgraph(
        self, field_notes: str, cdr_logs: List[Dict[str, Any]] = None
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Add a parallel unrelated network fragment:
        - A distractor field note entry
        - 2 distractor CDR records between unrelated numbers
        Returns (updated_field_notes, updated_cdr_logs).
        """
        if cdr_logs is None:
            cdr_logs = []
        distractor_note = (
            f"\n[FNOTE-DIST-{self.seed:05d}] "
            f"Routine surveillance: Commercial vehicle DL{self.rng.randint(1,14):02d}XX"
            f"{self.rng.randint(1000,9999)} completed standard delivery route. "
            f"No suspicious activity observed.\n"
        )
        field_notes += distractor_note
        self._noise_by_mechanism["distractor_subgraph"] += 1

        # 2 CDR records for unrelated persons
        for i in range(2):
            num_a = f"+91-{self.rng.randint(9800000000, 9899999999)}"
            num_b = f"+91-{self.rng.randint(9800000000, 9899999999)}"
            cdr_logs.append({
                "cdr_id": f"CDR-DIST-{self.seed}-{i+1:04d}",
                "caller_phone": num_a, "receiver_phone": num_b,
                "timestamp": f"2026-08-{self.rng.randint(1,28):02d}T{self.rng.randint(8,20):02d}:00:00Z",
                "duration_seconds": self.rng.randint(5, 120),
                "tower_id": f"TOWER-DIST-{self.rng.randint(1,10):02d}",
                "direction": "OUTGOING", "call_type": "VOICE",
            })
            self._noise_by_mechanism["distractor_subgraph"] += 1
        return field_notes, cdr_logs

    # ── Statistics ─────────────────────────────────────────────────────────
    def get_statistics(
        self, total_observed_records: int
    ) -> Dict[str, Any]:
        """
        Returns statistics with MATHEMATICALLY CORRECT noise_ratio.
        noise_ratio = noise_records / total_observed_records
        total_observed_records = clean + noise
        """
        # spatial_overlap adds MSISDNs inside existing records, not new records
        # Those are intra-record noise — reported separately
        spatial_msisdns = self._noise_by_mechanism["spatial_overlap"]

        # True new-record noise (records added)
        inter_record_noise = (
            self._noise_by_mechanism["identity_collision"] +
            self._noise_by_mechanism["ocr_typo"] +       # modified not added, count as 0
            self._noise_by_mechanism["recycled_sim"] +
            self._noise_by_mechanism["benign_financial"] +
            self._noise_by_mechanism["distractor_subgraph"]
        )

        # OCR typos modify existing records, not add new ones — exclude from inter-record count
        inter_record_noise_excl_ocr = (
            self._noise_by_mechanism["identity_collision"] +
            self._noise_by_mechanism["recycled_sim"] +
            self._noise_by_mechanism["benign_financial"] +
            self._noise_by_mechanism["distractor_subgraph"]
        )

        measured_ratio = (
            inter_record_noise_excl_ocr / total_observed_records
            if total_observed_records > 0 else 0.0
        )

        return {
            "noise_level": self.noise_level,
            "target_noise_ratio": self.target_ratio,
            "measured_noise_ratio": round(measured_ratio, 4),
            "ratio_formula": "new_noise_records / total_observed_records",
            "total_observed_records": total_observed_records,
            "clean_records": total_observed_records - inter_record_noise_excl_ocr,
            "noise_records_inter": inter_record_noise_excl_ocr,
            "noise_records_intra": spatial_msisdns,
            "mechanisms": {
                "spatial_overlap_msisdns_added": spatial_msisdns,
                "identity_collisions_new_records": self._noise_by_mechanism["identity_collision"],
                "ocr_typos_modified_records": self._noise_by_mechanism["ocr_typo"],
                "recycled_sim_records": self._noise_by_mechanism["recycled_sim"],
                "benign_financial_records": self._noise_by_mechanism["benign_financial"],
                "distractor_subgraph_records": self._noise_by_mechanism["distractor_subgraph"],
            },
        }

    def reset(self):
        """Reset statistics for a new scenario."""
        self._clean_records = 0
        for k in self._noise_by_mechanism:
            self._noise_by_mechanism[k] = 0
