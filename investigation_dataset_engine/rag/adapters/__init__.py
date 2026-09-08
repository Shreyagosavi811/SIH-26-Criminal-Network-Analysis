from .base import SourceAdapter
from .cctns import CctnsAdapter
from .criminal_history import CriminalHistoryAdapter
from .telecom_cdr import TelecomCdrAdapter
from .telecom_caf import TelecomCafAdapter
from .bank_transactions import BankTransactionsAdapter
from .fiu_alerts import FiuAlertsAdapter
from .toll_anpr import TollAnprAdapter
from .cell_tower import CellTowerAdapter
from .osint import OsintAdapter
from .field_notes import FieldNotesAdapter

ALL_ADAPTERS = [
    CctnsAdapter(),
    CriminalHistoryAdapter(),
    TelecomCdrAdapter(),
    TelecomCafAdapter(),
    BankTransactionsAdapter(),
    FiuAlertsAdapter(),
    TollAnprAdapter(),
    CellTowerAdapter(),
    OsintAdapter(),
    FieldNotesAdapter()
]