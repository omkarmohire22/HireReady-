from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Automatically inject Conda's Library/bin path to environment PATH to ensure ffmpeg is found on Windows
conda_library_bin = r"C:\Users\omkar\miniconda3\Library\bin"
if os.path.exists(conda_library_bin) and conda_library_bin not in os.environ.get("PATH", ""):
    os.environ["PATH"] += os.pathsep + conda_library_bin

from fastapi.staticfiles import StaticFiles

# Initialize FastAPI app
app = FastAPI(
    title="HireReady AI Backend",
    description="Backend API for the HireReady AI Interview Coach",
    version="1.0.0"
)

# Configure CORS so the Next.js frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during dev
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Import and include routers
from routers import resume, auth, interview, report, user, questions, voice, roadmap, stripe_router
from database.connection import init_db

# Mount static files for audio playback
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize tables on startup
@app.on_event("startup")
async def startup_event():
    init_db()

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(report.router)
app.include_router(user.router)
app.include_router(questions.router)
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(roadmap.router)
app.include_router(stripe_router.router)
# Basic Health Check Endpoint
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "HireReady AI Backend is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
