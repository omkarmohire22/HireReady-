import traceback
try:
    import whisper
    print("Loading Whisper model...")
    model = whisper.load_model("base")
    print("Whisper model loaded successfully!")
    
    # Try transcribing a dummy or non-existent file to see if it triggers the NoneType error or FileNotFoundError
    print("Trying transcription of non-existent file...")
    try:
        model.transcribe("non_existent_file.wav")
    except Exception as e:
        print("Transcription failed as expected. Details:")
        traceback.print_exc()
except Exception as e:
    print("Failed with exception:")
    traceback.print_exc()
