# 02. Entity & Source Record Schemas

## Part A: Entity Model (Canonical Graph Entities)

Every entity in the hidden ground-truth graph $G_{gt}$ has a unique synthetic canonical ID (`ENT_xxx`), structured attributes, relationship slots, temporal scope, and source provenance tracking.

---

### 1. PERSON
- **Entity ID**: `ENT_PER_xxxxxx`
- **Attributes**:
  - `full_name`: String (e.g., "Rajesh Kumar Sharma")
  - `alias_names`: List[String] (e.g., ["Raju Totla", "Rajesh Pandit"])
  - `dob`: Date (e.g., "1988-05-14")
  - `gender`: String ("M" / "F" / "Other")
  - `father_name`: String (e.g., "Ramesh Chandra Sharma")
  - `aadhaar_hash`: String (SHA-256 synthetic hash)
  - `pan_number`: String (Format: `[A-Z]{5}[0-9]{4}[A-Z]{1}`)
  - `primary_address`: String
  - `occupation`: String
- **Relationships**: `OWNS` (Phone, Vehicle, Account, SocialAccount), `ASSOCIATED_WITH` (Person, Organization), `PRESENT_DURING` (Event)
- **Temporal Scope**: Active lifespan (`created_at`, `updated_at`)
- **Provenance**: Derived across CCTNS, CAF, CBS, and Intelligence files.

---

### 2. FIR / CASE (`FIR_CASE`)
- **Entity ID**: `ENT_FIR_xxxxxx`
- **Attributes**:
  - `fir_number`: String (Format: `FIR-[0-9]{3}/[0-9]{4}/[PS_CODE]`)
  - `police_station`: String (e.g., "Vasant Kunj North PS")
  - `district`: String (e.g., "South West Delhi")
  - `state`: String (e.g., "Delhi")
  - `date_of_incident`: ISO-8601 Timestamp
  - `date_of_registration`: ISO-8601 Timestamp
  - `acts_and_sections`: List[String] (e.g., ["IPC 420", "IPC 120B", "IT Act Sec 66D"])
  - `offense_category`: String ("Cyber Fraud", "Armed Robbery", "Narcotics", "Extortion")
  - `complaint_summary`: String (Unstructured incident text narrative)
  - `investigating_officer`: String (Name & Badge ID)
- **Relationships**: `NAMED_IN` (Person), `INVOLVES_VEHICLE` (Vehicle), `SEIZED_EVIDENCE` (Evidence)
- **Temporal Scope**: Open date to charge-sheet / closure date.

---

### 3. PHONE
- **Entity ID**: `ENT_PHN_xxxxxx`
- **Attributes**:
  - `msisdn`: String (Indian mobile format: `+91-9xxxx-xxxxx`)
  - `imei`: String (15-digit TAC code format)
  - `imsi`: String (15-digit subscriber identifier)
  - `service_provider`: String ("Airtel", "Jio", "Vi", "BSNL")
  - `activation_date`: Date
  - `status`: String ("ACTIVE", "DEACTIVATED", "SUSPENDED")
- **Relationships**: `OWNS` (by Person), `COMMUNICATES_WITH` (Phone)
- **Temporal Scope**: Activation date to deactivation date.

---

### 4. VEHICLE
- **Entity ID**: `ENT_VEH_xxxxxx`
- **Attributes**:
  - `registration_number`: String (Format: `[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}`)
  - `chassis_number`: String (17 alphanumeric)
  - `engine_number`: String (11-14 alphanumeric)
  - `make_model`: String (e.g., "Hyundai Creta White 2022")
  - `color`: String
  - `registered_owner_id`: `ENT_PER_xxxxxx` or `ENT_ORG_xxxxxx`
- **Relationships**: `OWNS` (by Person/Org), `LOCATED_AT` (Location via ANPR Toll logs)
- **Temporal Scope**: Vehicle registration date to current.

---

