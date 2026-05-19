Great — you're actually in a strong position. Most of the hard parts are done. Let me give you a precise plan.

---

## Current Honest Assessment

```
Frontend:     85% done ✅
Backend:      70% done 🟡  
AI Models:    75% done 🟡
Integration:  10% done 🔴  ← This is your real problem
```

Your biggest risk right now is **not features — it's that nothing talks to each other yet.**

---

## Phase 1 — Fix Broken Things First (Today, 2-3 Hours)

### Fix 1 — Whisper (Do This First, Takes 5 Minutes)
```bash
# In your venv terminal
pip uninstall whisper -y
pip install openai-whisper
python -c "import whisper; w = whisper.load_model('base'); print('Whisper OK')"
```

### Fix 2 — Fix Interview Router to PostgreSQL
```python
# routers/interview.py
# Replace every MongoDB call with SQLAlchemy like this:

# ❌ OLD (MongoDB)
session = db.sessions.insert_one({...})

# ✅ NEW (PostgreSQL)
from models import InterviewSession
session = InterviewSession(
    user_id=user_id,
    resume_id=resume_id,
    job_role=job_role,
    status="ongoing"
)
db.add(session)
db.commit()
db.refresh(session)
```

### Fix 3 — Fix Report Builder to PostgreSQL
```python
# services/report_builder.py

# ❌ OLD (MongoDB)
answers = db.answers.find({"session_id": session_id})

# ✅ NEW (PostgreSQL)
from models import Answer
answers = db.query(Answer)\
            .filter(Answer.session_id == session_id)\
            .all()
```

---

## Phase 2 — Connect Frontend to Backend (Tomorrow, Full Day)

This is your most critical task. Every frontend page needs to talk to FastAPI.

### Step 1 — Create a central API file in Next.js
```javascript
// frontend/src/lib/api.js
const BASE_URL = "http://localhost:8000";

export const api = {
    // Auth
    login: (data) => 
        fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        }).then(r => r.json()),

    // Resume
    uploadResume: (file) => {
        const form = new FormData();
        form.append("file", file);
        return fetch(`${BASE_URL}/resume/upload`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`},
            body: form
        }).then(r => r.json());
    },

    // Interview
    startSession: (roleId) =>
        fetch(`${BASE_URL}/interview/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({role_id: roleId})
        }).then(r => r.json()),

    // Voice Answer
    submitAudio: (sessionId, audioBlob) => {
        const form = new FormData();
        form.append("audio", audioBlob, "answer.wav");
        form.append("session_id", sessionId);
        return fetch(`${BASE_URL}/voice/transcribe`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`},
            body: form
        }).then(r => r.json());
    }
};

const getToken = () => localStorage.getItem("token");
```

### Step 2 — Connect Each Page

**Auth Page:**
```javascript
// pages/login.jsx
import { api } from "@/lib/api";

const handleLogin = async () => {
    const res = await api.login({email, password});
    if (res.access_token) {
        localStorage.setItem("token", res.access_token);
        router.push("/dashboard");
    }
};
```

**Practice Room (Most Important):**
```javascript
// pages/practice.jsx
import { useState, useRef } from "react";
import { api } from "@/lib/api";

export default function PracticeRoom() {
    const [question, setQuestion] = useState("");
    const [transcript, setTranscript] = useState("");
    const [score, setScore] = useState(null);
    const [recording, setRecording] = useState(false);
    const mediaRef = useRef(null);
    const chunksRef = useRef([]);

    // Start recording
    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        mediaRef.current = new MediaRecorder(stream);
        mediaRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
        mediaRef.current.start();
        setRecording(true);
    };

    // Stop and submit
    const stopRecording = async () => {
        mediaRef.current.stop();
        mediaRef.current.onstop = async () => {
            const blob = new Blob(chunksRef.current, {type: "audio/wav"});
            const result = await api.submitAudio(sessionId, blob);
            setTranscript(result.transcript);
            setScore(result.overall_score);
            chunksRef.current = [];
        };
        setRecording(false);
    };

    return (
        <div>
            <p>{question}</p>
            <button onClick={recording ? stopRecording : startRecording}>
                {recording ? "⏹ Stop" : "🎤 Start Speaking"}
            </button>
            {transcript && <p>Your answer: {transcript}</p>}
            {score && <p>Score: {score}/10</p>}
        </div>
    );
}
```

---

## Phase 3 — Add 5 Things That Make This Industry-Level (Days 3-7)

### Addition 1 — Adaptive Difficulty ⭐ (Biggest Impact)
```python
# services/question_generator.py
def get_next_difficulty(running_score: float) -> str:
    """
    Adjusts question difficulty based on performance
    Makes your system genuinely intelligent
    """
    if running_score >= 7.5:
        return "Hard"
    elif running_score >= 5.0:
        return "Medium"
    else:
        return "Easy"
