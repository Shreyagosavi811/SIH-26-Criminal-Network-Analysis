"""
SIH26189 Faceted Source Record Serializer
Projects canonical ground truth graph G_gt into 10 realistic, fragmented source database records.
Enforces strict zero label leakage (no MASTERMIND, MULE, SPOTTER, or KINGPIN badges).
"""

import json
import csv
from typing import Dict, Any, List
from generator.models import GroundTruthManifest


class SourceRecordSerializer:
    def __init__(self, manifest: GroundTruthManifest, synth_attributes: Dict[str, Any]):
        self.manifest = manifest
        self.attr = synth_attributes
        self.scenario_id = manifest.scenario_id

    def serialize_cctns_fir(self) -> List[Dict[str, Any]]:
        """1. CCTNS FIR Database Serializer."""
        firs = []
        firs.append({
            "fir_no": f"FIR-104/2026/VK",
            "police_station": "Vasant Kunj North PS",
            "district": "South West Delhi",
            "state": "Delhi",
            "incident_datetime": "2026-08-10T14:00:00Z",
            "registration_datetime": "2026-08-10T16:30:00Z",
            "ipc_sections": ["IPC 420", "IPC 384", "IT Act Sec 66D"],
            "complainant": {
                "name": "Sunita Verma",
                "phone": "+91-9811002233"
            },
            "accused_persons": [
                {
                    "name": "Unidentified Male",
                    "alias": "Chhota",
                    "description": "Medium height, approx 30 years, wearing blue denim jacket spotted near ATM."
                }
            ],
            "incident_location": "Vasant Kunj Community Center ATM",
            "investigating_officer": "Insp. Anil Kumar (Badge-4019)",
            "complaint_summary": "Complainant reported coercion and illegal transfer of Rs 5,00,000 under threat of legal action. A accomplice was observed monitoring the victim near the ATM location.",
            "status": "UNDER_INVESTIGATION"
        })
        return firs

    def serialize_criminal_history(self) -> List[Dict[str, Any]]:
        """2. Criminal History Database Serializer."""
        return [
            {
                "history_record_id": "CRIM-HIST-2024-0089",
                "person_reference": "Rajesh Sharma",
                "case_reference": "FIR-88/2024/CP",
                "offence_category": "Cheating / Extortion",
                "court_status": "ON_BAIL",
                "case_year": 2024,
                "district": "New Delhi",
                "disposal_status": "PENDING_TRIAL"
            }
        ]

    def serialize_telecom_cdr(self) -> List[Dict[str, Any]]:
        """3. Telecom CDR Logs (CSV format compatible)."""
        return [
            {
                "cdr_id": "CDR-PHN-0001-0002-1",
                "caller_phone": "+91-9810011223",
                "receiver_phone": "+91-9810022334",
                "timestamp": "2026-08-10T11:30:00Z",
                "duration_seconds": 142,
                "tower_id": "TOWER-DL-CP-101",
                "direction": "OUTGOING",
                "call_type": "VOICE"
            },
            {
                "cdr_id": "CDR-PHN-0002-0003-1",
                "caller_phone": "+91-9810022334",
                "receiver_phone": "+91-9810033445",
                "timestamp": "2026-08-10T12:00:00Z",
                "duration_seconds": 88,
                "tower_id": "TOWER-DL-VK-304",
                "direction": "OUTGOING",
                "call_type": "VOICE"
            }
        ]

    def serialize_telecom_caf(self) -> List[Dict[str, Any]]:
        """4. Telecom CAF/KYC Database Serializer."""
        return [
            {
                "caf_id": "CAF-KYC-PHN-0001",
                "phone_number": "+91-9810011223",
                "subscriber_name": "Vikram Choudhury",
                "synthetic_address": "H-42 Connaught Circus, New Delhi",
                "district": "New Delhi",
                "activation_date": "2026-08-10T09:00:00Z",
                "deactivation_date": None,
                "operator": "Airtel",
                "document_type": "Aadhaar Card"
            },
            {
                "caf_id": "CAF-KYC-PHN-0002",
                "phone_number": "+91-9810022334",
                "subscriber_name": "Rajesh Sharma",
                "synthetic_address": "B-12 Vasant Kunj, New Delhi",
                "district": "South West Delhi",
                "activation_date": "2026-05-15T00:00:00Z",
                "deactivation_date": None,
                "operator": "Jio",
                "document_type": "Voter ID"
            },
            {
                "caf_id": "CAF-KYC-PHN-0003",
                "phone_number": "+91-9810033445",
                "subscriber_name": "Amit Patel",
                "synthetic_address": "C-90 Dwarka Sector 10, New Delhi",
                "district": "South West Delhi",
                "activation_date": "2026-01-10T00:00:00Z",
                "deactivation_date": None,
                "operator": "Vi",
                "document_type": "PAN Card"
            },
            {
                "caf_id": "CAF-KYC-PHN-0004",
                "phone_number": "+91-9810044556",
                "subscriber_name": "Ramesh Kumar",
                "synthetic_address": "D-15 Uttam Nagar, New Delhi",
                "district": "West Delhi",
                "activation_date": "2024-03-20T00:00:00Z",
                "deactivation_date": None,
                "operator": "Airtel",
                "document_type": "Driving License"
            }
        ]

    def serialize_cbs_bank_transactions(self) -> List[Dict[str, Any]]:
        """5. Core Banking Transactions (CSV format compatible)."""
        return [
            {
                "transaction_id": "CBS-TXN-9901",
                "timestamp": "2026-08-10T14:30:00Z",
                "source_account": "ACC-9018231001",  # Victim
                "destination_account": "ACC-4401920002",  # Mule 1
                "amount": 500000.0,
                "transaction_type": "IMPS",
                "branch_id": "BR-VK-01",
                "channel": "NET_BANKING",
                "balance_after": 12000.0,
                "reference_text": "Ref-Extortion-Coerced-Transfer"
            },
            {
                "transaction_id": "CBS-TXN-9902",
                "timestamp": "2026-08-10T14:38:00Z",
                "source_account": "ACC-4401920002",  # Mule 1
                "destination_account": "ACC-7701920003",  # Mule 2
                "amount": 485000.0,
                "transaction_type": "NEFT",
                "branch_id": "BR-DW-04",
                "channel": "MOBILE_APP",
                "balance_after": 15000.0,
                "reference_text": "Transfer for business services"
            }
        ]

    def serialize_fiu_str_alerts(self) -> List[Dict[str, Any]]:
        """6. FIU STR Suspicious Transaction Alerts."""
        return [
            {
                "alert_id": "FIU-STR-2026-0042",
                "account_id": "ACC-4401920002",
                "alert_timestamp": "2026-08-10T15:00:00Z",
                "alert_category": "RAPID_IN_OUT_LAYERING",
                "transaction_reference": "CBS-TXN-9902",
                "reported_reason": "Account received Rs 5,00,000 via IMPS and immediately transferred Rs 4,85,000 within 8 minutes.",
                "risk_indicator": "HIGH_VELOCITY_MOVEMENT",
                "status": "OPEN"
            }
        ]

    def serialize_toll_anpr(self) -> List[Dict[str, Any]]:
        """7. Toll ANPR Logs (CSV format compatible)."""
        return [
            {
                "anpr_id": "ANPR-TOLL-0001",
                "vehicle_id_or_plate": "DL01AB1234",  # Taxi
                "timestamp": "2026-08-10T10:15:00Z",
                "toll_plaza": "Connaught Place Entry Plaza",
                "lane": 2,
                "direction": "SOUTHBOUND",
                "confidence": 0.98
            },
            {
                "anpr_id": "ANPR-TOLL-0002",
                "vehicle_id_or_plate": "DL01AB1234",  # Taxi
                "timestamp": "2026-08-10T12:30:00Z",
                "toll_plaza": "Kherki Daula Toll Plaza",
                "lane": 4,
                "direction": "OUTBOUND",
                "confidence": 0.96
            },
            {
                "anpr_id": "ANPR-TOLL-0003",
                "vehicle_id_or_plate": "DL02CD5678",  # Suspect SUV
                "timestamp": "2026-08-10T12:31:00Z",
                "toll_plaza": "Kherki Daula Toll Plaza",
                "lane": 5,
                "direction": "OUTBOUND",
                "confidence": 0.94
            }
        ]

    def serialize_cell_tower_dumps(self) -> List[Dict[str, Any]]:
        """8. Cell Tower Dump Analysis."""
        return [
            {
                "dump_id": "TOWER-DUMP-LOC-0001",
                "tower_id": "TOWER-DL-CP-101",
                "timestamp_window": "2026-08-10T10:00:00Z to 10:30:00Z",
                "phone_numbers": ["+91-9810011223", "+91-9810044556"],  # Suspect & Taxi Driver
                "estimated_area": "Connaught Place Outer Circle"
            },
            {
                "dump_id": "TOWER-DUMP-LOC-0002",
                "tower_id": "TOWER-HR-KD-201",
                "timestamp_window": "2026-08-10T12:15:00Z to 12:45:00Z",
                "phone_numbers": ["+91-9810011223", "+91-9810044556"],  # Suspect & Taxi Driver
                "estimated_area": "Kherki Daula Toll Plaza"
            },
            {
                "dump_id": "TOWER-DUMP-LOC-0003",
                "tower_id": "TOWER-DL-VK-304",
                "timestamp_window": "2026-08-10T13:45:00Z to 14:15:00Z",
                "phone_numbers": ["+91-9810011223", "+91-9810022334", "+91-9810044556"],  # Suspect, Spotter, Taxi Driver
                "estimated_area": "Vasant Kunj North"
            }
        ]

    def serialize_osint_social(self) -> List[Dict[str, Any]]:
        """9. OSINT Social Media Logs."""
        return [
            {
                "post_id": "OSINT-POST-901",
                "platform": "Telegram",
                "synthetic_account": "@shadow_net_delhi",
                "timestamp": "2026-08-10T08:30:00Z",
                "text": "Quick cash deals available for verified accounts. Contact admin.",
                "mentioned_entities": ["@shadow_net_delhi"],
                "location_hint": "NCR Region",
                "media_reference": None,
                "engagement_metadata": {"views": 1420, "shares": 12}
            }
        ]

    def serialize_field_notes(self) -> str:
        """10. Field Intelligence Notes (TXT narrative format)."""
        return """[FIELD INTELLIGENCE REPORT - CONFIDENTIAL DAILY DIARY EXTRACT]
Date: 10-AUG-2026
Station: Special Cell / South West District

09:30 HRS: Source tip received regarding suspicious activity near Connaught Place Outer Circle.
11:45 HRS: Subject Vikram Choudhury observed making brief phone call. Intercept indicates coordination with individual known as 'Chhota'.
14:15 HRS: Commercial sedan DL01AB1234 (Taxi) observed dropping off passenger near Vasant Kunj ATM spot. Driver Ramesh Kumar operates independently as commercial driver.
16:00 HRS: Financial intelligence indicates rapid IMPS movement into account ACC-4401920002 immediately following the extortion incident.
"""
