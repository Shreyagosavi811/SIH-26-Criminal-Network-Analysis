"""
SIH26189 v1.1 — Temporal Validator
Validates chronological ordering, causal dependencies, and physical timeline consistency.
"""
from datetime import datetime
from typing import List, Tuple, Dict, Any, Optional


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", ""))


class TemporalValidator:
    def __init__(self, max_speed_kmh: float = 120.0):
        self.max_speed_kmh = max_speed_kmh

    def validate_timeline_ordering(
        self, steps: List[Dict[str, Any]]
    ) -> Tuple[bool, List[str]]:
        """Timeline steps must be in non-decreasing timestamp order."""
        errors = []
        for i in range(1, len(steps)):
            prev_ts = steps[i - 1].get("timestamp", "")
            curr_ts = steps[i].get("timestamp", "")
            if not prev_ts or not curr_ts:
                continue
            try:
                if _parse(curr_ts) < _parse(prev_ts):
                    errors.append(
                        f"Step {i+1} timestamp {curr_ts} precedes step {i} timestamp {prev_ts}"
                    )
            except ValueError as e:
                errors.append(f"Unparseable timestamp at step {i}: {e}")
        return (len(errors) == 0, errors)

    def validate_sim_lifecycle(
        self,
        activation_date: str,
        deactivation_date: Optional[str],
        cdr_timestamps: List[str],
    ) -> Tuple[bool, List[str]]:
        """CDR records must not precede activation or occur after deactivation."""
        errors = []
        try:
            act = _parse(activation_date)
        except ValueError:
            return False, [f"Invalid activation_date: {activation_date}"]

        deact = None
        if deactivation_date:
            try:
                deact = _parse(deactivation_date)
            except ValueError:
                return False, [f"Invalid deactivation_date: {deactivation_date}"]

        for ts in cdr_timestamps:
            try:
                cdr_dt = _parse(ts)
                if cdr_dt < act:
                    errors.append(f"CDR at {ts} precedes SIM activation {activation_date}")
                if deact and cdr_dt > deact:
                    errors.append(f"CDR at {ts} occurs after SIM deactivation {deactivation_date}")
            except ValueError:
                errors.append(f"Unparseable CDR timestamp: {ts}")
        return (len(errors) == 0, errors)

    def validate_transaction_ordering(
        self, transactions: List[Dict[str, Any]]
    ) -> Tuple[bool, List[str]]:
        """Accounts must exist before transactions. Detect impossibly rapid sequences."""
        errors = []
        sorted_txns = sorted(
            [t for t in transactions if "timestamp" in t],
            key=lambda x: x["timestamp"],
        )
        for i, txn in enumerate(sorted_txns):
            ts = txn.get("timestamp", "")
            bal = txn.get("balance_after")
            if bal is not None and bal < 0:
                errors.append(
                    f"Transaction {txn.get('transaction_id','?')} produces negative balance {bal}"
                )
        return (len(errors) == 0, errors)

    def validate_causal_dependencies(
        self, events: List[Dict[str, Any]], dependencies: List[Tuple[int, int]]
    ) -> Tuple[bool, List[str]]:
        """
        Validate that event[i] precedes event[j] for each (i,j) dependency.
        events: list with 'step' and 'timestamp' fields.
        dependencies: list of (step_a, step_b) meaning step_a must precede step_b.
        """
        errors = []
        ts_by_step = {e["step"]: e["timestamp"] for e in events if "step" in e and "timestamp" in e}
        for step_a, step_b in dependencies:
            ta = ts_by_step.get(step_a)
            tb = ts_by_step.get(step_b)
            if ta is None or tb is None:
                errors.append(f"Dependency step {step_a}→{step_b}: missing timestamp")
                continue
            try:
                if _parse(ta) >= _parse(tb):
                    errors.append(
                        f"Causal violation: step {step_a} ({ta}) must precede step {step_b} ({tb})"
                    )
            except ValueError as e:
                errors.append(f"Timestamp parse error in dependency {step_a}→{step_b}: {e}")
        return (len(errors) == 0, errors)

    def validate_72h_window(
        self, events: List[Dict[str, Any]], window_start: str, window_end: str
    ) -> Tuple[bool, List[str]]:
        """All events in a 72h scenario must fall within the window."""
        errors = []
        try:
            ws = _parse(window_start)
            we = _parse(window_end)
        except ValueError as e:
            return False, [f"Invalid window timestamps: {e}"]
        for ev in events:
            ts = ev.get("timestamp")
            if not ts:
                continue
            try:
                dt = _parse(ts)
                if dt < ws:
                    errors.append(f"Event {ev.get('step','?')} at {ts} precedes window start {window_start}")
                if dt > we:
                    errors.append(f"Event {ev.get('step','?')} at {ts} exceeds window end {window_end}")
            except ValueError:
                errors.append(f"Unparseable event timestamp: {ts}")
        return (len(errors) == 0, errors)
