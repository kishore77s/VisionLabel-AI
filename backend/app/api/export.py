import csv
import io
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import MediaFile


router = APIRouter(
    prefix="/api/export",
    tags=["Export"],
)


def get_reviewed_media(db: Session):
    return (
        db.query(MediaFile)
        .filter(MediaFile.status == "reviewed")
        .all()
    )


@router.get("/json")
async def export_json(
    db: Session = Depends(get_db),
):
    media_files = get_reviewed_media(db)

    dataset = []

    for media in media_files:

        description = media.description

        latest_review = (
            sorted(
                media.reviews,
                key=lambda review: review.created_at,
                reverse=True,
            )[0]
            if media.reviews
            else None
        )

        dataset.append({
            "media_id": media.id,
            "filename": media.filename,
            "file_type": media.file_type,
            "file_path": media.file_path,
            "status": media.status,

            "annotations": [
                {
                    "id": annotation.id,
                    "label": annotation.label,
                    "confidence": annotation.confidence,
                    "bbox": {
                        "x1": annotation.x1,
                        "y1": annotation.y1,
                        "x2": annotation.x2,
                        "y2": annotation.y2,
                    },
                }
                for annotation in media.annotations
            ],

            "description": {
                "ai_description": (
                    description.ai_description
                    if description
                    else None
                ),
                "human_description": (
                    description.human_description
                    if description
                    else None
                ),
                "model": (
                    description.model
                    if description
                    else None
                ),
                "verified": (
                    description.verified
                    if description
                    else False
                ),
            },

            "review": {
                "approved": (
                    latest_review.approved
                    if latest_review
                    else None
                ),
                "feedback": (
                    latest_review.feedback
                    if latest_review
                    else None
                ),
                "description_score": (
                    latest_review.description_score
                    if latest_review
                    else None
                ),
                "object_accuracy": (
                    latest_review.object_accuracy
                    if latest_review
                    else None
                ),
                "overall_quality_score": (
                    latest_review.overall_quality_score
                    if latest_review
                    else None
                ),
            },
        })

    content = json.dumps(
        dataset,
        indent=2,
        default=str,
    )

    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/json",
        headers={
            "Content-Disposition":
                "attachment; filename=visionlabel-dataset.json"
        },
    )


@router.get("/csv")
async def export_csv(
    db: Session = Depends(get_db),
):
    media_files = get_reviewed_media(db)

    output = io.StringIO()

    fieldnames = [
        "media_id",
        "filename",
        "file_type",
        "status",
        "ai_description",
        "human_description",
        "approved",
        "feedback",
        "description_score",
        "object_accuracy",
        "overall_quality_score",
        "objects",
    ]

    writer = csv.DictWriter(
        output,
        fieldnames=fieldnames,
    )

    writer.writeheader()

    for media in media_files:

        description = media.description

        latest_review = (
            sorted(
                media.reviews,
                key=lambda review: review.created_at,
                reverse=True,
            )[0]
            if media.reviews
            else None
        )

        objects = [
            annotation.label
            for annotation in media.annotations
        ]

        writer.writerow({
            "media_id": media.id,
            "filename": media.filename,
            "file_type": media.file_type,
            "status": media.status,

            "ai_description": (
                description.ai_description
                if description
                else ""
            ),

            "human_description": (
                description.human_description
                if description
                else ""
            ),

            "approved": (
                latest_review.approved
                if latest_review
                else ""
            ),

            "feedback": (
                latest_review.feedback
                if latest_review
                else ""
            ),

            "description_score": (
                latest_review.description_score
                if latest_review
                else ""
            ),

            "object_accuracy": (
                latest_review.object_accuracy
                if latest_review
                else ""
            ),

            "overall_quality_score": (
                latest_review.overall_quality_score
                if latest_review
                else ""
            ),

            "objects": "; ".join(objects),
        })

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=visionlabel-dataset.csv"
        },
    )


@router.get("/coco")
async def export_coco(
    db: Session = Depends(get_db),
):
    media_files = get_reviewed_media(db)

    categories_map = {}
    categories = []

    next_category_id = 1

    images = []
    annotations = []

    annotation_id = 1

    for image_id, media in enumerate(media_files, start=1):

        images.append({
            "id": image_id,
            "file_name": media.filename,
        })

        for annotation in media.annotations:

            if annotation.label not in categories_map:

                categories_map[annotation.label] = next_category_id

                categories.append({
                    "id": next_category_id,
                    "name": annotation.label,
                    "supercategory": "object",
                })

                next_category_id += 1

            width = annotation.x2 - annotation.x1
            height = annotation.y2 - annotation.y1

            annotations.append({
                "id": annotation_id,
                "image_id": image_id,
                "category_id": categories_map[
                    annotation.label
                ],
                "bbox": [
                    annotation.x1,
                    annotation.y1,
                    width,
                    height,
                ],
                "area": width * height,
                "iscrowd": 0,
                "confidence": annotation.confidence,
            })

            annotation_id += 1

    coco_dataset = {
        "info": {
            "description": "VisionLabel AI reviewed dataset",
            "version": "1.0",
        },
        "images": images,
        "annotations": annotations,
        "categories": categories,
    }

    content = json.dumps(
        coco_dataset,
        indent=2,
    )

    return StreamingResponse(
        io.BytesIO(content.encode("utf-8")),
        media_type="application/json",
        headers={
            "Content-Disposition":
                "attachment; filename=visionlabel-dataset-coco.json"
        },
    )