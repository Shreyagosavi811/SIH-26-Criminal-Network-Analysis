import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models

# A strict namespace for deterministic UUID5 generation for this project
NAMESPACE_SIH26189 = uuid.uuid5(uuid.NAMESPACE_DNS, "sih26189.investigation.dataset")

def generate_point_uuid(document_id: str) -> str:
    """
    Generates a deterministic UUID5 from the document_id.
    """
    return str(uuid.uuid5(NAMESPACE_SIH26189, document_id))

class QdrantEvidenceClient:
    def __init__(self, path: str = "output/qdrant_storage", collection_name: str = "sih26189_evidence"):
        self.client = QdrantClient(path=path)
        self.collection_name = collection_name
        
    def ensure_collection(self, vector_size: int, distance=models.Distance.COSINE):
        """
        Creates the collection if it doesn't exist, using the provided vector_size.
        """
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        
        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=distance
                )
            )
            # Create payload indexes for forensic filtering
            self.client.create_payload_index(self.collection_name, "source_type", field_schema=models.PayloadSchemaType.KEYWORD)
            self.client.create_payload_index(self.collection_name, "scenario_family", field_schema=models.PayloadSchemaType.KEYWORD)
            self.client.create_payload_index(self.collection_name, "scenario_instance_id", field_schema=models.PayloadSchemaType.KEYWORD)
            self.client.create_payload_index(self.collection_name, "case_refs", field_schema=models.PayloadSchemaType.KEYWORD)
            self.client.create_payload_index(self.collection_name, "entity_refs", field_schema=models.PayloadSchemaType.KEYWORD)
            
    def prepare_payload(self, doc_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepares a lean payload by dropping fields that shouldn't be inside Qdrant.
        """
        payload = {
            "document_id": doc_dict.get("document_id"),
            "scenario_instance_id": doc_dict.get("scenario_instance_id"),
            "scenario_family": doc_dict.get("scenario_family"),
            "source_type": doc_dict.get("source_type"),
            "source_record_id": doc_dict.get("source_record_id"),
            "timestamp": doc_dict.get("timestamp"),
            "entity_refs": doc_dict.get("entity_refs", []),
            "location_refs": doc_dict.get("location_refs", []),
            "case_refs": doc_dict.get("case_refs", []),
            "provenance": doc_dict.get("provenance", {})
        }
        # Explicitly ensure no raw text/content is stored unnecessarily
        return payload

    def upsert_batch(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Upserts a batch of documents into Qdrant.
        """
        points = []
        for doc, emb in zip(documents, embeddings):
            point_id = generate_point_uuid(doc["document_id"])
            payload = self.prepare_payload(doc)
            
            points.append(models.PointStruct(
                id=point_id,
                vector=emb,
                payload=payload
            ))
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        
    def _build_query_filter(
        self,
        filters: Optional[Dict[str, str]] = None,
        investigation_context: Optional[Any] = None,
        exact_identifiers: Optional[List[str]] = None
    ) -> Optional[models.Filter]:
        must_conditions = []
        should_conditions = []
        
        if filters:
            for k, v in filters.items():
                must_conditions.append(models.FieldCondition(
                    key=k, match=models.MatchValue(value=v)
                ))
                
        if investigation_context:
            if investigation_context.source_type_filters:
                source_conds = []
                for src in investigation_context.source_type_filters:
                    source_conds.append(models.FieldCondition(
                        key="source_type", match=models.MatchValue(value=src)
                    ))
                must_conditions.append(models.Filter(should=source_conds))
                
            if investigation_context.case_ids:
                case_conds = []
                for case_id in investigation_context.case_ids:
                    case_conds.append(models.FieldCondition(
                        key="case_refs", match=models.MatchValue(value=case_id)
                    ))
                must_conditions.append(models.Filter(should=case_conds))

            if investigation_context.location_ids:
                loc_conds = []
                for loc_id in investigation_context.location_ids:
                    loc_conds.append(models.FieldCondition(
                        key="location_refs", match=models.MatchValue(value=loc_id)
                    ))
                must_conditions.append(models.Filter(should=loc_conds))

            if investigation_context.time_start or investigation_context.time_end:
                dt_kwargs = {}
                if investigation_context.time_start:
                    dt_kwargs["gte"] = investigation_context.time_start.isoformat()
                if investigation_context.time_end:
                    dt_kwargs["lte"] = investigation_context.time_end.isoformat()
                
                must_conditions.append(models.FieldCondition(
                    key="timestamp", range=models.DatetimeRange(**dt_kwargs)
                ))

        if exact_identifiers:
            for identifier in exact_identifiers:
                should_conditions.append(models.FieldCondition(
                    key="entity_refs", match=models.MatchValue(value=identifier)
                ))
                should_conditions.append(models.FieldCondition(
                    key="case_refs", match=models.MatchValue(value=identifier)
                ))
                should_conditions.append(models.FieldCondition(
                    key="source_record_id", match=models.MatchValue(value=identifier)
                ))
        
        if not must_conditions and not should_conditions:
            return None
            
        # In Qdrant, if should is provided, at least one should must match.
        return models.Filter(
            must=must_conditions if must_conditions else None,
            should=should_conditions if should_conditions else None
        )

    def search(
        self, 
        query_vector: List[float], 
        top_k: int = 10, 
        filters: Optional[Dict[str, str]] = None,
        investigation_context: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches for semantically similar evidence.
        """
        query_filter = self._build_query_filter(filters=filters, investigation_context=investigation_context)
        
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=top_k
        )
        
        return [{"id": hit.id, "score": hit.score, "payload": hit.payload} for hit in results.points]

    def search_exact(
        self,
        identifiers: List[str],
        top_k: int = 10,
        filters: Optional[Dict[str, str]] = None,
        investigation_context: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches exactly for identifiers using Qdrant scroll API.
        """
        query_filter = self._build_query_filter(
            filters=filters, 
            investigation_context=investigation_context,
            exact_identifiers=identifiers
        )
        
        results, _ = self.client.scroll(
            collection_name=self.collection_name,
            scroll_filter=query_filter,
            limit=top_k
        )
        
        # Scrolled records have no score, so we assign 0.0. 
        # Ranking handles exact match sorting anyway.
        return [{"id": hit.id, "score": 0.0, "payload": hit.payload} for hit in results]
        
    def count(self) -> int:
        """Returns the number of points in the collection."""
        return self.client.count(collection_name=self.collection_name).count
