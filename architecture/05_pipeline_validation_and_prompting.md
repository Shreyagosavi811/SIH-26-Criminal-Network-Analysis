# 05. Pipeline, Validation Rules & Multi-Stage Prompt Architecture

## Part A: Data Generation Pipeline (6-Stage Modular Execution)

```text
+-----------------------------------------------------------------------------------+
| STAGE 1: Topology Synthesizer                                                      |
| Generator creates Graphviz/NetworkX directed graph DAGs for target scenario types.|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| STAGE 2: Temporal & Attribute Binder                                              |
| Attaches real-world timeline dates, Indian demography names, IFSC, IMEI, cell LACs|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| STAGE 3: Noise & Distractor Injector                                              |
| Generates background commuter cell logs, common name collisions, and bank noise.  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| STAGE 4: Faceted Source Serializer                                                |
| Projects node/edge graph into 10 fragmented, realistic database files.            |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| STAGE 5: Consistency & Anti-Leakage Auditor                                       |
| Validates speed limits, temporal causality, account balances, zero-label leakage. |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| STAGE 6: Benchmark Q&A Exporter                                                   |
| Exports test queries, ground-truth graphs, and evaluation metric scoring sheets.  |
+-----------------------------------------------------------------------------------+
```

---

## Part B: Programmatic Consistency Validation Rules

To ensure 100% logical and physical realism, every generated record batch must pass **5 Validation Rules**:

1. **Spatial Teleportation Prevention Rule**:
   $$\frac{\text{Distance}(L_1, L_2)}{\Delta t} \le V_{\text{max}}$$
   - If Vehicle $V$ passes Toll Plaza $A$ at 10:00 AM and Toll Plaza $B$ (200 km away) at 10:30 AM, speed = 400 km/h $> V_{\text{max}}$ (120 km/h). The generator flags and rejects the record.

2. **Temporal Causality Rule**:
   - $t_{\text{call}} \ge t_{\text{SIM\_activation}}$
   - $t_{\text{transaction}} \ge t_{\text{account\_opening}}$
   - $t_{\text{charge\_sheet}} \ge t_{\text{FIR\_registration}}$

3. **Financial Account Balance Rule**:
   $$\text{Balance}_{t} = \text{Balance}_{t-1} + \text{Credit}_t - \text{Debit}_t \ge 0$$
   - Overdrafts or negative balances are strictly forbidden unless marked as pre-approved credit lines.

4. **Physical Co-location Rule**:
   - A single physical person (`ENT_PER_xxx`) CANNOT be logged in two different cell tower dumps at the exact same timestamp, unless the scenario explicitly involves identity theft or cloned SIM cards (which must be documented in ground truth).

5. **Evidence Reachability Guarantee**:
   - For every query pair $(Q, A)$, there MUST exist at least one valid, unbroken path of source evidence records connecting the start entity to the target entity:
     $$\text{Reachability}(E_{\text{start}}, E_{\text{target}} \mid R_{\text{obs}}) = \text{True}$$

---

## Part C: Recommended Dataset Scaling Sizes

```text
+-----------------------+-------------------+--------------------+--------------------+
| Parameter             | MVP Scale (Dev)   | Demo Scale (Judges)| Final Evaluation   |
+-----------------------+-------------------+--------------------+--------------------+
| Target Use Case       | Unit testing,     | Live interactive   | Comprehensive AI   |
|                       | pipeline dev      | judge demo         | benchmark scoring  |
|                       |                   |                    |                    |
| Total Scenarios       | 5 Scenarios       | 25 Scenarios       | 100 Scenarios      |
|                       |                   |                    |                    |
| Ground Truth Entities | ~50 Entities      | ~350 Entities      | ~2,500 Entities    |
|                       |                   |                    |                    |
| Ground Truth Edges    | ~120 Edges        | ~900 Edges         | ~8,000 Edges       |
|                       |                   |                    |                    |
| Noise Records         | ~2,000 Records    | ~25,000 Records    | ~500,000 Records   |
|                       |                   |                    |                    |
| Total File Size       | ~10 MB            | ~150 MB            | ~2.5 GB            |
|                       |                   |                    |                    |
| Benchmark Queries     | 10 Test Queries   | 50 Test Queries    | 300 Test Queries   |
+-----------------------+-------------------+--------------------+--------------------+
```

---

## Part D: Controlled Multi-Stage Prompt Architecture

When using LLMs or synthetic text generators to populate narrative sources (e.g. CCTNS FIR narratives, field intelligence notes), we use a **4-Stage Prompting Workflow**:

```text
+-----------------------------------------------------------------------------------+
| PROMPT STAGE 1: Topology & Ground-Truth Graph Generation                          |
| System Role: AI Data Architect                                                     |
| Input: Scenario Type (e.g., Financial Layering), Hop Depth=4, Node Count=15.      |
| Output: Clean JSON Ground-Truth Graph G_gt (Nodes, Edges, Roles, Timeline).       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PROMPT STAGE 2: Demographic & Realism Binding                                     |
| System Role: Indian Law Enforcement Demography Specialist                          |
| Input: G_gt JSON from Stage 1.                                                    |
| Output: Real Indian names, P.S. locations, IPC sections, MSISDN, IFSC, Toll IDs. |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PROMPT STAGE 3: Faceted Record & Narrative Serializer                             |
| System Role: Multi-Source Law Enforcement Database Serializer                     |
| Input: Populated Entity Graph + Source Schema Specification.                      |
| Task: Generate CCTNS complaint narratives using formal police Hindi-English       |
|       phraseology ("The complainant stated that...", "Upon inspection...").        |
| Constraint: NO analytical badges or explicit relationship labels.                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| PROMPT STAGE 4: Automated Verification & Error Repair                             |
| System Role: Logical Audit Agent                                                  |
| Input: Generated Records + Ground-Truth Schema + Validation Rule Audit Log.       |
| Task: Fix temporal discrepancies, correct invalid IPC section numbers, and adjust |
|       typos to maintain exact target Signal-to-Noise Ratio.                       |
+-----------------------------------------------------------------------------------+
```
