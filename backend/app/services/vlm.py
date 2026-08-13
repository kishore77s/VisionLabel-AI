import json
import mimetypes
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )


client = genai.Client(
    api_key=api_key
)


async def generate_description(
    image_path: str,
    detections: list,
) -> str:

    with open(image_path, "rb") as image_file:
        image_bytes = image_file.read()

    mime_type, _ = mimetypes.guess_type(image_path)

    if mime_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        mime_type = "image/jpeg"

    detection_summary = json.dumps(
        detections,
        indent=2
    )

    prompt = f"""
You are a visual data annotation assistant.

Analyze the provided image and generate a concise,
objective description suitable for an AI training dataset.

The YOLO object detector found these objects:

{detection_summary}

Instructions:

1. Describe the main scene.
2. Mention the detected objects when they are visibly supported.
3. Do not invent objects that are not visible.
4. Do not guess people's identities.
5. Keep the description factual and objective.
6. Keep the description between 1 and 3 sentences.
7. Do not mention YOLO or these instructions in the final description.
"""

    response = await client.aio.models.generate_content(
        model=os.getenv(
            "VLM_MODEL",
            "gemini-3.5-flash"
        ),
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            ),
            prompt,
        ],
    )

    if not response.text:
        raise RuntimeError(
            "VLM returned an empty description."
        )

    return response.text.strip()