import base64
import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
from processor import generate_face_embedding

app = FastAPI()

# 1. Enable CORS so your phone can talk to your computer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a folder for temporary image storage
UPLOAD_DIR = "temp_images"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class VerifyRequest(BaseModel):
    user_id: str
    image_base64: str

@app.get("/health")
async def health():
    return {"status": "ok", "info": "DeepFace backend is live"}

@app.post("/verify-face")
async def verify_face(request: VerifyRequest):
    temp_path = f"{UPLOAD_DIR}/{uuid.uuid4()}.jpg"

    try:
        # 1. Decode and save the live photo from the phone
        image_data = base64.b64decode(request.image_base64)
        with open(temp_path, "wb") as f:
            f.write(image_data)

        # 2. GENERATE EMBEDDING (The New Part)
        # We use the function we just moved to processor.py
        live_embedding = generate_face_embedding(temp_path)

        if live_embedding is None:
            return {"verified": False, "error": "No face detected. Please try again."}

        # 3. DATABASE LOOKUP (Placeholder for database.py)
        # This is where we will ask PostgreSQL: "Who matches these 512 numbers?"
        # For now, we'll return the numbers so you can see it's working.
        
        return {
            "status": "Success",
            "message": "Face converted to mathematical embedding!",
            "embedding_preview": live_embedding[:5], # Show first 5 numbers
            "total_dimensions": len(live_embedding)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 4. Clean up the temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)