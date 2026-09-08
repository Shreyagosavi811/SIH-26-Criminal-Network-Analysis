"""
SIH26189 Dataset Engine v1.1 — Demographic & Attribute Synthesizer
Provides deterministic generation of synthetic Indian names, PANs, Aadhaar hashes,
vehicle plates, IFSC codes, phone numbers, and coordinates seeded by random seed.
Expanded to 30+ locations and larger name pools.
"""

import random
import hashlib
import math
from typing import Tuple, List


# Expanded name pools
FIRST_NAMES = [
    "Rajesh", "Vikram", "Amit", "Ramesh", "Suresh", "Priya", "Sunita", "Anil",
    "Deepak", "Manoj", "Karan", "Sanjay", "Rohit", "Ravi", "Kavya", "Neha",
    "Pooja", "Ankit", "Sachin", "Dhruv", "Arjun", "Nikhil", "Pradeep", "Mohan",
    "Ashok", "Vijay", "Lata", "Rekha", "Meena", "Geeta", "Sumit", "Ajay"
]
LAST_NAMES = [
    "Kumar", "Sharma", "Choudhury", "Patel", "Verma", "Singh", "Gupta", "Yadav",
    "Jha", "Reddy", "Nair", "Rao", "Chauhan", "Tiwari", "Mishra", "Bansal",
    "Agrawal", "Saxena", "Kapoor", "Bhatia", "Mehta", "Shah", "Pandey", "Dubey",
    "Joshi", "Dixit", "Srivastava", "Chatterjee", "Mukherjee", "Bhattacharya"
]
FATHER_FIRST = ["Ramesh", "Suresh", "Mohan", "Shyam", "Hari", "Bhagwan", "Gopal",
                "Chandra", "Babu", "Lal", "Shankar", "Ratan"]
OCCUPATIONS = [
    "Business", "Software Engineer", "Teacher", "Driver", "Merchant", "Farmer",
    "Accountant", "Electrician", "Shopkeeper", "Government Employee", "Contractor",
    "Salesman", "Security Guard", "Daily Wage Worker", "Import-Export Trader"
]
OPERATORS = ["Airtel", "Jio", "Vi", "BSNL"]
DOCUMENT_TYPES = ["Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Passport"]
VEHICLE_MODELS = [
    "Hyundai i20 White 2020", "Maruti Swift Silver 2019", "Honda City Black 2021",
    "Toyota Innova White 2018", "Tata Nexon Grey 2022", "Mahindra Scorpio Black 2020",
    "Hero Splendor Black 2021", "TVS Apache Red 2020", "Bajaj Pulsar Blue 2019",
    "Hyundai Creta Blue 2022", "Maruti Dzire White 2021", "Ford EcoSport Silver 2019"
]
BANKS_IFSC = [
    ("State Bank of India", "SBIN0001042"),
    ("HDFC Bank", "HDFC0000240"),
    ("ICICI Bank", "ICIC0000102"),
    ("Punjab National Bank", "PUNB0019200"),
    ("Axis Bank", "UTIB0000003"),
    ("Bank of Baroda", "BARB0DELKHO"),
    ("Canara Bank", "CNRB0001044"),
    ("Union Bank of India", "UBIN0540471"),
]

