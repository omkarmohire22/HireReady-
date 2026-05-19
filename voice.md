Perfect. Here's the complete voice integration plan — no external paid APIs, works locally and in browser, both accurate and fast.

---

## The Complete Voice Architecture

```
QUESTION FLOW (System Speaks)
─────────────────────────────
FastAPI generates question text
        ↓
pyttsx3 converts to audio file (question.mp3)
        ↓
FastAPI sends audio file to Next.js frontend
        ↓
Browser plays it automatically (AudioPlayer.jsx)

ANSWER FLOW (User Speaks)
─────────────────────────
User clicks 🎤 Start Speaking
        ↓
Browser MediaRecorder API records microphone
        ↓
User clicks ⏹ Stop
        ↓
Audio blob sent to FastAPI as answer.wav
        ↓
Whisper transcribes audio → text
        ↓
librosa analyses audio → pace, pauses, fillers
        ↓
VADER + XGBoost scores answer
        ↓
JSON response back to frontend
        ↓
Transcript + Score + Feedback shown on screen
```

---

## Tools You Are Using (Zero Paid APIs)

| Purpose | Tool | Why |
|---|---|---|
| Text to Speech | `pyttsx3` | Fully offline, no API key, works on Windows |
| Speech to Text | `openai-whisper` | Runs locally, free, handles Indian accents |
| Audio Analysis | `librosa` | Measures pace, pauses, energy from wav file |
| Browser Recording | `MediaRecorder API` | Built into every browser, no library needed |
| Tone Detection | `VADER` (NLTK) | Analyses confidence in transcript text |

---

## Step 1 — Install Everything

```bash
# In your venv terminal
pip uninstall whisper -y
pip install openai-whisper
pip install pyttsx3
pip install librosa
pip install soundfile
pip install nltk

# Download VADER lexicon
python -c "import nltk; nltk.download('vader_lexicon')"

# Test Whisper
python -c "import whisper; w = whisper.load_model('base'); print('Whisper OK')"

# Test pyttsx3
python -c "import pyttsx3; e = pyttsx3.init(); e.say('Hello'); e.runAndWait(); print('TTS OK')"
```

---

## Step 2 — Backend Voice Files

### File 1 — `services/tts_engine.py`
```python
import pyttsx3
import os
import uuid

def speak_question(question_text: str) -> str:
    """
    Converts question text to audio file.
    Returns path to the generated audio file.
    """
    engine = pyttsx3.init()
    
    # Voice settings
    engine.setProperty('rate', 160)      # speaking speed (words per minute)
    engine.setProperty('volume', 0.9)    # volume 0.0 to 1.0
    
    # Pick a clear voice
    voices = engine.getProperty('voices')
    engine.setProperty('voice', voices[0].id)  # voices[1] for female voice
    
    # Save to file with unique name
    filename = f"question_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join("uploads", "audio", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    engine.save_to_file(question_text, filepath)
    engine.runAndWait()
    
    return filepath
```

---

### File 2 — `services/stt_engine.py`
```python
import whisper
import os

# Load model once when server starts (not on every request)
# Use "base" for balance of speed and accuracy
# Use "small" if base is too slow on your machine
whisper_model = whisper.load_model("base")

def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribes audio file to text using Whisper.
    Returns transcript and language detected.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    result = whisper_model.transcribe(
        audio_path,
        language="en",        # force English
        fp16=False,           # set True if you have NVIDIA GPU
        verbose=False
    )
    
    return {
        "transcript": result["text"].strip(),
        "language": result["language"],
        "confidence": "high" if len(result["text"]) > 20 else "low"
    }
```

---

