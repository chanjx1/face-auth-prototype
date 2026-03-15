import base64
import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace

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
    # Ensure you have a photo of yourself named 'my_face.jpg' in the backend folder!
    reference_path = "my_face.jpg" 
    temp_path = f"{UPLOAD_DIR}/{uuid.uuid4()}.jpg"

    if not os.path.exists(reference_path):
        raise HTTPException(status_code=404, detail="Reference image 'my_face.jpg' not found.")

    try:
        # 2. Decode the incoming image from your phone
        image_data = base64.b64decode(request.image_base64)
        with open(temp_path, "wb") as f:
            f.write(image_data)

        # 3. Perform the Face Comparison
        # This will download models on the first run (ArcFace & RetinaFace)
        result = DeepFace.verify(
            img1_path = temp_path,
            img2_path = reference_path,
            model_name = "ArcFace",
            detector_backend = "retinaface"
        )

        # 4. Clean up the temp file
        os.remove(temp_path)

        return {
            "verified": bool(result["verified"]),
            "distance": float(result["distance"]),
            "threshold": float(result["threshold"])
        }

    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))