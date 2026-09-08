"""
Unit tests for spatial, financial, and zero label-leakage validators.
"""

from validation.spatial_validator import SpatialValidator
from validation.financial_validator import FinancialValidator
from validation.leakage_validator import LabelLeakageValidator


def test_spatial_validator_speed_pass():
    validator = SpatialValidator(max_speed_kmh=120.0)
    spot1 = (28.6315, 77.2167, "2026-08-10T10:00:00Z")
    spot2 = (28.3995, 76.9740, "2026-08-10T12:30:00Z")  # ~35 km in 2.5 hours -> ~14 km/h
    ok, msg = validator.validate_travel_speed(spot1, spot2)
    assert ok is True


def test_spatial_validator_speed_fail():
    validator = SpatialValidator(max_speed_kmh=120.0)
    spot1 = (28.6315, 77.2167, "2026-08-10T10:00:00Z")
    spot2 = (28.3995, 76.9740, "2026-08-10T10:05:00Z")  # ~35 km in 5 minutes -> ~420 km/h
    ok, msg = validator.validate_travel_speed(spot1, spot2)
    assert ok is False
    assert "Speed limit violation" in msg


def test_financial_validator_pass():
    validator = FinancialValidator()
    txns = [
        {"transaction_id": "T1", "amount": 100, "source_account": "A1", "destination_account": "A2", "balance_after": 500}
    ]
    ok, errs = validator.validate_transactions(txns)
    assert ok is True


def test_label_leakage_validator():
    validator = LabelLeakageValidator()
    
    # Benign record text
    clean_text = "The driver Ramesh Kumar operated taxi DL01AB1234 on Connaught Place route."
    ok, errs = validator.audit_text_content(clean_text, "test.txt")
    assert ok is True

    # Leaked analytical label text
    leaked_text = "Subject Vikram Choudhury is identified as MASTERMIND of cyber fraud syndicate."
    ok, errs = validator.audit_text_content(leaked_text, "test.txt")
    assert ok is False
    assert "STRICT LEAKAGE AUDIT FAILURE" in errs[0]
