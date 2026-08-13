from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse


router = APIRouter(
    prefix="/api/media",
    tags=["Media"]
)


UPLOAD_DIR = Path("uploads")


@router.get("/{filename}")
async def get_media(filename: str):

    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Media file not found."
        )

    return FileResponse(file_path)