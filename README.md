# SIH26189 — AI-Powered Criminal Network Analysis System

This project defines the dataset generation architecture, schemas, noise models, ground-truth graph, validation rules, and prompt engineering pipeline for **SIH26189: AI-Powered Criminal Investigation & Intelligence-Analysis System**.

---

## 1. PREREQUISITES

* **Node.js** + **npm**
* **Python 3.10+**
* **Git**

> Note: The current MVP backend uses the tracked `corpus_small.jsonl` dataset through FastAPI. You do **NOT** need MongoDB, PostgreSQL, Supabase, Qdrant, OpenAI API key, Gemini API key, or any external AI service to run the application.

---

## 2. CLONE / OPEN PROJECT

```bash
git clone https://github.com/Shreyagosavi811/SIH-26-Criminal-Network-Analysis.git
cd SIH-26-Criminal-Network-Analysis
```

---

## 3. BACKEND SETUP

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

**Create a virtual environment (Windows):**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run the backend server:**
```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at: `http://localhost:8000`

* **API health endpoint:** `http://localhost:8000/api/health`
* **Interactive Documentation (Swagger):** `http://localhost:8000/docs`

The backend reads the MVP observed dataset directly from:
`investigation_dataset_engine/output/RAG_CORPUS/corpus_small.jsonl`

*(Do not generate or download `corpus_full.jsonl` or start Qdrant for this setup).*

---

## 4. FRONTEND SETUP

Open a **second terminal** and navigate to the frontend directory from the project root:

```bash
cd frontend
```

**Install dependencies:**
```bash
npm install
```

**Run the development server:**
```bash
npm run dev
```

The frontend will normally be available at: `http://localhost:5173`

---

## 5. RUNNING BOTH

To run the full stack locally, use two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser. The frontend will automatically connect to the FastAPI backend when it is available.

---

## 6. OFFLINE / FALLBACK BEHAVIOR

The frontend has an offline/mock fallback system for the MVP.
If the backend is unavailable:
* The UI can still load using fallback/mock data seamlessly.
* Real observed dataset integration is actively used when the backend is online.

> **Important**: The mock fallback is strictly for graceful UI/demo operation and is NOT presented as real investigative evidence.

---

## 7. BUILD / VALIDATION

**Frontend production build:**
```bash
cd frontend
npm run build
```

**Backend tests:**
```bash
cd backend
pytest tests/test_api.py
```
*Expected backend test result:* `6/6 tests passing`

---

## 8. CURRENT MVP DATA ARCHITECTURE

```text
React Frontend
↓
FastAPI Backend
↓
corpus_small.jsonl
↓
Observed Investigative Records
```

* The current MVP intentionally uses the small 100-record corpus.
* The corpus contains observed synthetic investigative artifacts.
* Ground-truth data is not exposed to the frontend.
* The current system does not make autonomous criminal-guilt conclusions.
* Observed relationships should not be interpreted as proof of criminal association.

---

## 9. DATA SOURCES

The 10 currently supported observed source types are:

1. CCTNS FIR Records
2. CDR Logs
3. Bank Transactions
4. ANPR/Toll Logs
5. FIU STR Alerts
6. OSINT Social Posts
7. Field Intelligence Notes
8. Cell Tower Dumps
9. Telecom CAF/KYC
10. Criminal History Database

---

## 10. CURRENT PROJECT STATUS

* **Phase 1 — Backend Foundation** — COMPLETE
* **Phase 1.5 — Runtime Validation** — COMPLETE
* **UI/UX Polish** — COMPLETE
* **Phase 2A–2H — Frontend/Backend Integration** — COMPLETE
* **Phase 3 — AI + RAG** — NEXT

> Note: AI/RAG is not required to run the current MVP.

---

## 11. TROUBLESHOOTING

**Backend won't start:**
* Ensure Python virtual environment is activated.
* Run `pip install -r requirements.txt`.
* Ensure port `8000` is available.

