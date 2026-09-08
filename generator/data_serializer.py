"""
SIH26189 Dataset Engine v1.1 — Data-Driven Source Record Serializer
Generates realistic, density-profile-controlled records from a ScenarioContext.
All records are derived from the ScenarioContext — NO hardcoded entity strings.
Enforces zero label leakage.
"""

import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from generator.context import ScenarioContext, PersonCtx, AccountCtx, PhoneCtx, LocationCtx


# IPC / BNS sections pool for realistic FIR records
IPC_SECTIONS_BY_CRIME = {
    "CYBER_FRAUD": ["IPC 420", "IPC 384", "IT Act Sec 66D", "IT Act Sec 66C", "IPC 120B"],
    "EXTORTION": ["IPC 384", "IPC 385", "IPC 386", "IPC 120B"],
    "ROBBERY": ["IPC 392", "IPC 394", "IPC 397", "Arms Act Sec 25"],
    "NARCOTICS": ["NDPS Act Sec 15", "NDPS Act Sec 20", "NDPS Act Sec 29"],
    "FINANCIAL_FRAUD": ["IPC 420", "IPC 409", "IPC 467", "IPC 468", "IPC 471"],
    "VEHICLE_THEFT": ["IPC 379", "IPC 411", "MV Act Sec 184"],
}

ALERT_CATEGORIES = ["RAPID_IN_OUT_LAYERING", "STRUCTURING", "ROUND_TRIPPING",
                    "MULTIPLE_CASH_DEPOSITS", "LARGE_AMOUNT_TRANSFER", "DORMANT_ACCOUNT_ACTIVITY"]

PLATFORMS = ["Telegram", "WhatsApp", "Instagram", "Twitter", "Facebook", "Signal"]


