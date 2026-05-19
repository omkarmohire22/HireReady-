import pyttsx3
import os
import uuid


def speak_question(question_text: str) -> str:
    """
    Converts question text to a WAV audio file using pyttsx3.
    Returns the absolute path to the generated file.
    pyttsx3 on Windows always produces a WAV file regardless of extension.
    """
    engine = pyttsx3.init()
    engine.setProperty('rate', 155)    # natural speaking pace
    engine.setProperty('volume', 0.95)

    # Prefer a clearer voice (index 1 is usually female/David on Windows)
    voices = engine.getProperty('voices')
    if voices and len(voices) > 1:
        engine.setProperty('voice', voices[1].id)
    elif voices:
        engine.setProperty('voice', voices[0].id)

    audio_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "audio")
    os.makedirs(audio_dir, exist_ok=True)

    # pyttsx3 on Windows saves as WAV even with .wav extension
    filename = f"question_{uuid.uuid4().hex}.wav"
    filepath = os.path.abspath(os.path.join(audio_dir, filename))

    engine.save_to_file(question_text, filepath)
    engine.runAndWait()
    engine.stop()

    return filepath
