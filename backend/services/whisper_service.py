import os
import whisper

class WhisperService:
    def __init__(self):
        # Load the base model. This takes ~500MB and might be slow on first run
        try:
            print("Loading Whisper model...")
            self.model = whisper.load_model("base")
            print("Whisper model loaded.")
        except Exception as e:
            print(f"Error loading whisper model: {e}")
            self.model = None

    def transcribe(self, audio_file_path: str) -> str:
        if not self.model:
            return "Whisper model not loaded."
            
        try:
            result = self.model.transcribe(audio_file_path)
            return result["text"].strip()
        except Exception as e:
            return f"Error transcribing audio: {str(e)}"
