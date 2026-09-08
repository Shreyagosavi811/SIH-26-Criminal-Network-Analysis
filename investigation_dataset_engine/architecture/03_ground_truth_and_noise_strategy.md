# 03. Ground Truth Graph, Noise Strategy & Anti-Leakage Model

## Part A: Ground Truth Schema ($G_{gt}$)

The Ground Truth Graph ($G_{gt}$) stores the complete, uncorrupted reality of all scenarios. It contains canonical entities, true edges, evidence chains, and confidence scores.

### Ground Truth File Format: `ground_truth_manifest.json`

```json
{
  "scenario_id": "SCN-2026-CYBER-001",
  "scenario_name": "Multi-State Cyber Fraud & Layering Ring",
  "scenario_type": "FINANCIAL_NETWORK_MULTI_HOP",
  "master_timeline": [
    {
      "step": 1,
      "timestamp": "2026-08-01T10:15:00Z",
      "event_type": "ACCOUNT_CREATION",
      "description": "Mule Account ACC_90182 created by Person PER_004 using fake address proof.",
      "supporting_evidence_records": ["CBS-ACC-90182", "CAF-919876543210"]
    },
    {
      "step": 2,
      "timestamp": "2026-08-05T14:30:00Z",
      "event_type": "CYBER_FRAUD_VICTIM_TRANSFER",
      "description": "Victim transfers Rs 5,00,000 into Mule Account ACC_90182 under pretense of Customs fee.",
      "supporting_evidence_records": ["FIR-2026-0421", "CBS-TXN-882190"]
    }
  ],
  "ground_truth_entities": [
    {
      "canonical_id": "ENT_PER_001042",
      "real_name": "Vikram "Kingpin" Choudhury",
      "role_in_scenario": "MASTERMIND",
      "associated_sources": ["cctns_fir_records", "criminal_history_db", "telecom_caf_kyc"]
    }
  ],
  "ground_truth_relationships": [
    {
      "edge_id": "EDGE_GT_00891",
      "source_entity": "ENT_PER_001042",
      "target_entity": "ENT_ACC_440192",
      "relationship_type": "BENEFICIAL_OWNER_HIDDEN",
      "is_direct_or_inferred": "INFERRED",
      "evidence_path": [
        {"source": "telecom_cdr_logs", "record_id": "CDR-891023"},
        {"source": "cbs_bank_transactions", "record_id": "TXN-991823"},
        {"source": "field_intelligence_notes", "record_id": "INT-NOTE-042"}
      ],
      "temporal_validity": {
        "start": "2026-07-01T00:00:00Z",
        "end": "2026-08-25T00:00:00Z"
      },
      "ground_truth_confidence": 0.95
    }
  ]
}
```

---

## Part B: Noise Generation Strategy

To prevent simple string matching or naive shortest-path graph queries from solving investigations, we introduce **6 Controlled Realistic Noise Injectors**:

```text
+-------------------------------------------------------------------------+
|                    NOISE GENERATION STRATEGY MATRIX                     |
+------------------------------------+------------------------------------+
| Noise Type                         | Implementation Strategy            |
+------------------------------------+------------------------------------+
| 1. Spatial Overlap Noise           | Inject unrelated MSISDNs at busy  |
|                                    | cell towers / toll plazas during   |
|                                    | crime timestamps (cell congestion).|
|                                    |                                    |
| 2. Identity & Name Collisions      | Synthesize common Indian names     |
|                                    | ("Rajesh Kumar", "Amit Sharma")    |
|                                    | across unrelated FIRs and CAF DBs. |
|                                    |                                    |
| 3. Data Entry & OCR Typos          | Introduce random character drops,  |
|                                    | swapped digits in registration     |
|                                    | plates (e.g. MH02AB1234 -> 1243),  |
|                                    | and phonetic address variations.   |
|                                    |                                    |
| 4. Recycled Telecom MSISDNs        | Simulate phone numbers deactivated |
|                                    | and reassigned after 90 days,      |
|                                    | creating historical owner mismatches|
|                                    |                                    |
| 5. Benign High-Volume Financials   | Surround illicit micro-layering    |
|                                    | transactions with high-frequency   |
|                                    | commercial payroll & UPI payments. |
|                                    |                                    |
| 6. Distractor Subgraphs            | Inject parallel, benign multi-hop  |
|                                    | networks (e.g. a wedding travel    |
|                                    | convoy mirroring a getaway route). |
+------------------------------------+------------------------------------+
```

### Noise Control Ratio (Configurable per Scenario)
- **Target SNR (Signal-to-Noise Ratio)**:
  - MVP Dataset: 1 Ground-Truth Record : 3 Noise Records (75% Noise)
  - Demo Dataset: 1 Ground-Truth Record : 10 Noise Records (90.9% Noise)
  - Final Evaluation Benchmark: 1 Ground-Truth Record : 50 Noise Records (98% Noise)

---

## Part C: Anti-Leakage Strategy & Operational Realism

To guarantee that the synthetic dataset requires genuine multi-source AI reasoning rather than trivial keyword lookup, we enforce **4 Strict Anti-Leakage Rules**:

1. **Zero Explicit Semantic Badges**:
   - Source records MUST NOT contain terms like `"mastermind"`, `"mule"`, `"suspicious_link"`, `"crime_associate"`, or `"hidden_boss"`.
   - CCTNS FIR narratives report only what a complainant or arresting officer observed (e.g., *"Unidentified male aged ~30 wearing black jacket entered bank at 14:15"*).

2. **Source-Native Terminology Separation**:
   - Banking records use banking terms (`"NEFT/IMPS UTR"`, `"ATM Withdrawal"`, `"CIF No"`).
   - Telecom records use telecom terms (`"LAC/CID"`, `"IMEI"`, `"MSISDN"`, `"A-Party/B-Party"`).
   - Traffic records use highway terms (`"Plaza 104 Lane 3"`, `"Fastag RFID Hex"`).
   - The AI must bridge cross-domain semantics.

3. **No Global Shared Keys**:
   - There is NO single `citizen_id` or `universal_person_id` across source files.
   - Entity resolution must be performed dynamically using fuzzy matches on Name + DOB + Father's Name + Phone + Address.

4. **Temporal Contextualization**:
   - Phone calls or transactions occurring *after* an arrest or *before* SIM activation are rejected by the noise generator to prevent nonsensical clues.
