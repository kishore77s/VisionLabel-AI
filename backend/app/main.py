from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, engine
from app.database import models

from app.api.detection import router as detection_router
from app.api.description import router as description_router
from app.api.review import router as review_router
from app.api.evaluation import router as evaluation_router
from app.api.media import router as media_router
from app.api.dashboard import router as dashboard_router
from app.api.export import router as export_router



Base.metadata.create_all(bind=engine)



app = FastAPI(
    title="VisionLabel AI",
    description="Multimodal AI Data Annotation Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(detection_router)
app.include_router(description_router)
app.include_router(review_router)
app.include_router(evaluation_router)
app.include_router(media_router)
app.include_router(dashboard_router)
app.include_router(export_router)


@app.get("/")
def root():
    return {
        "message": "VisionLabel AI API is running"
    }

# main application entrypoint
