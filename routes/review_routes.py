from fastapi import APIRouter, HTTPException

from ProofMarkAI.schema.review_schema import ReviewRequest, ReviewResponse
from ProofMarkAI.service.review_service import review_content

router = APIRouter(prefix="/review", tags=["Review"])


@router.post("/", response_model=ReviewResponse)
def review(request: ReviewRequest) -> ReviewResponse:
    try:
        return review_content(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc