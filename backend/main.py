import base64
import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
from processor import generate_face_embedding
from database import save_user, find_nearest_user, verify_user_1to1

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

@app.post("/register")
async def register(request: VerifyRequest):
    temp_path = f"{UPLOAD_DIR}/reg_{uuid.uuid4()}.jpg"
    try:
        # 1. Decode and save
        with open(temp_path, "wb") as f:
            f.write(base64.b64decode(request.image_base64))
        
        # 2. Generate embedding
        embedding = generate_face_embedding(temp_path)
        if not embedding:
            return {"status": "Error", "message": "No face detected"}

        # 3. Save to PostgreSQL
        success = save_user(request.user_id, embedding)
        if success:
            return {"status": "Success", "message": f"User {request.user_id} registered!"}
        return {"status": "Error", "message": "Database save failed"}
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)

@app.post("/verify-face")
async def verify(request: VerifyRequest):
    temp_path = f"{UPLOAD_DIR}/val_{uuid.uuid4()}.jpg"
    try:
        with open(temp_path, "wb") as f:
            f.write(base64.b64decode(request.image_base64))
        
        live_embedding = generate_face_embedding(temp_path)
        if not live_embedding:
            return {"verified": False, "error": "No face detected"}

        # 1:1 Logic: Search specifically for the user_id provided in the request
        match = verify_user_1to1(request.user_id, live_embedding)
        
        if match:
            username, distance = match
            print(f"🔍 DEBUG: 1:1 Verification for {username} - Distance: {distance}")
            
            # Threshold stays at 0.68 for ArcFace
            is_verified = distance < 0.68 
            
            return {
                "verified": is_verified,
                "user": username,
                "distance": float(distance)
            }
        
        # If no row is returned, the username wasn't found in Postgres
        return {"verified": False, "error": f"User '{request.user_id}' not found in database."}
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)