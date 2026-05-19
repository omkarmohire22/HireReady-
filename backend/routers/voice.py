from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os, shutil, uuid

from database.connection import get_db
from services.auth_service import get_current_user
from database.models import User as UserModel

# ── Lazy loaders ────────────────────────────────────────────────────────────
def get_tts():
    from services.tts_engine import speak_question
    return speak_question

def get_stt():
    from services.stt_engine import transcribe_audio
    return transcribe_audio

def get_analyzer():
    from services.voice_analyzer import analyze_communication
    return analyze_communication

router = APIRouter()

class SpeakRequest(BaseModel):
    text: str

def cleanup_file(filepath: str):
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass

# ── TTS: Text → Audio ───────────────────────────────────────────────────────
@router.post("/speak")
async def generate_speech(request: SpeakRequest, background_tasks: BackgroundTasks):
    """Generate WAV audio from question text using pyttsx3."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    try:
        speak_question = get_tts()
        audio_path = speak_question(request.text)
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=500, detail="Audio file was not generated")
        background_tasks.add_task(cleanup_file, audio_path)
        return FileResponse(
            path=audio_path,
            media_type="audio/wav",        # pyttsx3 always produces WAV on Windows
            filename=os.path.basename(audio_path),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")


# ── STT + Analysis: Audio → Transcript + Metrics ───────────────────────────
from fastapi import Form

@router.post("/analyze")
async def analyze_voice(
    audio_file: UploadFile = File(...),
    transcript: str = Form(None)
):
    """Transcribe and analyze a recorded voice answer."""
    if not audio_file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_ext = os.path.splitext(audio_file.filename)[1] or ".webm"
    temp_filename = f"upload_{uuid.uuid4().hex}{file_ext}"
    audio_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    temp_filepath = os.path.abspath(os.path.join(audio_dir, temp_filename))

    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        # Clean and sanitize incoming browser transcript
        browser_transcript = (transcript or "").strip()
        if browser_transcript.lower() in {"undefined", "null", "none", "no response"}:
            browser_transcript = ""

        # Trigger high-accuracy Whisper STT if browser transcript is missing or extremely short
        if not browser_transcript or len(browser_transcript) < 12:
            try:
                transcribe_audio = get_stt()
                stt_result = transcribe_audio(temp_filepath)
                whisper_text = stt_result.get("transcript", "").strip()
                if whisper_text:
                    transcript = whisper_text
                else:
                    transcript = browser_transcript
            except Exception as e:
                print(f"Whisper STT failed: {e}")
                transcript = browser_transcript
        else:
            transcript = browser_transcript

        analyze_communication = get_analyzer()
        analysis_result = analyze_communication(temp_filepath, transcript)

        return {
            "status": "success",
            "transcript": transcript,
            "language": "en",
            "analysis": analysis_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")
    finally:
        cleanup_file(temp_filepath)


# ── Save Recording: Store audio blob to user's profile folder ───────────────
@router.post("/save-recording")
async def save_recording(
    audio_file: UploadFile = File(...),
    session_id: str = "unknown",
    question_id: str = "q0",
    current_user: UserModel = Depends(get_current_user),
):
    """
    Persists the user's recorded answer audio to their profile folder.
    Files are saved at: uploads/recordings/{user_id}/{session_id}_{question_id}.webm
    """
    file_ext = os.path.splitext(audio_file.filename or "recording.webm")[1] or ".webm"
    recordings_dir = os.path.join(
        os.path.dirname(__file__), "..", "uploads", "recordings", str(current_user.id)
    )
    os.makedirs(recordings_dir, exist_ok=True)

    save_filename = f"{session_id}_{question_id}_{uuid.uuid4().hex[:8]}{file_ext}"
    save_path = os.path.abspath(os.path.join(recordings_dir, save_filename))

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        return {
            "status": "saved",
            "filename": save_filename,
            "path": f"/uploads/recordings/{current_user.id}/{save_filename}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save error: {str(e)}")
