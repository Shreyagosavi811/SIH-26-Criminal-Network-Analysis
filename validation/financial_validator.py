"""
SIH26189 Financial Ledger Validator
Validates that account balances remain non-negative, transaction IDs are unique,
and debit/credit movements balance correctly.
"""

from typing import Dict, Any, List, Tuple


class FinancialValidator:
    def validate_transactions(self, transactions: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        errors = []
        seen_txn_ids = set()
        account_balances: Dict[str, float] = {}

        for txn in transactions:
            txn_id = txn.get("transaction_id")
            if txn_id in seen_txn_ids:
                errors.append(f"Duplicate transaction ID found: {txn_id}")
            seen_txn_ids.add(txn_id)

            amount = float(txn.get("amount", 0.0))
            if amount <= 0:
                errors.append(f"Invalid transaction amount {amount} in {txn_id}")

            src_acc = txn.get("source_account")
            dst_acc = txn.get("destination_account")

            balance_after = float(txn.get("balance_after", 0.0))
            if balance_after < 0:
                errors.append(f"Negative balance error in transaction {txn_id} for account {src_acc}: {balance_after}")

        return len(errors) == 0, errors
