# 01. Overall System Architecture

## 1. System Context & SIH26189 Rationale

The **SIH26189** problem statement requires an AI-powered criminal investigation and intelligence analysis system capable of taking an initial lead (e.g., an FIR number, suspect name, phone number, vehicle plate, or bank account) and autonomously discovering multi-hop entity relationships, reconstructing timelines, identifying crime patterns, and delivering actionable intelligence reports.

Standard machine learning datasets (like CSV tables of isolated transactions or clean graph benchmarks) fail to reflect real law enforcement data environments. In real-world police intelligence:
1. **Data is fragmented across siloes**: CCTNS police records, telecom CDR/CAF logs, banking transactions, traffic ANPR cameras, and intelligence field notes use radically different formats, identifier types, and updating frequencies.
2. **Key connections are hidden**: Suspects rarely communicate directly; they use burner phones, financial mules, shell companies, shared getaway vehicles, and third-party meetings.
3. **Data is noisy**: High-volume legitimate transactions, cell tower congestion, common Indian name collisions, and data entry typos obscure critical leads.

To train and evaluate an AI model for SIH26189 without using real confidential citizen data, we design the **Graph-First Synthetic Data Engineering Pipeline (GF-SDEP)**.

---

## 2. Decoupled Architecture: Hidden Graph vs. Observed Layer

The fundamental design decision of GF-SDEP is the complete decoupling of the **Hidden Ground-Truth Graph ($G_{gt}$)** from the **Observed Source Record Layer ($R_{obs}$)**.

```text
                  +-----------------------------------+
                  |   HIDDEN GROUND-TRUTH GRAPH       |
                  |          G_gt = (V, E, W, T)      |
                  |  Canonical Entities & True Links  |
                  +-----------------------------------+
                                    |
                                    | Projection & Fragmentation
                                    | + Controlled Noise Injection
                                    v
+-------------------------------------------------------------------------+
|                    OBSERVED SOURCE RECORD LAYER                         |
|                             R_obs                                       |
|                                                                         |
|  [CCTNS FIRs]   [CDR Logs]   [Bank Ledger]   [ANPR Tolls]   [OSINT]     |
|  (Incomplete)   (No Names)   (No Phones)     (Plates only)  (Unverified)|
+-------------------------------------------------------------------------+
                                    |
                                    | Investigation Input Query
                                    v
+-------------------------------------------------------------------------+
|                  AI INVESTIGATION ENGINE (SIH26189)                     |
|         Extracts, Correlates, Reconstructs & Scores Confidence          |
+-------------------------------------------------------------------------+
                                    |
                                    | Evaluated Against
                                    v
                  +-----------------------------------+
                  |      GROUND-TRUTH BENCHMARK       |
                  |    True Chain of Evidence & QA    |
                  +-----------------------------------+
```

### Mathematical Formulation

- **Hidden Ground-Truth Graph**:
  $$G_{gt} = (V, E, W, T)$$
  Where $V$ is the set of canonical synthetic entities, $E$ is the set of true relationships, $W: E \to [0, 1]$ represents true relationship weight/confidence, and $T: E \to [t_{\text{start}}, t_{\text{end}}]$ defines temporal validity.

- **Observed Record Set**:
  $$R_{obs} = \left( \bigcup_{s \in S} \pi_s(G_{gt}) \right) \cup R_{noise}$$
  Where $S$ is the set of 10 investigative source databases, $\pi_s$ is a domain-specific projection operator that drops canonical IDs, strips attributes, introduces schema noise, and converts edges into source-specific records (e.g., converting a `COMMUNICATES_WITH` edge into a raw CDR record with MSISDNs, timestamp, duration, and cell tower ID, but NO names). $R_{noise}$ represents injected distractor records.

---

## 3. Subsystem Breakdown

### Subsystem 1: Scenario & Graph Topology Engine
- Generates directed multi-hop network topographies (trees, star-hub, ring, DAGs) representing criminal conspiracies, money-laundering rings, and stolen vehicle networks.
- Enforces structural roles: Kingpin, Facilitator, Mule, Conduit, Spotter, Innocent Bystander.

### Subsystem 2: Temporal & Attribute Binding Engine
- Maps graph nodes and edges to realistic temporal event lines ($t_0 \to t_n$) obeying natural timeline constraints.
- Assigns realistic synthetic demographics (Indian names, Aadhaar hashes, IMEI, MSISDN, IFSC, IPC sections, Toll Plaza IDs).

### Subsystem 3: Noise & Distractor Injection Engine
- Generates realistic background noise ($R_{noise}$): spatial overlap at cell towers, common name collisions, data entry typos, stale recycled phone numbers, and benign high-volume bank transfers.
- Ensures the signal-to-noise ratio (SNR) mirrors real investigative environments.

### Subsystem 4: Faceted Source Record Serializer
- Takes the populated ground-truth graph and noise nodes and serializes them into 10 distinct, realistic database files in formats such as JSON, CSV, TSV, and unstructured raw text reports.
- Strips direct entity resolution keys so the AI must perform entity resolution across sources.

### Subsystem 5: Consistency & Anti-Leakage Auditor
- Programmatically runs physics and logic checks (e.g., speed of movement between locations, chronological transaction ordering, account balance limits).
- Checks all output files to ensure no forbidden analytical labels ("criminal", "suspect", "mastermind") appear in raw source records.

### Subsystem 6: Investigation Query & Benchmark Exporter
- Automatically derives test queries and ground-truth answer keys directly from $G_{gt}$.
- Exports dataset bundles ready for training, offline evaluation, and live demonstration.
