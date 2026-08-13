from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.evaluator import (
    calculate_description_score,
    calculate_object_accuracy,
    calculate_quality_score,
)

from app.database.connection import get_db
from app.database.models import Review


router = APIRouter(
    prefix="/api/evaluation",
    tags=["Evaluation"]
)


class EvaluationRequest(BaseModel):
    media_id: str

    ai_description: str
    human_description: str

    ai_objects: list[str]
    human_objects: list[str]


class EvaluationResponse(BaseModel):
    description_score: float
    object_accuracy: float
    review_score: float
    overall_quality_score: float
    status: str


@router.post(
    "/score",
    response_model=EvaluationResponse
)
async def evaluate_description(
    request: EvaluationRequest,
    db: Session = Depends(get_db),
):

    # -----------------------------------------
    # 1. Calculate description score
    # -----------------------------------------

    description_score = calculate_description_score(
        request.ai_description,
        request.human_description
    )

    # -----------------------------------------
    # 2. Calculate object accuracy
    # -----------------------------------------

    object_accuracy = calculate_object_accuracy(
        request.ai_objects,
        request.human_objects
    )

    # -----------------------------------------
    # 3. Calculate review score
    # -----------------------------------------

    review_score = 100.0

    # -----------------------------------------
    # 4. Calculate overall quality
    # -----------------------------------------

    overall_score = calculate_quality_score(
        description_score,
        object_accuracy,
        review_score
    )

    # -----------------------------------------
    # 5. Determine status
    # -----------------------------------------

    if overall_score >= 90:
        status = "excellent"

    elif overall_score >= 75:
        status = "good"

    elif overall_score >= 60:
        status = "needs_review"

    else:
        status = "poor"

    # -----------------------------------------
    # 6. Find the saved review
    # -----------------------------------------
    review = db.query(Review).filter(
        Review.media_id == request.media_id
    ).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review record not found for this media."
        )

    # -----------------------------------------
    # 7. Save evaluation scores
    # -----------------------------------------

    review.description_score = description_score
    review.object_accuracy = object_accuracy
    review.overall_quality_score = overall_score

    db.commit()

    # -----------------------------------------
    # 8. Return existing evaluation response
    # -----------------------------------------

    return EvaluationResponse(
        description_score=description_score,
        object_accuracy=object_accuracy,
        review_score=review_score,
        overall_quality_score=overall_score,
        status=status
    )