### 5. ACCOUNT
- **Entity ID**: `ENT_ACC_xxxxxx`
- **Attributes**:
  - `account_number`: String (11 to 16 digits)
  - `bank_name`: String (e.g., "State Bank of India", "HDFC Bank")
  - `ifsc_code`: String (Format: `[A-Z]{4}0[A-Z0-9]{6}`)
  - `account_type`: String ("SAVINGS", "CURRENT", "WALLET")
  - `cif_number`: String (Customer Information File ID)
  - `opening_date`: Date
- **Relationships**: `OWNS` (by Person/Org), `TRANSFERS_FUNDS` (to Account)
- **Temporal Scope**: Account opening date to present.

---

### 6. TRANSACTION
- **Entity ID**: `ENT_TXN_xxxxxx`
- **Attributes**:
  - `transaction_reference`: String (UTR / UPI Ref Number)
  - `sender_account_id`: `ENT_ACC_xxxxxx`
  - `receiver_account_id`: `ENT_ACC_xxxxxx`
  - `amount_inr`: Float
  - `timestamp`: ISO-8601 Timestamp
  - `channel`: String ("UPI", "NEFT", "RTGS", "IMPS", "ATM_CASH")
  - `remarks`: String (e.g., "Payment for services", "Self transfer", "Ref-90182")
- **Relationships**: Connects `ENT_ACC_src` -> `ENT_ACC_dst`
- **Temporal Scope**: Point-in-time timestamp.

---

### 7. LOCATION
- **Entity ID**: `ENT_LOC_xxxxxx`
- **Attributes**:
  - `location_name`: String (e.g., "Kherki Daula Toll Plaza", "Cell Tower DL-3049")
  - `location_type`: String ("TOLL_PLAZA", "CELL_TOWER", "ATM", "HOTEL", "RESIDENCE")
  - `latitude`: Float
  - `longitude`: Float
  - `address`: String
  - `district_state`: String
- **Relationships**: `LOCATED_AT` (Person/Vehicle/Phone at Timestamp)
- **Temporal Scope**: Static geographical coordinate.

---

### 8. ORGANIZATION
- **Entity ID**: `ENT_ORG_xxxxxx`
- **Attributes**:
  - `company_name`: String (e.g., "Apex Logistics Pvt Ltd")
  - `cin`: String (Corporate Identification Number)
  - `gstin`: String (15-character GST number)
  - `org_type`: String ("PRIVATE_LIMITED", "SHELL_COMPANY", "NGO", "SOLE_PROPRIETOR")
  - `registered_address`: String
- **Relationships**: `OWNS` (Accounts, Vehicles), `EMPLOYED_BY` / `DIRECTOR_OF` (Person)
- **Temporal Scope**: Incorporation date to present.

---

### 9. SOCIAL_ACCOUNT
- **Entity ID**: `ENT_SOC_xxxxxx`
- **Attributes**:
  - `platform`: String ("Telegram", "WhatsApp", "Instagram", "Darknet_Forum")
  - `username_handle`: String (e.g., "@shadow_trader_99")
  - `associated_phone`: String
  - `account_creation_date`: Date
- **Relationships**: `OWNS` (by Person), `COMMUNICATES_WITH` (SocialAccount)
- **Temporal Scope**: Creation date to suspension/active.

---

### 10. EVENT
- **Entity ID**: `ENT_EVT_xxxxxx`
- **Attributes**:
  - `event_type`: String ("MEETING", "CRIME_INCIDENT", "FUND_LAYERING", "VEHICLE_SPOT")
  - `start_timestamp`: ISO-8601 Timestamp
  - `end_timestamp`: ISO-8601 Timestamp
  - `location_id`: `ENT_LOC_xxxxxx`
  - `summary`: String
- **Relationships**: `PARTICIPATED_IN` (Person, Phone, Vehicle)
- **Temporal Scope**: Start to end timestamp window.

---

### 11. EVIDENCE
- **Entity ID**: `ENT_EVD_xxxxxx`
- **Attributes**:
  - `evidence_type`: String ("CCTV_FOOTAGE", "SEIZURE_MEMO", "FORENSIC_PHONE_DUMP", "TOWER_DUMP_FILE")
  - `description`: String
  - `seizure_timestamp`: ISO-8601 Timestamp
  - `seizing_officer`: String
  - `file_hash`: String (SHA-256)