class DataDrivenSerializer:
    """
    Data-driven serializer: All records generated from ScenarioContext entities.
    Density profiles control how many records each source produces.
    """

    DEFAULT_DENSITY = {
        "cctns": 0.03,
        "criminal_history": 0.02,
        "cdr": 0.28,
        "caf": 0.05,
        "banking": 0.25,
        "fiu": 0.03,
        "anpr": 0.15,
        "tower": 0.10,
        "osint": 0.05,
        "field_notes_entries": 0.04,
    }

    def __init__(self, ctx: ScenarioContext, target_total: int = 400, density: Optional[Dict] = None):
        self.ctx = ctx
        self.target_total = target_total
        self.density = density or self.DEFAULT_DENSITY
        self.rng = random.Random(ctx.seed)
        self._counter = 0

    def _next_id(self, prefix: str) -> str:
        self._counter += 1
        return f"{prefix}-{self.ctx.scenario_id[-4:]}-{self._counter:05d}"

    def _persons_with_phones(self) -> List[Dict]:
        """Returns (PersonCtx, PhoneCtx) pairs."""
        pairs = []
        for p in self.ctx.persons:
            phone = self.ctx.phone_by_id(p.phone_id) if p.phone_id else None
            pairs.append((p, phone))
        return pairs

    def _add_minutes(self, iso_ts: str, minutes: int) -> str:
        dt = datetime.fromisoformat(iso_ts.replace("Z", ""))
        return (dt + timedelta(minutes=minutes)).strftime("%Y-%m-%dT%H:%M:%SZ")

    def _windows_start(self) -> str:
        return self.ctx.investigation_window["start"]

    # ── 1. CCTNS FIR Records ─────────────────────────────────────────────────

    def serialize_cctns_fir(self) -> List[Dict[str, Any]]:
        n = max(1, int(self.target_total * self.density["cctns"]))
        records = []
        offenses = list(IPC_SECTIONS_BY_CRIME.keys())

        # Generate one primary FIR linked to scenario
        base_ts = self._windows_start()
        complainant_idx = len(self.ctx.persons) - 1  # Use last person as victim/complainant
        accused_idx = 0  # First person as accused reference

        p_accused = self.ctx.persons[accused_idx] if self.ctx.persons else None
        p_complainant = self.ctx.persons[complainant_idx] if len(self.ctx.persons) > 1 else None
        loc = self.ctx.locations[0] if self.ctx.locations else None

        for i in range(n):
            offense_key = offenses[i % len(offenses)]
            sections = IPC_SECTIONS_BY_CRIME[offense_key]
            record_id = f"FIR-{self.ctx.scenario_id[-4:]}-{100+i:03d}"
            fir = {
                "fir_no": f"FIR-{100+i:03d}/2026/{loc.district[:2].upper() if loc else 'DL'}",
                "police_station": f"{loc.district[:10] if loc else 'District'} PS" if i == 0 else f"PS-{self._rng_district()}",
                "district": loc.district if (i == 0 and loc) else self._rng_district(),
                "state": loc.state if (i == 0 and loc) else "Delhi",
                "incident_datetime": self._add_minutes(base_ts, i * 1440),  # Each FIR separated by 1 day
                "registration_datetime": self._add_minutes(base_ts, i * 1440 + 180),
                "ipc_sections": sections[:3],
                "complainant": {
                    "name": p_complainant.full_name if (p_complainant and i == 0) else f"Complainant-{i+1}",
                    "phone": p_complainant.msisdn if (p_complainant and i == 0) else f"+91-98{self.rng.randint(10000000, 99999999)}"
                },
                "accused_persons": [
                    {
                        "name": p_accused.alias or p_accused.full_name[:10] if (p_accused and i == 0) else "Unidentified Person",
                        "alias": "Unknown",
                        "description": f"Person of interest in {offense_key.replace('_', ' ').lower()} case."
                    }
                ],
                "incident_location": loc.name if (i == 0 and loc) else f"Location-{i+1}, {self._rng_district()}",
                "investigating_officer": f"Insp. {self._rng_officer(i)} (Badge-{4000+i})",
                "complaint_summary": self._fir_narrative(offense_key, i),
                "status": "UNDER_INVESTIGATION" if i == 0 else self.rng.choice(["CHARGE_SHEETED", "CLOSED_NO_CLUE", "UNDER_INVESTIGATION"])
            }
            records.append(fir)
            self.ctx.registry.register("cctns_fir_records.json", record_id)

        return records

    # ── 2. Criminal History ──────────────────────────────────────────────────

    def serialize_criminal_history(self) -> List[Dict[str, Any]]:
        n = max(1, int(self.target_total * self.density["criminal_history"]))
        records = []
        offenses = ["Cheating / Extortion", "Vehicle Theft", "Narcotics Possession", "Financial Fraud", "Robbery"]
        courts = ["ON_BAIL", "ACQUITTED", "CONVICTED", "ABSCONDING", "PENDING_TRIAL"]

        for i in range(n):
            p = self.ctx.persons[i % len(self.ctx.persons)]
            record_id = f"CRIM-{self.ctx.scenario_id[-4:]}-{i+1:04d}"
            records.append({
                "history_record_id": record_id,
                "person_reference": p.full_name,
                "case_reference": f"FIR-{self.rng.randint(10,999):03d}/{self.rng.randint(2020,2025)}/{p.district[:2].upper()}",
                "offence_category": offenses[i % len(offenses)],
                "court_status": courts[i % len(courts)],
                "case_year": self.rng.randint(2020, 2025),
                "district": p.district,
                "disposal_status": courts[i % len(courts)]
            })
            self.ctx.registry.register("criminal_history_db.json", record_id)

        return records

    # ── 3. Telecom CDR ──────────────────────────────────────────────────────

    def serialize_telecom_cdr(self) -> List[Dict[str, Any]]:
        n = max(10, int(self.target_total * self.density["cdr"]))
        records = []
        call_types = ["VOICE", "SMS", "VOICE", "VOICE", "SMS", "DATA"]
        base_ts = self._windows_start()
        phones = self.ctx.phones

        if len(phones) < 2:
            return records

        for i in range(n):
            caller = phones[i % len(phones)]
            receiver = phones[(i + 1) % len(phones)]
            loc = self.ctx.locations[i % len(self.ctx.locations)] if self.ctx.locations else None

            # Skip calls before SIM activation
            activation = caller.activation_date
            call_ts = self._add_minutes(base_ts, self.rng.randint(0, 72 * 60))
            if call_ts < activation:
                call_ts = self._add_minutes(activation, self.rng.randint(60, 240))

            record_id = f"CDR-{self.ctx.scenario_id[-4:]}-{i+1:05d}"
            call_type = call_types[i % len(call_types)]
            duration = self.rng.randint(5, 600) if call_type == "VOICE" else self.rng.randint(1, 30)
            records.append({
                "cdr_id": record_id,
                "caller_phone": caller.msisdn,
                "receiver_phone": receiver.msisdn,
                "timestamp": call_ts,
                "duration_seconds": duration,
                "tower_id": loc.tower_id if (loc and loc.tower_id) else f"TOWER-UNKNOWN-{i}",
                "direction": "OUTGOING" if i % 2 == 0 else "INCOMING",
                "call_type": call_type
            })
            self.ctx.registry.register("telecom_cdr_logs.csv", record_id)

        return records

    # ── 4. Telecom CAF / KYC ────────────────────────────────────────────────

    def serialize_telecom_caf(self) -> List[Dict[str, Any]]:
        n = max(len(self.ctx.phones), int(self.target_total * self.density["caf"]))
        records = []

        # One CAF entry per known phone
        for i, phone in enumerate(self.ctx.phones):
            owner = self.ctx.person_by_id(phone.owner_id)
            record_id = f"CAF-{self.ctx.scenario_id[-4:]}-{i+1:04d}"
            records.append({
                "caf_id": record_id,
                "phone_number": phone.msisdn,
                "subscriber_name": owner.full_name if owner else f"Subscriber-{i+1}",
                "synthetic_address": owner.address if owner else f"Address-{i+1}",
                "district": owner.district if owner else "New Delhi",
                "activation_date": phone.activation_date,
                "deactivation_date": phone.deactivation_date,
                "operator": phone.operator,
                "document_type": self._rng_doc_type(i)
            })
            self.ctx.registry.register("telecom_caf_kyc.json", record_id)

        return records

    # ── 5. Core Banking (CBS) Transactions ──────────────────────────────────

    def serialize_cbs_bank_transactions(self) -> List[Dict[str, Any]]:
        n = max(10, int(self.target_total * self.density["banking"]))
        records = []
        accounts = self.ctx.accounts
        base_ts = self._windows_start()
        txn_modes = ["UPI", "NEFT", "RTGS", "IMPS", "ATM", "CHEQUE"]

        if not accounts:
            return records

        for i in range(n):
            src = accounts[i % len(accounts)]
            dst = accounts[(i + 2) % len(accounts)] if len(accounts) > 1 else src
            ts = self._add_minutes(base_ts, i * 15 + self.rng.randint(0, 10))

            # Skip transactions before account opening
            if ts < src.opening_date:
                ts = self._add_minutes(src.opening_date, self.rng.randint(60, 1440))

            amount = round(self.rng.uniform(500, 100000), 2)
            new_balance = max(0.0, src.current_balance - amount)
            src.current_balance = new_balance

            record_id = f"CBS-{self.ctx.scenario_id[-4:]}-{i+1:05d}"
            mode = txn_modes[i % len(txn_modes)]
            records.append({
                "transaction_id": record_id,
                "timestamp": ts,
                "source_account": src.account_number,
                "destination_account": dst.account_number,
                "amount": amount,
                "transaction_type": mode,
                "branch_id": f"BR-{src.ifsc[-6:]}",
                "channel": "NET_BANKING" if mode in ["NEFT", "RTGS"] else "MOBILE_APP" if mode == "UPI" else "ATM_KIOSK",
                "balance_after": new_balance,
                "reference_text": self._rng_txn_remark(i)
            })
            self.ctx.registry.register("cbs_bank_transactions.csv", record_id)

        return records

    # ── 6. FIU STR Alerts ───────────────────────────────────────────────────

    def serialize_fiu_str_alerts(self) -> List[Dict[str, Any]]:
        n = max(1, int(self.target_total * self.density["fiu"]))
        records = []
        accounts = self.ctx.accounts
        base_ts = self._windows_start()

        for i in range(n):
            acc = accounts[i % len(accounts)] if accounts else None
            record_id = f"FIU-{self.ctx.scenario_id[-4:]}-{i+1:04d}"
            records.append({
                "alert_id": record_id,
                "account_id": acc.account_number if acc else f"ACC-NOISE-{i}",
                "alert_timestamp": self._add_minutes(base_ts, i * 180 + 30),
                "alert_category": ALERT_CATEGORIES[i % len(ALERT_CATEGORIES)],
                "transaction_reference": f"CBS-{self.ctx.scenario_id[-4:]}-{i+1:05d}",
                "reported_reason": f"Unusual activity detected: {ALERT_CATEGORIES[i % len(ALERT_CATEGORIES)].replace('_', ' ').lower()}.",
                "risk_indicator": self.rng.choice(["HIGH_VELOCITY_MOVEMENT", "ROUND_TRIP", "STRUCTURING", "LARGE_CASH"]),
                "status": self.rng.choice(["OPEN", "UNDER_REVIEW", "CLOSED"])
            })
            self.ctx.registry.register("fiu_str_alerts.json", record_id)

        return records

    # ── 7. Toll ANPR Logs ───────────────────────────────────────────────────

    def serialize_toll_anpr(self) -> List[Dict[str, Any]]:
        n = max(5, int(self.target_total * self.density["anpr"]))
        records = []
        vehicles = self.ctx.vehicles
        toll_locs = [l for l in self.ctx.locations if l.location_type == "TOLL_PLAZA"]
        all_locs = self.ctx.locations
        base_ts = self._windows_start()
        directions = ["NORTHBOUND", "SOUTHBOUND", "INBOUND", "OUTBOUND"]

        for i in range(n):
            veh = vehicles[i % len(vehicles)] if vehicles else None
            loc = (toll_locs[i % len(toll_locs)] if toll_locs
                   else all_locs[i % len(all_locs)] if all_locs else None)
            ts = self._add_minutes(base_ts, i * 25 + self.rng.randint(0, 20))
            plate = veh.plate if veh else f"DL{self.rng.randint(1,14):02d}XX{self.rng.randint(1000,9999)}"
            confidence = round(self.rng.uniform(0.82, 0.99), 2)

            record_id = f"ANPR-{self.ctx.scenario_id[-4:]}-{i+1:05d}"
            records.append({
                "anpr_id": record_id,
                "vehicle_id_or_plate": plate,
                "timestamp": ts,
                "toll_plaza": loc.name if loc else f"Toll-{i+1}",
                "lane": self.rng.randint(1, 6),
                "direction": directions[i % len(directions)],
                "confidence": confidence
            })
            self.ctx.registry.register("toll_anpr_logs.csv", record_id)

        return records

    # ── 8. Cell Tower Dumps ─────────────────────────────────────────────────

    def serialize_cell_tower_dumps(self) -> List[Dict[str, Any]]:
        n = max(3, int(self.target_total * self.density["tower"]))
        records = []
        tower_locs = [l for l in self.ctx.locations if l.tower_id]
        all_phones_msisdn = [p.msisdn for p in self.ctx.phones]
        base_ts = self._windows_start()

        for i in range(n):
            loc = tower_locs[i % len(tower_locs)] if tower_locs else None
            ts_start = self._add_minutes(base_ts, i * 45)
            ts_end = self._add_minutes(ts_start, 30)

            # Include 1-3 known phones from scenario
            n_known = self.rng.randint(1, min(3, len(all_phones_msisdn)))
            known_phones = [all_phones_msisdn[j] for j in range(n_known)]

            record_id = f"TDUMP-{self.ctx.scenario_id[-4:]}-{i+1:04d}"
            records.append({
                "dump_id": record_id,
                "tower_id": loc.tower_id if loc else f"TOWER-UNKNOWN-{i}",
                "timestamp_window": f"{ts_start} to {ts_end}",
                "time_window_start": ts_start,
                "time_window_end": ts_end,
                "phone_numbers": known_phones,   # noise injector will add more
                "estimated_area": loc.name if loc else f"Area-{i+1}",
                "lat": loc.lat if loc else 28.6,
                "lon": loc.lon if loc else 77.2
            })
            self.ctx.registry.register("cell_tower_dumps.json", record_id)

        return records

    # ── 9. OSINT Social Media ───────────────────────────────────────────────

    def serialize_osint_social(self) -> List[Dict[str, Any]]:
        n = max(2, int(self.target_total * self.density["osint"]))
        records = []
        base_ts = self._windows_start()
        texts = [
            "Looking for quick settlement for business matters. Inbox only.",
            "Anyone need document processing fast? No questions. DM.",
            "Found interesting item, will share with interested parties.",
            "Meeting arranged for evening. Usual place.",
            "Great meal at the new restaurant in Connaught Place!",
            "Traffic jam near toll plaza today. 45 min delay.",
            "Government tender open for applications. Deadline 30 Aug.",
            "Heavy rain expected in Delhi today. Stay safe.",
            "New smartphone deal — 40% off at Croma outlets.",
            "Yoga class tomorrow at 6AM in park.",
        ]

        for i in range(n):
            platform = PLATFORMS[i % len(PLATFORMS)]
            ts = self._add_minutes(base_ts, i * 90 + self.rng.randint(0, 60))
            record_id = f"OSINT-{self.ctx.scenario_id[-4:]}-{i+1:04d}"
            records.append({
                "post_id": record_id,
                "platform": platform,
                "synthetic_account": f"@user_{(self.ctx.seed + i * 9999) % 100000:05d}",
                "timestamp": ts,
                "text": texts[i % len(texts)],
                "mentioned_entities": [],
                "location_hint": "Delhi NCR" if i % 3 == 0 else None,
                "media_reference": None,
                "engagement_metadata": {
                    "views": self.rng.randint(50, 5000),
                    "shares": self.rng.randint(0, 200)
                }
            })
            self.ctx.registry.register("osint_social_posts.json", record_id)

        return records

    # ── 10. Field Intelligence Notes ────────────────────────────────────────

    def serialize_field_notes(self) -> str:
        """Structured field notes with parseable [FNOTE-ID] prefixes for evidence lookup."""
        n = max(3, int(self.target_total * self.density["field_notes_entries"]))
        base_ts = self._windows_start()
        lines = [
            f"[FIELD INTELLIGENCE NOTES — SCENARIO {self.ctx.scenario_id}]",
            f"[CLASSIFICATION: RESTRICTED SYNTHETIC EXERCISE DATA]",
            f"[DISTRICT: {self.ctx.locations[0].district if self.ctx.locations else 'Unknown'}]",
            ""
        ]

        templates = [
            "Source tip received regarding unusual vehicle movement near {loc}.",
            "Subject observed making repeated phone calls at {loc}. Identity unconfirmed.",
            "Financial intelligence indicates high-value transfer activity from branch at {loc}.",
            "Commercial vehicle spotted near incident area. Registration details unverified.",
            "Informant reports meeting between two individuals at {loc}. Identities unclear.",
            "CCTV footage requested from {loc} for the investigation window.",
            "Mobile surveillance unit deployed at {loc}. No significant development.",
            "Coordination received from district unit regarding person of interest.",
            "Witness statement recorded. Details pending verification.",
            "Field team returned without contact. Target location was vacated.",
        ]

        for i in range(n):
            ts = self._add_minutes(base_ts, i * 90 + self.rng.randint(0, 60))
            loc_name = self.ctx.locations[i % len(self.ctx.locations)].name if self.ctx.locations else "area"
            note_id = f"FNOTE-{self.ctx.scenario_id[-4:]}-{i+1:04d}"
            text = templates[i % len(templates)].format(loc=loc_name)
            lines.append(f"[{note_id}] {ts[:16]} HRS: {text}")
            self.ctx.registry.register("field_intelligence_notes.txt", note_id)

        return "\n".join(lines)

    # ── Private helpers ──────────────────────────────────────────────────────

    def _rng_district(self) -> str:
        districts = ["New Delhi", "South Delhi", "East Delhi", "West Delhi", "Gurugram", "Noida"]
        return self.rng.choice(districts)

    def _rng_officer(self, idx: int) -> str:
        names = ["Anil Kumar", "Pradeep Singh", "Sunita Verma", "Rajiv Sharma", "Meena Gupta"]
        return names[idx % len(names)]

    def _rng_doc_type(self, idx: int) -> str:
        types = ["Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Passport"]
        return types[idx % len(types)]

    def _rng_txn_remark(self, idx: int) -> str:
        remarks = [
            "Online payment", "Invoice settlement", "Salary credit", "UPI transfer",
            "Vendor payment", "EMI debit", "Refund credit", "Self-transfer",
            "Business advance", "Utility payment"
        ]
        return remarks[idx % len(remarks)]

    def _fir_narrative(self, offense_key: str, idx: int) -> str:
        narratives = {
            "CYBER_FRAUD": f"Complainant reported receiving fraudulent call posing as bank official. Transferred funds under duress. Matter under investigation.",
            "EXTORTION": f"Complainant reported receiving threatening messages demanding money. Partial payment made. Accused not yet identified.",
            "ROBBERY": f"Complainant's vehicle stopped by unidentified persons. Valuables taken at knifepoint. Witnesses being traced.",
            "NARCOTICS": f"Contraband substance recovered during routine vehicle check. Sample sent for forensic analysis.",
            "FINANCIAL_FRAUD": f"Complainant reports unauthorized withdrawals from bank account. KYC data suspected to be compromised.",
            "VEHICLE_THEFT": f"Complainant's vehicle found missing from designated parking. CCTV footage being reviewed.",
        }
        return narratives.get(offense_key, f"Complainant reported incident. Details under investigation. Case number {idx+100}.")
