from typing import Dict, Any, List
from app.services.corpus_service import corpus_service

def build_network(scenario_id: str) -> Dict[str, Any]:
    records = corpus_service.get_records(scenario_id=scenario_id, limit=1000)
    
    nodes = {}
    edges = []
    
    # Heuristics for node types based on pattern
    def determine_node_type(entity: str) -> str:
        entity = str(entity)
        if entity.startswith("+91-"):
            return "phone"
        if entity.startswith("FIR-"):
            return "case"
        if entity.startswith("TOWER-"):
            return "location"
        if entity.startswith("@"):
            return "social_account"
        if entity.isdigit():
            return "account"
        return "person"

    def add_node(entity: str):
        entity = str(entity)
        if entity not in nodes:
            nodes[entity] = {
                "id": entity,
                "label": entity,
                "type": determine_node_type(entity),
                "occurrences": 1
            }
        else:
            nodes[entity]["occurrences"] += 1

    # Extract nodes and edges based on observed data
    for record in records:
        entity_refs = record.get("entity_refs", [])
        source_type = record.get("source_type", "unknown")
        doc_id = record.get("document_id", "unknown")
        
        # Add all entities as nodes
        for ent in entity_refs:
            add_node(ent)
            
        # Add locations as nodes if applicable
        for loc in record.get("location_refs", []):
            add_node(loc)
            
        # Form deterministic edges
        if source_type == "telecom_cdr_logs":
            # CDRs: Caller to Receiver
            if len(entity_refs) == 2:
                edges.append({
                    "id": f"{doc_id}-edge",
                    "source": entity_refs[0],
                    "target": entity_refs[1],
                    "type": "CALL",
                    "provenance": doc_id
                })
            # Phone to Tower
            if len(entity_refs) > 0 and len(record.get("location_refs", [])) > 0:
                edges.append({
                    "id": f"{doc_id}-loc-edge",
                    "source": entity_refs[0],
                    "target": record["location_refs"][0],
                    "type": "LOCATION_PING",
                    "provenance": doc_id
                })
                
        elif source_type == "telecom_caf_kyc":
            # KYC: Person to Phone
            if len(entity_refs) == 2:
                edges.append({
                    "id": f"{doc_id}-edge",
                    "source": entity_refs[0],  # Person
                    "target": entity_refs[1],  # Phone
                    "type": "REGISTERED_TO",
                    "provenance": doc_id
                })
                
        elif source_type == "cbs_bank_transactions":
            # Bank: Account to Account
            if len(entity_refs) == 2:
                edges.append({
                    "id": f"{doc_id}-edge",
                    "source": entity_refs[0],
                    "target": entity_refs[1],
                    "type": "TRANSACTION",
                    "provenance": doc_id
                })
                
        elif source_type == "fiu_str_alerts":
            # FIU: Account to Alert (we map account to transaction if available)
            if len(entity_refs) == 2:
                 edges.append({
                    "id": f"{doc_id}-edge",
                    "source": entity_refs[0],
                    "target": entity_refs[1],
                    "type": "SUSPICIOUS_LINK",
                    "provenance": doc_id
                })
                 
        elif source_type == "osint_social_posts":
             # Social account to Location
             if len(entity_refs) > 0 and len(record.get("location_refs", [])) > 0:
                edges.append({
                    "id": f"{doc_id}-edge",
                    "source": entity_refs[0],
                    "target": record["location_refs"][0],
                    "type": "POSTED_FROM",
                    "provenance": doc_id
                })

        else:
            # Generic co-occurrence for FIRs, Criminal History etc.
            # Only if exactly two primary entities to avoid hairballs
            if len(entity_refs) == 2:
                edges.append({
                    "id": f"{doc_id}-edge",
                    "source": entity_refs[0],
                    "target": entity_refs[1],
                    "type": "CO_OCCURRENCE",
                    "provenance": doc_id
                })

    return {
        "scenario_id": scenario_id,
        "nodes": list(nodes.values()),
        "edges": edges
    }
