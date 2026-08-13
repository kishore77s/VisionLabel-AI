from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.database.models import MediaFile, Annotation, Review


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
):
    # Total uploaded media
    total_images = db.query(
        func.count(MediaFile.id)
    ).scalar() or 0

    # Images waiting for human review
    pending_review = db.query(
        func.count(MediaFile.id)
    ).filter(
        MediaFile.status == "pending_review"
    ).scalar() or 0

    # Completed reviews
    reviewed = db.query(
        func.count(MediaFile.id)
    ).filter(
        MediaFile.status == "reviewed"
    ).scalar() or 0

    # Total detected objects
    total_objects = db.query(
        func.count(Annotation.id)
    ).scalar() or 0

    # Average detection confidence
    average_confidence = db.query(
        func.avg(Annotation.confidence)
    ).scalar()

    # Average quality score
    average_quality = db.query(
        func.avg(Review.overall_quality_score)
    ).scalar()

    return {
        "total_images": total_images,
        "pending_review": pending_review,
        "reviewed": reviewed,
        "total_objects": total_objects,
        "average_confidence": round(
            float(average_confidence or 0),
            2,
        ),
        "average_quality_score": round(
            float(average_quality or 0),
            2,
        ),
    }