### File 3 — `services/voice_analyzer.py`
```python
import librosa
import numpy as np
from nltk.sentiment import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()

def analyze_communication(audio_path: str, transcript: str) -> dict:
    """
    Analyses audio for communication quality.
    Returns 5 metrics with scores.
    """
    # Load audio
    audio, sr = librosa.load(audio_path, sr=None)
    duration = librosa.get_duration(y=audio, sr=sr)
    
    # ── 1. Speaking Pace ──────────────────────────────
    word_count = len(transcript.split())
    wpm = (word_count / duration) * 60 if duration > 0 else 0
    # Ideal range: 120-150 WPM
    if 120 <= wpm <= 150:
        pace_score = 10.0
    elif 100 <= wpm < 120 or 150 < wpm <= 170:
        pace_score = 7.0
    else:
        pace_score = 4.0
    
    # ── 2. Pause Detection ────────────────────────────
    intervals = librosa.effects.split(audio, top_db=30)
    long_pauses = 0
    for i in range(len(intervals) - 1):
        gap = (intervals[i+1][0] - intervals[i][1]) / sr
        if gap > 1.5:   # pause longer than 1.5 seconds
            long_pauses += 1
    pause_score = max(0, 10 - (long_pauses * 2))
    
    # ── 3. Voice Energy Consistency ───────────────────
    rms = librosa.feature.rms(y=audio)[0]
    energy_std = float(np.std(rms))
    # Low std = consistent energy = good
    energy_score = 10.0 if energy_std < 0.02 else (7.0 if energy_std < 0.05 else 4.0)
    
    # ── 4. Filler Words ───────────────────────────────
    fillers = ["um", "uh", "like", "basically", "you know", "so", "right"]
    transcript_lower = transcript.lower()
    filler_count = sum(transcript_lower.count(f) for f in fillers)
    filler_words_found = [f for f in fillers if f in transcript_lower]
    filler_score = max(0, 10 - (filler_count * 1.5))
    
    # ── 5. Confidence Tone (VADER) ────────────────────
    sentiment = sia.polarity_scores(transcript)
    # compound score: -1 (negative) to +1 (positive/confident)
    confidence_score = round((sentiment["compound"] + 1) / 2 * 10, 2)
    
    # ── Final Communication Score (weighted) ──────────
    communication_score = round(
        (pace_score * 0.25) +
        (pause_score * 0.25) +
        (energy_score * 0.20) +
        (filler_score * 0.15) +
        (confidence_score * 0.15),
        2
    )
    
    return {
        "speaking_pace_wpm": round(wpm, 1),
        "pace_score": pace_score,
        "long_pause_count": long_pauses,
        "pause_score": pause_score,
        "voice_energy_score": energy_score,
        "filler_word_count": filler_count,
        "filler_words_found": filler_words_found,
        "filler_score": filler_score,
        "confidence_tone": confidence_score,
        "communication_score": communication_score
    }
```

---

### File 4 — `routers/voice.py`
```python
from fastapi import APIRouter, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database.connection import get_db
from services.tts_engine import speak_question
from services.stt_engine import transcribe_audio
from services.voice_analyzer import analyze_communication
import os, uuid, shutil

router = APIRouter(prefix="/voice", tags=["Voice"])

# ── TTS: Generate and return question audio ────────
@router.post("/speak")
def generate_question_audio(
    question_text: str = Form(...),
):
    """
    Receives question text.
    Returns audio file of question spoken aloud.
    """
    audio_path = speak_question(question_text)
    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename="question.mp3"
    )

# ── STT: Receive audio, transcribe, analyse ────────
@router.post("/transcribe")
async def transcribe_and_analyse(
    audio: UploadFile = File(...),
    session_id: int = Form(...),
    question_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives user's audio answer.
    Returns transcript + communication analysis.
    """
    # Save uploaded audio to disk
    filename = f"answer_{uuid.uuid4().hex}.wav"
    filepath = os.path.join("uploads", "audio", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(audio.file, f)
    
    # Transcribe with Whisper
    stt_result = transcribe_audio(filepath)
    transcript = stt_result["transcript"]
    
    # Analyse communication with librosa
    communication = analyze_communication(filepath, transcript)
    
    # Return everything to frontend
    return {
        "transcript": transcript,
        "communication": communication,
        "audio_saved_at": filepath
    }
```