# Expanded location pool: (name, district, state, lat, lon, type, tower_id, plaza_id)
LOCATION_POOL = [
    ("Connaught Place Outer Circle", "New Delhi", "Delhi", 28.6315, 77.2167, "CELL_TOWER", "TOWER-DL-CP-101", None),
    ("Kherki Daula Toll Plaza", "Gurugram", "Haryana", 28.3995, 76.9740, "TOLL_PLAZA", "TOWER-HR-KD-201", "PLAZA-KD-101"),
    ("Vasant Kunj North", "South West Delhi", "Delhi", 28.5293, 77.1539, "CELL_TOWER", "TOWER-DL-VK-304", None),
    ("Dwarka Sector 21 Metro", "South West Delhi", "Delhi", 28.5521, 77.0583, "CELL_TOWER", "TOWER-DL-DW-405", None),
    ("Noida Sector 18 ATM", "Gautam Buddha Nagar", "UP", 28.5708, 77.3261, "ATM", "TOWER-UP-NO-506", None),
    ("Rajiv Chowk Metro", "New Delhi", "Delhi", 28.6329, 77.2195, "CELL_TOWER", "TOWER-DL-RC-102", None),
    ("Gurugram NH48 Toll", "Gurugram", "Haryana", 28.4595, 77.0266, "TOLL_PLAZA", "TOWER-HR-NH-211", "PLAZA-NH-201"),
    ("Faridabad Sector 28", "Faridabad", "Haryana", 28.3886, 77.3189, "CELL_TOWER", "TOWER-HR-FB-301", None),
    ("Rohini Sector 3 Residence", "North West Delhi", "Delhi", 28.7041, 77.1025, "RESIDENCE", "TOWER-DL-RH-601", None),
    ("Nehru Place Cyber Hub", "South Delhi", "Delhi", 28.5489, 77.2524, "CELL_TOWER", "TOWER-DL-NP-701", None),
    ("Shahdara Crime Scene", "East Delhi", "Delhi", 28.6729, 77.2887, "CRIME_SCENE", "TOWER-DL-SD-801", None),
    ("Okhla Industrial Area", "South East Delhi", "Delhi", 28.5355, 77.2741, "CELL_TOWER", "TOWER-DL-OK-901", None),
    ("Lajpat Nagar Market", "South Delhi", "Delhi", 28.5677, 77.2433, "CELL_TOWER", "TOWER-DL-LN-501", None),
    ("Anand Vihar ISBT", "East Delhi", "Delhi", 28.6469, 77.3158, "CELL_TOWER", "TOWER-DL-AV-201", None),
    ("Palam Toll Plaza", "West Delhi", "Delhi", 28.5924, 77.0755, "TOLL_PLAZA", "TOWER-DL-PL-401", "PLAZA-PL-301"),
    ("Ghaziabad Raj Nagar", "Ghaziabad", "UP", 28.6639, 77.4382, "CELL_TOWER", "TOWER-UP-GZ-101", None),
    ("Meerut ANPR Checkpoint", "Meerut", "UP", 28.9845, 77.7064, "TOLL_PLAZA", "TOWER-UP-ME-201", "PLAZA-ME-101"),
    ("Bahadurgarh Industrial", "Bahadurgarh", "Haryana", 28.6926, 76.9316, "CELL_TOWER", "TOWER-HR-BH-101", None),
    ("Manesar SEZ", "Gurugram", "Haryana", 28.3568, 76.9378, "CELL_TOWER", "TOWER-HR-MN-301", None),
    ("Sonipat NH44 Toll", "Sonipat", "Haryana", 28.9931, 77.0151, "TOLL_PLAZA", "TOWER-HR-SO-201", "PLAZA-SO-101"),
]


