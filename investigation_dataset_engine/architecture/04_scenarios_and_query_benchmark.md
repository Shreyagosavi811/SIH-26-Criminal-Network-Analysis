# 04. Investigation Scenarios & QA Evaluation Benchmark

## Part A: 10 Core Investigation Scenarios

```text
+-----------------------------------------------------------------------------------+
| 1. Person-Centric Investigation                                                   |
|    Input: Person Name & Father Name / Aadhaar Hash.                               |
|    Challenge: Resolve 3 alias identities across 2 states; uncover hidden burner  |
|    phones and owned vehicles registered under fake addresses.                     |
+-----------------------------------------------------------------------------------+
| 2. FIR-Centric Investigation                                                      |
|    Input: FIR Number (e.g. Armed Robbery).                                        |
|    Challenge: Extract getaway vehicle plate, correlate with ANPR toll cameras,    |
|    identify cell tower dump numbers present at robbery & toll plaza, locate suspect.|
+-----------------------------------------------------------------------------------+
| 3. Phone-Centric Investigation                                                    |
|    Input: Suspicious MSISDN / IMEI.                                              |
|    Challenge: Perform co-location CDR analysis, identify frequent B-parties,      |
|    detect IMEI swapping (same phone, multiple SIMs), map social network tree.     |
+-----------------------------------------------------------------------------------+
| 4. Financial-Network Investigation                                                |
|    Input: Victim Transaction UTR / Flagged Bank Account.                          |
|    Challenge: Trace multi-tier fund layering across 12 mule accounts in 4 banks;  |
|    identify cash withdrawal ATMs and final beneficiary entity.                    |
+-----------------------------------------------------------------------------------+
| 5. Vehicle Investigation                                                          |
|    Input: Registration Plate Number.                                             |
|    Challenge: Detect cloned plate usage (vehicle spotted simultaneously at two    |
|    distant toll plazas), correlate with registered owner & CCTNS stolen reports.   |
+-----------------------------------------------------------------------------------+
| 6. Location-Based Investigation                                                   |
|    Input: Location Coordinates / Cell Tower LAC-CID + Time Window (Crime Incident)|
|    Challenge: Analyze Tower Dumps, filter high-volume commuter noise, extract      |
|    burner phones activated < 24h prior to incident, trace suspect escape route.  |
+-----------------------------------------------------------------------------------+
| 7. Multi-Hop Criminal-Network Syndicate                                           |
|    Input: Low-level Street Peddler (Person A).                                    |
|    Challenge: Navigate 4-hop chain: Peddler -> Handler Phone -> Financial Mule -> |
|    Shell Company Director -> Regional Syndicate Kingpin.                          |
+-----------------------------------------------------------------------------------+
| 8. Cross-Case Relationship Discovery                                              |
|    Input: Two seemingly unrelated burglary FIRs in different districts.           |
|    Challenge: Correlate matching MO, common fence/pawn shop account transfer, and  |
|    co-located vehicle ANPR spot to establish single interstate gang involvement.   |
+-----------------------------------------------------------------------------------+
| 9. Timeline Reconstruction                                                        |
|    Input: Cyber-Extortion Case ID.                                                |
|    Challenge: Construct exact minute-by-minute timeline over 72 hours across      |
|    phishing SMS, bank transfer, WhatsApp CDR, toll plaza pass, and cash withdrawal|
+-----------------------------------------------------------------------------------+
| 10. False-Positive Discrimination                                                 |
|     Input: Suspect Phone + Co-located Taxi Driver Phone.                          |
|     Challenge: Discriminate between an innocent commercial taxi driver co-located  |
|     3 times vs. an active criminal co-conspirator spotter.                        |
+-----------------------------------------------------------------------------------+
```

---

## Part B: Investigation Query & Expected Answer Schema

### 1. Input Query Schema (`investigation_queries.json`)

```json
{
  "query_id": "QRY-2026-0042",
  "scenario_id": "SCN-2026-CYBER-001",
  "query_type": "FINANCIAL_NETWORK_DISCOVERY",
  "starting_entity": {
    "entity_type": "ACCOUNT",
    "identifier_key": "account_number",
    "identifier_value": "901823104912"
  },
  "search_parameters": {
    "max_hops": 4,
    "start_timestamp": "2026-08-01T00:00:00Z",
    "end_timestamp": "2026-08-25T23:59:59Z",
    "min_transaction_amount_inr": 10000.0
  },
  "investigation_prompt": "Trace all fund outflows from Account 901823104912. Identify all intermediate mule accounts, ultimate cash withdrawal points, and associated account holder identities across CBS bank logs and CAF records."
}
```

### 2. Expected Answer Schema (`investigation_answers.json`)

```json
{
  "query_id": "QRY-2026-0042",
  "scenario_id": "SCN-2026-CYBER-001",
  "evaluation_ground_truth": {
    "target_primary_suspect": {
      "canonical_id": "ENT_PER_001042",
      "resolved_name": "Vikram Choudhury",
      "role": "BENEFICIAL_OWNER_KINGPIN"
    },
    "key_entities_in_chain": [
      {"canonical_id": "ENT_ACC_901823104912", "type": "ACCOUNT", "role": "ENTRY_MULE_TIER_1"},
      {"canonical_id": "ENT_ACC_440192001923", "type": "ACCOUNT", "role": "LAYERING_MULE_TIER_2"},
      {"canonical_id": "ENT_PHN_919876543210", "type": "PHONE", "role": "OPERATIONAL_BURNER"}
    ],
    "relationship_graph": [
      {
        "source": "ENT_ACC_901823104912",
        "target": "ENT_ACC_440192001923",
        "relation": "TRANSFERS_FUNDS",
        "evidence_records": ["CBS-TXN-882190", "CBS-TXN-882195"]
      }
    ],
    "chronological_timeline": [
      {
        "timestamp": "2026-08-05T14:30:00Z",
        "summary": "Rs 5,00,000 transferred from Victim to Mule Acc 901823104912.",
        "record_ref": "CBS-TXN-882190"
      },
      {
        "timestamp": "2026-08-05T14:38:00Z",
        "summary": "Rs 4,85,000 layered into Tier-2 Mule Acc 440192001923 via IMPS.",
        "record_ref": "CBS-TXN-882195"
      }
    ],
    "intelligence_summary": "Account 901823104912 serves as a Tier-1 mule account receiving illicit proceeds from cyber fraud FIR-2026-0421. Funds are immediately layered within 8 minutes into Tier-2 Account 440192001923, controlled by Vikram Choudhury using burner MSISDN +91-9876543210.",
    "expected_confidence_score": 0.94
  }
}
```
