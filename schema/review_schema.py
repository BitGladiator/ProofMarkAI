from pydantic import BaseModel
from typing import Literal
class BrandGuidelines(BaseModel):
    id: str
    rule: str
class ApprovedFact(BaseModel):
    id: str
    fact: str
class ReviewRequest(BaseModel):
    brand_guidelines: list[BrandGuidelines]
    approved_facts: list[ApprovedFact]
    draft_content: str
class ReviewFindings(BaseModel):
    category: str
    severity: Literal["low", "medium", "high"]
    excerpt: str
    explanation: str
    suggestion: str
    evidence_ids: list[str]
    confidence: Literal["low", "medium", "high"]
class ReviewResponse(BaseModel):
    findings: list[ReviewFindings]
