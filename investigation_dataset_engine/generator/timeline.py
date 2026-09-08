"""
SIH26189 Master Timeline Generator & Validator
Enforces causal ordering and temporal dependency validation across events.
"""

from datetime import datetime
from typing import List, Dict, Any, Tuple
from generator.models import TimelineStep


def parse_iso(ts_str: str) -> datetime:
    """Parses ISO-8601 string to datetime object."""
    if ts_str.endswith("Z"):
        ts_str = ts_str[:-1]
    return datetime.fromisoformat(ts_str)


class MasterTimelineManager:
    def __init__(self, timeline: List[TimelineStep]):
        self.timeline = sorted(timeline, key=lambda s: parse_iso(s.timestamp))

    def validate_causal_dependencies(self) -> Tuple[bool, List[str]]:
        """
        Validates that all steps in the timeline respect chronological ordering
        and causal preconditions.
        """
        errors = []
        last_dt = None
        step_events: Dict[str, datetime] = {}

        for step in self.timeline:
            dt = parse_iso(step.timestamp)
            step_events[step.event_id] = dt

            if last_dt and dt < last_dt:
                errors.append(f"Out of order timestamp at Step {step.step} ({step.event_id}): {step.timestamp} < {last_dt.isoformat()}")
            last_dt = dt

        # Causal type rules
        sim_activations = {eid: dt for eid, dt in step_events.items() if "SIM_ACTIVATION" in eid or "ACTIVATION" in eid}
        calls = {eid: dt for eid, dt in step_events.items() if "CALL" in eid or "CDR" in eid}

        for call_eid, call_dt in calls.items():
            for sim_eid, sim_dt in sim_activations.items():
                if call_dt < sim_dt:
                    errors.append(f"Temporal anomaly: Call {call_eid} at {call_dt} occurred before SIM activation {sim_eid} at {sim_dt}")

        return len(errors) == 0, errors