- **Relationships**: `ATTACHED_TO` (FIR_CASE)
- **Temporal Scope**: Seizure date to custody.

---

### 12. COMMUNICATION (CDR Edge Record)
- **Entity ID**: `ENT_COM_xxxxxx`
- **Attributes**:
  - `caller_msisdn`: String
  - `receiver_msisdn`: String
  - `call_type`: String ("VOICE_INCOMING", "VOICE_OUTGOING", "SMS", "DATA_CALL")
  - `timestamp`: ISO-8601 Timestamp
  - `duration_seconds`: Integer
  - `start_cell_id`: String
  - `end_cell_id`: String
- **Relationships**: Connects `ENT_PHN_caller` -> `ENT_PHN_receiver`
- **Temporal Scope**: Call start time + duration.

---

## Part B: Fragmented Source Record Schemas

The 10 source record schemas simulate distinct real-world investigative databases. Each source strips internal entity keys (`ENT_xxx`) and uses only source-native identifiers.

```text
+-----------------------------------------------------------------------------------+
| Source 1: CCTNS FIR Records (`cctns_fir_records.json`)                             |
| Schema: { fir_no, police_station, district, state, incident_datetime,            |
|           registration_datetime, ipc_sections, complainant: {name, phone},       |
|           accused_mentioned: [{name, alias, description}], summary_narrative }   |
+-----------------------------------------------------------------------------------+
| Source 2: Criminal History DB (`criminal_history_db.json`)                        |
| Schema: { criminal_id, full_name, aliases, modus_operandi, prior_firs,           |
|           fingerprint_class, known_associates_unverified: [name_string] }        |
+-----------------------------------------------------------------------------------+
| Source 3: Telecom CDR Logs (`telecom_cdr_logs.csv`)                              |
| Schema: calling_no, called_no, imei, timestamp, duration_sec, call_type, cell_id |
+-----------------------------------------------------------------------------------+
| Source 4: Subscriber KYC CAF DB (`telecom_caf_kyc.json`)                         |
| Schema: { msisdn, customer_name, id_proof_type, id_number_masked,                |
|           address_line, alternate_contact_no, activation_date, vendor_name }     |
+-----------------------------------------------------------------------------------+
| Source 5: Core Banking CBS Ledger (`cbs_bank_transactions.csv`)                  |
| Schema: transaction_id, txn_date, debit_acc, credit_acc, amount, mode, utr_no    |
+-----------------------------------------------------------------------------------+
| Source 6: FIU STR Suspicious Alerts (`fiu_str_alerts.json`)                      |
| Schema: { alert_id, account_no, bank_name, alert_type, total_amount_7d,         |
|           structuring_score, flagged_counterparties: [account_no] }              |
+-----------------------------------------------------------------------------------+
| Source 7: Toll ANPR Traffic Logs (`toll_anpr_logs.csv`)                          |
| Schema: log_id, toll_plaza_id, vehicle_reg_no, timestamp, lane, camera_conf      |
+-----------------------------------------------------------------------------------+
| Source 8: Cell Tower Dump Analysis (`cell_tower_dumps.json`)                     |
| Schema: { dump_id, tower_id, location_lat_long, time_window_start,               |
|           time_window_end, connected_msisdn_list: [msisdn] }                      |
+-----------------------------------------------------------------------------------+
| Source 9: OSINT Social Media Logs (`osint_social_posts.json`)                    |
| Schema: { post_id, platform, handle, content_text, timestamp, tagged_handles,   |
|           linked_phone_or_email, geo_tag }                                       |
+-----------------------------------------------------------------------------------+
| Source 10: Surveillance Field Reports (`field_intelligence_notes.txt`)           |
| Schema: Unstructured Intelligence Summaries with Officer Daily Diary entries       |
+-----------------------------------------------------------------------------------+
```
