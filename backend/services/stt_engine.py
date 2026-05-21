import os
import whisper

# Load model once when module is imported
# Use "base" for balance of speed and accuracy
# To prevent reloading on every request, we instantiate it here.
print("Loading Whisper model (tiny)...")
whisper_model = whisper.load_model("tiny")
print("Whisper model loaded.")

def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribes audio file to text using Whisper.
    Returns transcript and language detected.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    # transcribe() converts audio to text
    result = whisper_model.transcribe(
        audio_path,
        language="en",        # force English
        fp16=False,           # set True if you have NVIDIA GPU
        verbose=False
    )
    
    return {
        "transcript": result["text"].strip(),
        "language": result.get("language", "en"),
        "confidence": "high" if len(result["text"]) > 20 else "low"
    }
