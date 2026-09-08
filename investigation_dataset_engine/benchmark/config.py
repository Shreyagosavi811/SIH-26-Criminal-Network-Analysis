"""
SIH26189 Benchmark Configuration
"""
import os

# Output root — benchmark reads from here
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "output"
)
GT_DIR          = os.path.join(OUTPUT_DIR, "GROUND_TRUTH")
OBSERVED_DIR    = os.path.join(OUTPUT_DIR, "OBSERVED")
REPORTS_DIR     = os.path.join(OUTPUT_DIR, "REPORTS")
QUERIES_DIR     = os.path.join(OUTPUT_DIR, "QUERIES")
ANSWERS_DIR     = os.path.join(OUTPUT_DIR, "ANSWERS")
BENCHMARK_DIR   = os.path.join(OUTPUT_DIR, "ML_BENCHMARK")

ALL_SCENARIOS = list(range(1, 101))

# Noise record ID prefixes injected by the noise engine
NOISE_ID_PREFIXES = [
    "CAF-NOISE-",
    "CDR-RECYCLE-",
    "CBS-BENIGN-",
    "CDR-DIST-",
    "FNOTE-DIST-",
]

# Hidden roles — MUST NOT appear in model inputs
HIDDEN_ROLE_LABELS = {
    "MASTERMIND", "MULE", "SPOTTER", "ASSOCIATE",
    "TRUE_LABEL", "GROUND_TRUTH", "CORRECT_ANSWER",
    "TARGET_SUSPECT", "valid_path", "ground_truth",
}

# Split ratios
SPLIT_RATIOS = {
    "train":      0.60,
    "validation": 0.20,
    "test":       0.15,
    "challenge":  0.05,
}

# Source file names
SOURCE_FILES = {
    "CCTNS_FIR":         "cctns_fir_records.json",
    "CRIMINAL_HIST":     "criminal_history_db.json",
    "TELECOM_CDR":       "telecom_cdr_logs.csv",
    "TELECOM_CAF":       "telecom_caf_kyc.json",
    "CBS_BANK":          "cbs_bank_transactions.csv",
    "FIU_STR":           "fiu_str_alerts.json",
    "TOLL_ANPR":         "toll_anpr_logs.csv",
    "CELL_TOWER":        "cell_tower_dumps.json",
    "OSINT_SOCIAL":      "osint_social_posts.json",
    "FIELD_INTEL":       "field_intelligence_notes.txt",
}

BENCHMARK_VERSION = "1.0"
GENERATOR_VERSION = "1.1.1"
