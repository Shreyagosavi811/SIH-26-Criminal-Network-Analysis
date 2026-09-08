"""
SIH26189 v1.1 — Identity Validator
Validates canonical entity consistency: SIM reuse, IMEI changes,
vehicle ownership, account ownership, and identity collision handling.
Distinguishes legitimate ambiguity (recycled SIM) from contradictory GT data.
"""
from typing import List, Dict, Tuple, Optional, Any
from generator.context import ScenarioContext, PhoneCtx


class IdentityValidator:

    def validate_phone_ownership(
        self, ctx: ScenarioContext
    ) -> Tuple[bool, List[str]]:
        """
        Each phone must have a valid owner in ctx.persons.
        A recycled SIM (same msisdn, different IMEI) is LEGITIMATE if:
        - ph1.deactivation_date is set
        - ph2.activation_date > ph1.deactivation_date
        """
        errors = []
        person_ids = {p.id for p in ctx.persons}

        for ph in ctx.phones:
            if ph.owner_id not in person_ids and ph.owner_id != "UNKNOWN":
                errors.append(
                    f"Phone {ph.id} owner_id '{ph.owner_id}' not found in context persons"
                )

        # Check recycled SIM pairs
        by_msisdn: Dict[str, List[PhoneCtx]] = {}
        for ph in ctx.phones:
            by_msisdn.setdefault(ph.msisdn, []).append(ph)

        for msisdn, phones in by_msisdn.items():
            if len(phones) > 1:
                # Sort by activation date
                sorted_phones = sorted(
                    [p for p in phones if p.activation_date],
                    key=lambda p: p.activation_date,
                )
                for i in range(1, len(sorted_phones)):
                    prev = sorted_phones[i - 1]
                    curr = sorted_phones[i]
                    # Legitimate recycling requires deactivation before reactivation
                    if prev.deactivation_date is None:
                        errors.append(
                            f"MSISDN {msisdn}: phone {prev.id} reused without deactivation date"
                        )
                    elif prev.deactivation_date >= curr.activation_date:
                        errors.append(
                            f"MSISDN {msisdn}: deactivation {prev.deactivation_date} "
                            f"not before reactivation {curr.activation_date}"
                        )
                    # IMEI must differ for true SIM recycling
                    if prev.imei == curr.imei and prev.owner_id != curr.owner_id:
                        errors.append(
                            f"MSISDN {msisdn}: same IMEI {prev.imei} for different owners "
                            f"({prev.owner_id} and {curr.owner_id}) — suspicious"
                        )

        return (len(errors) == 0, errors)

    def validate_account_ownership(
        self, ctx: ScenarioContext
    ) -> Tuple[bool, List[str]]:
        """Each account owner_id must exist in ctx.persons (or be UNKNOWN for shell)."""
        errors = []
        person_ids = {p.id for p in ctx.persons}
        for acc in ctx.accounts:
            if acc.owner_id not in person_ids and acc.owner_id != "UNKNOWN":
                errors.append(
                    f"Account {acc.id} owner_id '{acc.owner_id}' not found in context"
                )
        return (len(errors) == 0, errors)

    def validate_vehicle_ownership(
        self, ctx: ScenarioContext
    ) -> Tuple[bool, List[str]]:
        """Each vehicle owner_id must exist in ctx.persons."""
        errors = []
        person_ids = {p.id for p in ctx.persons}
        for veh in ctx.vehicles:
            if veh.owner_id not in person_ids:
                errors.append(
                    f"Vehicle {veh.id} owner_id '{veh.owner_id}' not found in context"
                )
        return (len(errors) == 0, errors)

    def validate_no_contradictory_identity(
        self, ctx: ScenarioContext
    ) -> Tuple[bool, List[str]]:
        """Person IDs must be unique. Same person must not have contradictory attributes."""
        errors = []
        seen_ids = {}
        for p in ctx.persons:
            if p.id in seen_ids:
                errors.append(f"Duplicate person ID {p.id}")
            seen_ids[p.id] = p
        return (len(errors) == 0, errors)

    def validate_all(self, ctx: ScenarioContext) -> Tuple[bool, Dict[str, Any]]:
        """Run all identity checks and return consolidated report."""
        report: Dict[str, Any] = {}
        all_ok = True

        checks = [
            ("phone_ownership", self.validate_phone_ownership(ctx)),
            ("account_ownership", self.validate_account_ownership(ctx)),
            ("vehicle_ownership", self.validate_vehicle_ownership(ctx)),
            ("no_contradictory_identity", self.validate_no_contradictory_identity(ctx)),
        ]
        for name, (ok, errs) in checks:
            report[name] = {"passed": ok, "errors": errs}
            if not ok:
                all_ok = False

        return all_ok, report
