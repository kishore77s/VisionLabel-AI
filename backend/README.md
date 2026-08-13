# VisionLabel AI Backend

FastAPI backend for object detection, image description, review, and evaluation.

## Prerequisites

- Python 3.10+
- pip

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file inside `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VLM_MODEL=gemini-3.5-flash
```

Notes:
- `GEMINI_API_KEY` is required. The app raises an error at startup if it is missing.
- `VLM_MODEL` is optional.

## Run the API

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API base URL: `http://localhost:8000`

Swagger docs: `http://localhost:8000/docs`

## Main Endpoints

- `POST /api/detection/upload` - Upload image and run YOLO detection
- `POST /api/description/generate` - Generate image description using Gemini
- `POST /api/review/submit` - Submit human review payload
- `POST /api/evaluation/score` - Compute quality and object metrics
- `GET /api/media/{filename}` - Retrieve uploaded media file

## Project Notes

- Uploaded files are stored in `backend/uploads/`.
- YOLO model file is loaded from `backend/yolo26n.pt`.