**Frontend won't start:**
* Run `npm install`.
* Run `npm run dev`.
* Ensure port `5173` is available.

**Frontend shows fallback/mock data:**
* Check whether FastAPI is running on port `8000`.
* Check `http://localhost:8000/api/health`.

**CORS/API connection issue:**
* Make sure the backend is running before testing live integration.

---

## 12. SECURITY / GIT HYGIENE

Generated/local artifacts are intentionally excluded from Git:
* `corpus_full.jsonl`
* Qdrant local storage
* checkpoint directories
* temporary inspection scripts

The tracked MVP corpus is safely located at:
`investigation_dataset_engine/output/RAG_CORPUS/corpus_small.jsonl`

---

## Original Dataset Engine Architecture Reference

### Repository Structure

```text
investigation_dataset_engine/
├── config/
│   └── dataset_config.yaml                  # Configuration for MVP, Demo, and Evaluation scales
├── architecture/
│   ├── 01_overall_architecture.md           # Graph-First Synthetic Data Engine Architecture
│   ├── 02_entity_and_source_schemas.md      # 12 Entities & 10 Fragmented Source Record Schemas
│   ├── 03_ground_truth_and_noise_strategy.md# Hidden Ground-Truth Graph & Controlled Noise Engine
│   ├── 04_scenarios_and_query_benchmark.md  # 10 Investigation Scenarios & QA Benchmark Format
│   └── 05_pipeline_validation_and_prompting.md # Data Pipeline, Consistency Rules & Prompt Architecture
└── schemas/
    ├── entity_schemas.json                  # Formal JSON schemas for entities
    ├── source_record_schemas.json           # Schemas for fragmented investigative data sources
    └── ground_truth_schema.json             # Hidden graph & ground-truth evaluation schema
```

### Core System Architecture at a Glance

The dataset architecture uses a **Graph-First Synthetic Data Engineering Pipeline (GF-SDEP)** that separates the **Hidden Ground-Truth Graph ($G_{gt}$)** from the **Observed Source Records Layer ($R_{obs}$)**.

```text
+-------------------------------------------------------------------------+
|                  1. SCENARIO & GRAPH TOPOLOGY ENGINE                    |
|       Generates multi-hop network graphs with hidden connections        |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                2. TEMPORAL & ATTRIBUTE BINDING ENGINE                   |
|   Attaches timestamps, geolocations, names, IPC sections, identifiers  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                 3. NOISE & DISTRACTOR INJECTION ENGINE                  |
|    Injects spatial overlap, name collisions, typos, stale numbers       |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  4. FACETED SOURCE RECORD SERIALIZER                    |
|   Transforms graph nodes/edges into 10 fragmented, realistic databases  |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                5. CONSISTENCY & ANTI-LEAKAGE AUDITOR                    |
|  Validates physical limits, speed, temporal causality, label leakage    |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|              6. INVESTIGATION QUERY & BENCHMARK EXPORTER                |
|     Outputs multi-source record files + hidden ground truth + Q&A pairs |
+-------------------------------------------------------------------------+
```

### Key Design Principles

1. **Graph-First Integrity**: Records are derived from a unified, time-consistent hidden ground truth graph ($G_{gt}$) rather than randomly generated tables.
2. **Realistic Fragmentation**: Source records reflect actual Indian law enforcement datasets (CCTNS, Telecom CDR/CAF, CBS Banking, Toll ANPR, Cell Tower Dumps, OSINT, Intelligence Field Reports).
3. **Anti-Leakage Guarantees**: Raw source records never contain analytical labels like "kingpin" or "suspicious link". All intelligence must be inferred through multi-hop evidence correlation.
4. **Strict Physical & Temporal Consistency**: Teleportation prevention, causal ordering, and transaction balance logic are programmatically enforced.
5. **Multi-Scale Deployability**: Scalable configurations for MVP (50 entities), Demo (350 entities), and Final Evaluation (2,500 entities).
