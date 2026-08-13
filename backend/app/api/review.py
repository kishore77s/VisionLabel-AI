from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import MediaFile, Review


router = APIRouter(
    prefix="/api/review",
    tags=["Review"],
)


class ReviewRequest(BaseModel):
    media_id: str

    ai_description: str
    corrected_description: str

    ai_objects: list[str]
    corrected_objects: list[str]

    approved: bool


class ReviewResponse(BaseModel):
    media_id: str
    approved: bool

    final_description: str

    ai_objects: list[str]
    final_objects: list[str]

    status: str


@router.post(
    "/submit",
    response_model=ReviewResponse,
)
async def submit_review(
    request: ReviewRequest,
    db: Session = Depends(get_db),
):

    # 1. Verify media exists

    media = db.query(MediaFile).filter(
        MediaFile.id == request.media_id
    ).first()

    if not media:
        raise HTTPException(
            status_code=404,
            detail="Media record not found.",
        )

    # 2. Save human review

    review = Review(
        media_id=request.media_id,
        approved=request.approved,
        feedback=request.corrected_description,
    )

    db.add(review)

    # 3. Mark media as reviewed

    media.status = "reviewed"

    # 4. Persist changes

    db.commit()

    # 5. Return existing response

    return ReviewResponse(
        media_id=request.media_id,
        approved=request.approved,
        final_description=request.corrected_description,
        ai_objects=request.ai_objects,
        final_objects=request.corrected_objects,
        status="reviewed",
    )