---

### Register Router in `main.py`
```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, resume, interview, feedback, voice  # add voice

app = FastAPI(title="HireReady API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(feedback.router)
app.include_router(voice.router)   # add this line
```

---

## Step 3 — Frontend Voice Components

### Component 1 — `AudioPlayer.jsx` (Plays Question Aloud)
```javascript
// components/AudioPlayer.jsx
import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({ questionText, onFinished }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (questionText) {
            playQuestion(questionText);
        }
    }, [questionText]);

    const playQuestion = async (text) => {
        setLoading(true);
        try {
            const form = new FormData();
            form.append("question_text", text);

            const res = await fetch("http://localhost:8000/voice/speak", {
                method: "POST",
                body: form,
            });

            // Convert response to audio blob
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            audioRef.current = new Audio(url);
            audioRef.current.onended = () => {
                setPlaying(false);
                onFinished?.(); // tell parent question finished playing
            };
            audioRef.current.play();
            setPlaying(true);
        } catch (err) {
            console.error("TTS failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
            <div className={`w-4 h-4 rounded-full ${playing ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
            <span className="text-sm text-gray-600">
                {loading ? "Loading question audio..." :
                 playing ? "Question is playing..." :
                 "Question played"}
            </span>
        </div>
    );
}
```

---

### Component 2 — `VoiceRecorder.jsx` (Records User Answer)
```javascript
// components/VoiceRecorder.jsx
import { useState, useRef } from "react";