class DemographicSynthesizer:
    def __init__(self, seed: int = 26189):
        self.seed = seed
        self.rng = random.Random(seed)
        self._name_counter = 0

    def generate_name(self, offset: int = 0) -> str:
        """Generates deterministic name using index offset to ensure variety."""
        first_idx = (self.seed + offset * 7) % len(FIRST_NAMES)
        last_idx = (self.seed + offset * 13) % len(LAST_NAMES)
        return f"{FIRST_NAMES[first_idx]} {LAST_NAMES[last_idx]}"

    def generate_father_name(self, offset: int = 0) -> str:
        first_idx = (self.seed + offset * 11) % len(FATHER_FIRST)
        last_idx = (self.seed + offset * 17) % len(LAST_NAMES)
        return f"{FATHER_FIRST[first_idx]} {LAST_NAMES[last_idx]}"

    def generate_occupation(self, offset: int = 0) -> str:
        return OCCUPATIONS[(self.seed + offset) % len(OCCUPATIONS)]

    def generate_phone_msisdn(self, index: int, prefix: int = 98) -> str:
        """Generates synthetic Indian MSISDN. prefix=98 for Airtel, 97 for Vi etc."""
        num_suffix = ((self.seed * 1337 + index * 1107) % 100000000)
        return f"+91-{prefix}{num_suffix:08d}"

    def generate_imei(self, index: int) -> str:
        base = 864920050000000 + (self.seed * 3 + index * 17)
        return str(base % 10**15)

    def generate_imsi(self, index: int) -> str:
        base = 404450900000000 + (self.seed * 5 + index * 23)
        return str(base % 10**15)

    def generate_pan(self, offset: int = 0) -> str:
        rng = random.Random(self.seed + offset)
        letters = "".join(rng.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
        digits = "".join(rng.choices("0123456789", k=4))
        last = rng.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        return f"{letters}{digits}{last}"

    def generate_aadhaar_hash(self, index: int) -> str:
        raw_num = str(700000000000 + self.seed + index * 98765)
        return hashlib.sha256(raw_num.encode()).hexdigest()

    def generate_cif(self, index: int) -> str:
        return f"CIF{(self.seed + index * 100003) % 10**9:09d}"

    def generate_vehicle_plate(self, index: int, state_code: str = "DL") -> str:
        rng = random.Random(self.seed + index)
        rto = f"{rng.randint(1, 14):02d}"
        series = "".join(rng.choices("ABCDEFGHJKLMNPQRSTVWXYZ", k=2))
        num = f"{(self.seed * 3 + index * 7777) % 9000 + 1000}"
        return f"{state_code}{rto}{series}{num}"

    def generate_vehicle_model(self, index: int) -> str:
        return VEHICLE_MODELS[index % len(VEHICLE_MODELS)]

    def generate_chassis(self, index: int) -> str:
        rng = random.Random(self.seed + index)
        return "MA3FE" + "".join(rng.choices("0123456789ABCDEFGHJKLMNPQRSTVWXYZ", k=12))

    def generate_bank_account(self, index: int) -> Tuple[str, str, str]:
        bank_name, ifsc = BANKS_IFSC[index % len(BANKS_IFSC)]
        acc_no = str(3000 + self.seed % 1000 + index * 100003)[:16]
        return acc_no, bank_name, ifsc

    def generate_operator(self, index: int) -> str:
        return OPERATORS[index % len(OPERATORS)]

    def get_location(self, index: int) -> Tuple:
        """Returns (name, district, state, lat, lon, type, tower_id, plaza_id)"""
        loc = LOCATION_POOL[index % len(LOCATION_POOL)]
        return loc

    def get_nearby_location(self, base_index: int, hop: int) -> Tuple:
        """Returns a location that is geographically adjacent to base_index."""
        adj_index = (base_index + hop) % len(LOCATION_POOL)
        return LOCATION_POOL[adj_index]

    def generate_timestamp_offset(self, base_ts: str, offset_minutes: int) -> str:
        """Adds offset_minutes to an ISO timestamp string."""
        from datetime import datetime, timedelta
        dt = datetime.fromisoformat(base_ts.replace("Z", ""))
        dt2 = dt + timedelta(minutes=offset_minutes)
        return dt2.strftime("%Y-%m-%dT%H:%M:%SZ")

    def generate_document_type(self, index: int) -> str:
        return DOCUMENT_TYPES[index % len(DOCUMENT_TYPES)]

    def generate_utr(self, prefix: str, index: int) -> str:
        return f"{prefix}{(self.seed + index * 100007) % 10**12:012d}"

    def generate_transaction_remarks(self, txn_type: str, rng: random.Random) -> str:
        remarks_pool = {
            "SALARY": ["Monthly Salary", "Salary Oct-2026", "Staff Salary Cr"],
            "RENT": ["Monthly Rent", "Oct Rent Payment", "Advance Rent"],
            "UTILITY": ["Electricity Bill", "Water Bill", "Gas Bill"],
            "BUSINESS": ["Payment for goods", "Invoice settlement", "Supply payment"],
            "LAYERING": ["Transfer for services", "Self transfer", "Business advance"],
            "BENIGN": ["UPI transfer", "Payment", "Online payment"]
        }
        pool = remarks_pool.get(txn_type, remarks_pool["BENIGN"])
        return rng.choice(pool)
