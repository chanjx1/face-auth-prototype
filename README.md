# Face Authentication System 🛡️

This system integrates a **FastAPI** backend with a **React Native (Expo SDK 54)** frontend to perform real-time, multi-user face identification using vector embeddings.

## 🚀 Key Features
- **1:N Identification**: The system doesn't just verify a specific user; it searches the entire database to find the closest match.
- **AI-Powered Embeddings**: Uses **ArcFace** to generate 512-dimensional vectors and **RetinaFace** for high-accuracy detection.
- **Vector Database**: Powered by **PostgreSQL 18** and the **pgvector** extension for high-performance cosine similarity searches.
- **Multi-User Enrollment**: Dynamic registration and identification of multiple users via the mobile interface.

---

## 📁 Project Structure
- `backend/`
  - `main.py`: API routes for registration and verification.
  - `processor.py`: Logic for converting images into mathematical fingerprints.
  - `database.py`: PostgreSQL connection and vector similarity logic.
- `frontend/`
  - `App.tsx`: React Native UI featuring Mode Toggle (Register vs. Verify) and dynamic naming.

---

## 🛠️ Setup Instructions

### 1. Database (The Memory)
1. Install **PostgreSQL 18**.
2. Install the **pgvector** extension manually by moving `vector.dll` to your `/lib` folder and the `.sql`/`.control` files to `/share/extension`.
3. Run the following in **DBeaver** to initialize your AI-ready table:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    face_embedding vector(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Backend (AI Brain)
1. `cd backend`
2. Create venv: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows)
4. Install: `pip install fastapi uvicorn deepface tf-keras opencv-python python-multipart psycopg2-binary pgvector`
5. Update `DB_CONFIG` in `database.py` with your PostgreSQL credentials. (line 10)
6. Run: `uvicorn main:app --host 0.0.0.0 --port 8000`

### 3. Frontend (Mobile App)
1. `cd frontend`
2. Install: `npm install`
3. **Config**: Ensure `BACKEND_URL` in `App.tsx` matches your PC's IP (e.g., `http://192.168.x.xxx:8000`). (line 14)
4. Run: `npx expo start -c`
5. Scan QR with **Expo Go**.

✅ Project Milestones
[x] End-to-end Base64 image transmission between mobile and server.
[x] Real-time face detection using the RetinaFace backend.
[x] 1:N Face Identification using ArcFace & Cosine Similarity.
[x] PostgreSQL Integration for persistent, searchable face storage.
[x] Multi-User Support with dynamic username input.

📊 Performance Benchmark
- Registration Score: ~0.04 distance (Highly accurate match).
- Verification Score: ~0.12 - 0.15 distance (Reliable identification across different backgrounds).
- Threshold: Secured at < 0.68 using Cosine Distance (<=>).