import json
import os
import tempfile

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile,
    Depends,
)

from sqlalchemy.orm import Session

from app.schemas.phase2 import DescriptionResponse
from app.services.vlm import generate_description
from app.database.connection import get_db
from app.database.models import MediaFile, Description


router = APIRouter(
    prefix="/api/description",
    tags=["Description"],
)


@router.post(
    "/generate",
    response_model=DescriptionResponse,
)
async def generate_image_description(
    file: UploadFile = File(...),
    detections: str = Form(...),
    media_id: str | None = Form(None),
    db: Session = Depends(get_db),
):

    temp_path = None

    try:

        # 1. Parse detections

        try:
            detection_data = json.loads(detections)

        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid detections JSON."
            )

        # 2. Validate image

        suffix = os.path.splitext(
            file.filename or ".jpg"
        )[1].lower()

        if suffix not in {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
        }:
            raise HTTPException(
                status_code=400,
                detail="Unsupported image format."
            )

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )

        # 3. Create temporary image

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:

            temp_file.write(image_bytes)

            temp_path = temp_file.name

        # 4. Generate VLM description

        description = await generate_description(
            image_path=temp_path,
            detections=detection_data,
        )

        model_name = os.getenv(
            "VLM_MODEL",
            "gemini-3.5-flash"
        )

        # 5. Persist description

        if media_id:

            media = db.query(MediaFile).filter(
                MediaFile.id == media_id
            ).first()

            if not media:
                raise HTTPException(
                    status_code=404,
                    detail="Media record not found."
                )

            existing_description = db.query(
                Description
            ).filter(
                Description.media_id == media_id
            ).first()

            if existing_description:

                existing_description.ai_description = description
                existing_description.model = model_name
                existing_description.verified = False

            else:

                description_record = Description(
                    media_id=media_id,
                    ai_description=description,
                    model=model_name,
                    verified=False,
                )

                db.add(description_record)

            media.status = "pending_review"

            db.commit()

        # 6. Return existing Phase 2 response

        return DescriptionResponse(
            description=description,
            model=model_name,
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Description generation failed: {exc}",
        )

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)