"""
SIH26189 Schema Validator
Validates JSON observed files against Draft-07 JSON schemas.
"""

import json
import jsonschema
from typing import Dict, Any, List, Tuple


class SchemaValidator:
    def __init__(self, schemas_dir: str):
        self.schemas_dir = schemas_dir

    def validate_json_records(self, records: List[Dict[str, Any]], schema_filename: str) -> Tuple[bool, List[str]]:
        errors = []
        try:
            with open(f"{self.schemas_dir}/{schema_filename}", "r") as f:
                schema = json.load(f)
        except Exception as e:
            return False, [f"Failed to load schema file {schema_filename}: {str(e)}"]

        for idx, rec in enumerate(records):
            try:
                jsonschema.validate(instance=rec, schema=schema)
            except jsonschema.ValidationError as ve:
                errors.append(f"Record [{idx}] failed schema validation: {ve.message}")

        return len(errors) == 0, errors
