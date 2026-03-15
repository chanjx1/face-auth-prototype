# Face Authentication Prototype 🛡️

This prototype integrates a **FastAPI** backend with a **React Native (Expo SDK 54)** frontend to perform real-time face verification.

## 📁 Project Structure
- `backend/`: Python FastAPI server using DeepFace (ArcFace + RetinaFace).
- `frontend/`: Expo mobile app using CameraView and ImageManipulator.

## 🛠️ Setup Instructions

### 1. Backend (AI Brain)
1. `cd backend`
2. Create venv: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows)
4. Install: `pip install fastapi uvicorn deepface tf-keras opencv-python python-multipart`
5. **Add Reference**: Place a photo of yourself in the `backend/` folder named `my_face.jpg`.
6. Run: `uvicorn main:app --host 0.0.0.0 --port 8000`

### 2. Frontend (Mobile App)
1. `cd frontend`
2. Install: `npm install`
3. **Config**: Ensure `BACKEND_URL` in `App.tsx` matches your PC's IP (e.g., `http://192.168.x.xxx:8000`).
4. Run: `npx expo start -c`
5. Scan QR with **Expo Go**.

## ✅ Current Progress
- [x] End-to-end Base64 image transmission.
- [x] Real-time face detection using RetinaFace.
- [x] 1:1 Face verification using ArcFace.
- [ ] Database integration for Face Embeddings (Upcoming).