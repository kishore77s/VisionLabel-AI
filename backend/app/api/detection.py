from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.services.detector import ObjectDetector
from app.database.connection import get_db
from app.database.models import MediaFile, Annotation


router = APIRouter(
    prefix="/api/detection",
    tags=["Detection"]
)


detector = ObjectDetector()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/jpg",
}


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # 1. Validate file type

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG and PNG images are supported."
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required."
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image extension."
        )

    # 2. Create media ID and save file

    media_id = str(uuid4())

    stored_filename = f"{media_id}{extension}"

    file_path = UPLOAD_DIR / stored_filename

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # 3. Create database media record

    media = MediaFile(
        id=media_id,
        filename=file.filename,
        file_type=file.content_type or "unknown",
        file_path=str(file_path),
        status="processing",
    )

    db.add(media)
    db.commit()

    # 4. Run YOLO detection

    try:
        detections = detector.detect(str(file_path))

    except Exception as exc:

        db.delete(media)
        db.commit()

        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=f"Object detection failed: {exc}"
        )

    # 5. Save detections to annotations table

    for detection in detections:

        bbox = detection["bbox"]

        annotation = Annotation(
            media_id=media_id,
            label=detection["label"],
            confidence=detection["confidence"],
            x1=bbox["x1"],
            y1=bbox["y1"],
            x2=bbox["x2"],
            y2=bbox["y2"],
        )

        db.add(annotation)

    # 6. Update media status

    media.status = "pending_review"

    db.commit()

    # 7. Return existing Phase 1 response

    return {
        "media_id": media_id,
        "filename": file.filename,
        "stored_file": stored_filename,
        "media_url": f"/api/media/{stored_filename}",
        "detections": detections,
    }