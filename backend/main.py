from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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
from routers import resume, auth, interview, report, user, questions
from database.init_indexes import init_db_indexes

# Initialize indexes on startup
@app.on_event("startup")
async def startup_event():
    init_db_indexes()

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(report.router)
app.include_router(user.router)
app.include_router(questions.router)
# Basic Health Check Endpoint
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "HireReady AI Backend is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
