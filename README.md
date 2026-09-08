# SIH26189 Synthetic Investigation Dataset Generator Engine
## Master Architecture & Engineering Blueprint

This project defines the dataset generation architecture, schemas, noise models, ground-truth graph, validation rules, and prompt engineering pipeline for **SIH26189: AI-Powered Criminal Investigation & Intelligence-Analysis System**.

---

## Repository Structure

```text
d:/Antigravity/SIH26189/investigation_dataset_engine/
├── README.md                                # Master overview & quick start
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

---

## Core System Architecture at a Glance

The dataset architecture uses a **Graph-First Synthetic Data Engineering Pipeline (GF-SDEP)** that separates the **Hidden Ground-Truth Graph ($G_{gt}$)** from the **Observed Source Records Layer ($R_{obs}$)**.

```
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

---

## Key Design Principles

1. **Graph-First Integrity**: Records are derived from a unified, time-consistent hidden ground truth graph ($G_{gt}$) rather than randomly generated tables.
2. **Realistic Fragmentation**: Source records reflect actual Indian law enforcement datasets (CCTNS, Telecom CDR/CAF, CBS Banking, Toll ANPR, Cell Tower Dumps, OSINT, Intelligence Field Reports).
3. **Anti-Leakage Guarantees**: Raw source records never contain analytical labels like "kingpin" or "suspicious link". All intelligence must be inferred through multi-hop evidence correlation.
4. **Strict Physical & Temporal Consistency**: Teleportation prevention, causal ordering, and transaction balance logic are programmatically enforced.
5. **Multi-Scale Deployability**: Scalable configurations for MVP (50 entities), Demo (350 entities), and Final Evaluation (2,500 entities).