```

This single function makes your system **adaptive** — a genuine ML feature most projects don't have.

### Addition 2 — Keyword Highlighting in Feedback
```python
# services/feedback_scorer.py
def get_keyword_feedback(transcript: str, expected_keywords: list) -> dict:
    transcript_lower = transcript.lower()
    used = [k for k in expected_keywords if k in transcript_lower]
    missed = [k for k in expected_keywords if k not in transcript_lower]
    return {
        "keywords_used": used,
        "keywords_missed": missed,
        "coverage_score": len(used) / len(expected_keywords) * 10
    }
```

Then in your frontend show:
```
✅ containerisation  ✅ image  ❌ orchestration  ❌ volumes
```

### Addition 3 — Progress Tracking Across Sessions
```sql
-- Add this query to your report builder
SELECT 
    session_number,
    AVG(overall_score) as avg_score,
    AVG(speaking_pace_wpm) as avg_wpm,
    SUM(filler_word_count) as total_fillers
FROM interview_answers
JOIN interview_sessions ON session_id = interview_sessions.id
WHERE user_id = %s
GROUP BY session_number
ORDER BY session_number;
```

Show this as a line chart — **improvement over time is the most compelling feature you can show.**

### Addition 4 — Question Quality Table in PostgreSQL
```sql
-- Track which questions perform well
ALTER TABLE questions ADD COLUMN times_used INTEGER DEFAULT 0;
ALTER TABLE questions ADD COLUMN avg_score_received FLOAT DEFAULT 0;
ALTER TABLE questions ADD COLUMN quality_rating FLOAT DEFAULT 5.0;

-- Every time a question is answered, update this
UPDATE questions 
SET times_used = times_used + 1,
    avg_score_received = (avg_score_received + new_score) / 2
WHERE id = question_id;
```

This means your question bank **gets smarter over time** — weak questions get identified and replaced.

### Addition 5 — Professional PDF Report
```python
# services/report_builder.py
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors

def generate_pdf_report(session_id: int, db):
    answers = db.query(Answer).filter(Answer.session_id == session_id).all()
    
    doc = SimpleDocTemplate(f"report_{session_id}.pdf", pagesize=A4)
    elements = []
    
    # Header
    elements.append(Paragraph("HireReady — Interview Performance Report"))
    
    # Score Table
    data = [["Question", "Technical", "Communication", "Overall"]]
    for a in answers:
        data.append([
            a.question_text[:40] + "...",
            f"{a.technical_score}/10",
            f"{a.voice_energy_score}/10", 
            f"{a.overall_score}/10"
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.darkblue),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("GRID", (0,0), (-1,-1), 1, colors.black),
    ]))
    elements.append(table)
    doc.build(elements)
```

---

## Phase 4 — Polish That Recruiters Notice (Days 8-10)

### Add Loading States Everywhere
```javascript
// Every API call should show loading
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
    setLoading(true);
    try {
        const result = await api.submitAudio(sessionId, blob);
        setScore(result);
    } finally {
        setLoading(false);
    }
};

// In JSX
{loading && <p>🔄 Analysing your answer...</p>}
```

### Add Error Boundaries
```javascript
// The ECONNREFUSED error you're seeing needs graceful handling
const handleApiError = (error) => {
    if (error.message.includes("ECONNREFUSED")) {
        return "Backend server is not running. Please start FastAPI.";
    }
    return "Something went wrong. Please try again.";
};
```

---

## Your Complete Priority List

| Priority | Task | Time Needed | Impact |
|---|---|---|---|
| 🔴 1 | Fix Whisper install | 5 mins | Unblocks voice feature |
| 🔴 2 | Migrate interview router to PostgreSQL | 2 hours | Core flow works |
| 🔴 3 | Migrate report builder to PostgreSQL | 1 hour | Reports work |
| 🔴 4 | Connect frontend to backend (api.js) | 4 hours | Everything talks |
| 🟡 5 | Voice recording in Practice Room | 3 hours | Key differentiator |
| 🟡 6 | Adaptive difficulty | 1 hour | Impressive feature |
| 🟡 7 | Keyword highlighting in feedback | 2 hours | Smart feedback |
| 🟢 8 | Progress tracking charts | 2 hours | Shows improvement |
| 🟢 9 | PDF report with ReportLab | 3 hours | Professional output |
| 🟢 10 | Demo video recording | 1 hour | Placement interviews |

---

## The One Thing That Will Impress Everyone

Once everything is connected, record this exact demo flow:

```
1. Upload a real resume (yours)
2. Select "Backend Developer"
3. See skill gap appear
4. Hear a question spoken aloud
5. Answer it by voice for 30 seconds
6. See transcript appear
7. See score with keyword breakdown
8. Download PDF report
```

**That 3-minute demo, working smoothly, is worth more than any feature you add.**
