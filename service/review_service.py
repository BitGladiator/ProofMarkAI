from ProofMarkAI.service.llm_service import generate_review
from ProofMarkAI.service.prompt_builder import build_prompt

from ProofMarkAI.schema.review_schema import ReviewRequest, ReviewResponse


def review_content(request: ReviewRequest) -> ReviewResponse:
    draft_content = request.draft_content

    brand_guidelines = [
        guideline.model_dump()
        for guideline in request.brand_guidelines
    ]

    approved_facts = [
        fact.model_dump()
        for fact in request.approved_facts
    ]

    prompt = build_prompt(
        draft_content,
        brand_guidelines,
        approved_facts
    )

    return generate_review(prompt)