export default function VoiceRecorder({ sessionId, questionId, onResult }) {
    const [recording, setRecording] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [communication, setCommunication] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // ── Start Recording ──────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.start(100); // collect data every 100ms
            setRecording(true);
        } catch (err) {
            alert("Microphone access denied. Please allow microphone access.");
        }
    };

    // ── Stop and Submit ──────────────────────────────
    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
            await submitAudio(audioBlob);
        };
        setRecording(false);
    };

    // ── Send to FastAPI ──────────────────────────────
    const submitAudio = async (audioBlob) => {
        setProcessing(true);
        try {
            const form = new FormData();
            form.append("audio", audioBlob, "answer.wav");
            form.append("session_id", sessionId);
            form.append("question_id", questionId);

            const res = await fetch("http://localhost:8000/voice/transcribe", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: form,
            });

            const data = await res.json();
            setTranscript(data.transcript);
            setCommunication(data.communication);
            onResult?.(data); // pass result up to parent page

        } catch (err) {
            console.error("Transcription failed:", err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-4">

            {/* Recording Button */}
            <button
                onClick={recording ? stopRecording : startRecording}
                disabled={processing}
                className={`w-full py-4 rounded-2xl text-white font-bold text-lg transition-all
                    ${recording
                        ? "bg-red-500 animate-pulse hover:bg-red-600"
                        : "bg-blue-600 hover:bg-blue-700"
                    } ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {recording ? "⏹ Stop Recording" :
                 processing ? "🔄 Analysing your answer..." :
                 "🎤 Start Speaking"}
            </button>

            {/* Transcript */}
            {transcript && (
                <div className="p-4 bg-gray-50 rounded-xl border">
                    <p className="text-xs text-gray-400 mb-1">Your answer (transcribed):</p>
                    <p className="text-gray-800">{transcript}</p>
                </div>
            )}

            {/* Communication Metrics */}
            {communication && (
                <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                        label="Speaking Pace"
                        value={`${communication.speaking_pace_wpm} WPM`}
                        score={communication.pace_score}
                        ideal="120–150 WPM"
                    />
                    <MetricCard
                        label="Filler Words"
                        value={communication.filler_word_count}
                        score={communication.filler_score}
                        ideal="Less than 2"
                    />
                    <MetricCard
                        label="Long Pauses"
                        value={communication.long_pause_count}
                        score={communication.pause_score}
                        ideal="0 long pauses"
                    />
                    <MetricCard
                        label="Confidence"
                        value={`${communication.confidence_tone}/10`}
                        score={communication.confidence_tone}
                        ideal="Above 7"
                    />
                </div>
            )}
        </div>
    );
}

// Small metric card component
function MetricCard({ label, value, score, ideal }) {
    const color = score >= 7 ? "green" : score >= 4 ? "yellow" : "red";
    const colorMap = {
        green: "bg-green-50 border-green-200 text-green-700",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
        red: "bg-red-50 border-red-200 text-red-700"
    };

    return (
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs opacity-60">Ideal: {ideal}</p>
        </div>
    );
}
```

---

### Component 3 — `PracticeRoom.jsx` (Puts It All Together)
```javascript
// pages/practice.jsx
import { useState, useEffect } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import VoiceRecorder from "@/components/VoiceRecorder";

export default function PracticeRoom() {
    const [question, setQuestion] = useState(null);
    const [questionPlayed, setQuestionPlayed] = useState(false);
    const [result, setResult] = useState(null);
    const [questionNumber, setQuestionNumber] = useState(1);

    // Fetch first question when page loads
    useEffect(() => {
        fetchNextQuestion();
    }, []);

    const fetchNextQuestion = async () => {
        setResult(null);
        setQuestionPlayed(false);
        const res = await fetch("http://localhost:8000/interview/next-question", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        setQuestion(data);
    };

    const handleResult = (data) => {
        setResult(data);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">

            {/* Question Number */}
            <div className="text-sm text-gray-400">
                Question {questionNumber} of 5
            </div>

            {/* Question Text */}
            {question && (
                <div className="p-6 bg-white rounded-2xl shadow-sm border">
                    <p className="text-lg font-medium text-gray-800">
                        {question.question_text}
                    </p>
                    <span className="text-xs text-blue-500 mt-2 block">
                        Skill: {question.skill} | Difficulty: {question.difficulty}
                    </span>
                </div>
            )}

            {/* Audio Player — auto plays question */}
            {question && (
                <AudioPlayer
                    questionText={question.question_text}
                    onFinished={() => setQuestionPlayed(true)}
                />
            )}

            {/* Voice Recorder — appears after question plays */}
            {questionPlayed && !result && (
                <VoiceRecorder
                    sessionId={1}
                    questionId={question?.id}
                    onResult={handleResult}
                />
            )}

            {/* Result + Next Button */}
            {result && (
                <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                        <p className="font-bold text-green-700">
                            Overall Score: {result.communication.communication_score}/10
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setQuestionNumber(q => q + 1);
                            fetchNextQuestion();
                        }}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium"
                    >
                        Next Question →
                    </button>
                </div>
            )}
        </div>
    );
}
```

---

## Complete Flow Summary

```
User opens Practice Room
        ↓
FastAPI sends question text
        ↓
AudioPlayer.jsx fetches /voice/speak
        ↓
pyttsx3 generates question.mp3
        ↓
Browser plays audio automatically
        ↓
onFinished() triggers → mic button appears
        ↓
User clicks 🎤 → MediaRecorder starts
        ↓
User speaks for 30-60 seconds
        ↓
User clicks ⏹ → audio blob created
        ↓
VoiceRecorder sends blob to /voice/transcribe
        ↓
Whisper transcribes → text
librosa analyses → pace, pauses, fillers
VADER scores → confidence
        ↓
JSON response → frontend shows everything
        ↓
Next Question button → repeat
```

---

## Test Each Part Separately First

```python
# test_voice_pipeline.py — run this before touching frontend
from services.tts_engine import speak_question
from services.stt_engine import transcribe_audio
from services.voice_analyzer import analyze_communication

# Test 1: TTS
path = speak_question("Explain the concept of Docker containers.")
print("TTS file created at:", path)

# Test 2: STT (record yourself first, save as test.wav)
result = transcribe_audio("test.wav")
print("Transcript:", result["transcript"])

# Test 3: Communication Analysis
metrics = analyze_communication("test.wav", result["transcript"])
print("WPM:", metrics["speaking_pace_wpm"])
print("Fillers:", metrics["filler_words_found"])
print("Communication Score:", metrics["communication_score"])
```

---

**Start with this test file today.** Once all 3 print statements work correctly, your entire voice pipeline is validated and frontend integration is just wiring.

Want me to now write the complete `routers/interview.py` that connects question generation to the voice flow end to end?

Yes exactly. Let me clarify the complete flow so you have zero confusion.

---

## Who Does What in HireReady

```
APP side (your system)          USER side (candidate)
──────────────────────          ─────────────────────

1. Generates question           
   (FLAN-T5)                    
        ↓                       
2. SPEAKS question aloud        
   (pyttsx3 → browser audio)   → User HEARS question
        ↓                       
                                User SPEAKS answer
                                (clicks mic button)
                                        ↓
3. LISTENS to answer            ←  Browser records audio
   (Whisper transcribes)        
        ↓                       
4. SCORES the answer            
   (XGBoost + librosa + VADER)  
        ↓                       
5. SHOWS feedback               → User READS their score
   (transcript + metrics)       
        ↓                       
6. NEXT question                → Repeat
```

---

## Simply Put

| # | Who | Action |
|---|---|---|
| 1 | **App** | Asks question out loud |
| 2 | **User** | Speaks their answer |
| 3 | **App** | Listens, transcribes, scores |
| 4 | **App** | Shows feedback |
| 5 | **App** | Asks next question |

---

## What It Feels Like to the User

```
"Explain Docker containers"     ← they HEAR this from speakers
        ↓
[User speaks for 30 seconds]    ← they talk to the mic
        ↓
Your answer: "Docker is a       ← they SEE transcript on screen
containerization platform..."   
        ↓
Score: 7.2/10                   ← they SEE their score
WPM: 145 ✅                     
Fillers: 2 ⚠️                   
        ↓
Next Question →                 ← they click to continue
```

---

It's essentially a **voice-based interview simulator** where your app plays the role of the interviewer — asking questions out loud — and the user is the job candidate answering by speaking.

Do you want me to now write the complete interview flow code that ties question generation → voice → scoring all together in one file?

Yes exactly. Let me clarify the complete flow so you have zero confusion.

---

## Who Does What in HireReady

```
APP side (your system)          USER side (candidate)
──────────────────────          ─────────────────────

1. Generates question           
   (FLAN-T5)                    
        ↓                       
2. SPEAKS question aloud        
   (pyttsx3 → browser audio)   → User HEARS question
        ↓                       
                                User SPEAKS answer
                                (clicks mic button)
                                        ↓
3. LISTENS to answer            ←  Browser records audio
   (Whisper transcribes)        
        ↓                       
4. SCORES the answer            
   (XGBoost + librosa + VADER)  
        ↓                       
5. SHOWS feedback               → User READS their score
   (transcript + metrics)       
        ↓                       
6. NEXT question                → Repeat
```

---

## Simply Put

| # | Who | Action |
|---|---|---|
| 1 | **App** | Asks question out loud |
| 2 | **User** | Speaks their answer |
| 3 | **App** | Listens, transcribes, scores |
| 4 | **App** | Shows feedback |
| 5 | **App** | Asks next question |

---

## What It Feels Like to the User

```
"Explain Docker containers"     ← they HEAR this from speakers
        ↓
[User speaks for 30 seconds]    ← they talk to the mic
        ↓
Your answer: "Docker is a       ← they SEE transcript on screen
containerization platform..."   
        ↓
Score: 7.2/10                   ← they SEE their score
WPM: 145 ✅                     
Fillers: 2 ⚠️                   
        ↓
Next Question →                 ← they click to continue
```

---

It's essentially a **voice-based interview simulator** where your app plays the role of the interviewer — asking questions out loud — and the user is the job candidate answering by speaking.

Do you want me to now write the complete interview flow code that ties question generation → voice → scoring all together in one file?