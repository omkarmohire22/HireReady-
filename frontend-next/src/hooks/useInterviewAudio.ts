'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export type InterviewState = 'AI_SPEAKING' | 'USER_ANSWERING' | 'EVALUATING';

export interface VoiceAnalysis {
  wpm?: number;
  filler_count?: number;
  confidence_score?: number;
  pause_count?: number;
  energy_consistency_score?: number;
  filler_words_used?: string[];
}

export function useInterviewAudio(questionText: string, paused: boolean = false) {
  const [sessionState, setSessionState] = useState<InterviewState>('AI_SPEAKING');
  const [rmsLevel, setRmsLevel] = useState(0);
  const [currentWPM, setCurrentWPM] = useState(130);
  const [fftData, setFftData] = useState<Uint8Array>(new Uint8Array(64));
  const [transcription, setTranscription] = useState<string>('');
  const [isSilent, setIsSilent] = useState(false);
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis>({});
  const [isRecordingSaved, setIsRecordingSaved] = useState(false);

  const transcriptRef = useRef<string>('');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const savedBlobRef = useRef<Blob | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSpeakingTextRef = useRef<string | null>(null);

  // Sync accent color to session state
  useEffect(() => {
    const root = document.documentElement;
    if (sessionState === 'AI_SPEAKING') root.style.setProperty('--accent', '#6366F1');
    else if (sessionState === 'USER_ANSWERING') root.style.setProperty('--accent', '#06B6D4');
    else if (sessionState === 'EVALUATING') root.style.setProperty('--accent', '#F59E0B');
  }, [sessionState]);

  // ── Step 1: AI speaks the question ──────────────────────────────────────
  const startSpeaking = useCallback(async () => {
    // If we are already speaking or fetching this exact text, avoid double-firing
    if (currentSpeakingTextRef.current === questionText) {
      return;
    }
    currentSpeakingTextRef.current = questionText;

    setSessionState('AI_SPEAKING');
    setTranscription('');
    transcriptRef.current = '';
    setVoiceAnalysis({});
    setIsRecordingSaved(false);

    // Cancel any active browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop and clear any previously playing audio instance to avoid dual playbacks
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
      } catch (e) {}
      activeAudioRef.current = null;
    }

    const speakViaBrowser = () => {
      // Abort browser TTS if our text shifted during the process
      if (currentSpeakingTextRef.current !== questionText) return;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(questionText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => {
          if (currentSpeakingTextRef.current === questionText) {
            setSessionState('USER_ANSWERING');
            startListening();
          }
        };
        utterance.onerror = () => {
          if (currentSpeakingTextRef.current === questionText) {
            setSessionState('USER_ANSWERING');
            startListening();
          }
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          if (currentSpeakingTextRef.current === questionText) {
            setSessionState('USER_ANSWERING');
            startListening();
          }
        }, 3500);
      }
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: questionText }),
        signal: AbortSignal.timeout(10000),
      });

      // Abort if questionText changed during network roundtrip
      if (currentSpeakingTextRef.current !== questionText) {
        return;
      }

      if (!response.ok) throw new Error(`TTS ${response.status}`);

      const blob = await response.blob();
      
      // Abort if questionText changed during blob parsing
      if (currentSpeakingTextRef.current !== questionText) {
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
        if (currentSpeakingTextRef.current === questionText) {
          setSessionState('USER_ANSWERING');
          startListening();
        }
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
        if (currentSpeakingTextRef.current === questionText) {
          speakViaBrowser(); // fallback
        }
      };
      await audio.play();
    } catch {
      // Backend TTS unavailable — fall back to browser speech synthesis
      if (currentSpeakingTextRef.current === questionText) {
        speakViaBrowser();
      }
    }
  }, [questionText]);

  // ── Step 2: Mic listening + live waveform ───────────────────────────────
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const tCtx = new AudioContextCtor();
      audioCtxRef.current = tCtx;

      const source = tCtx.createMediaStreamSource(stream);
      const analyser = tCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Setup MediaRecorder for real STT + save
      audioChunksRef.current = [];
      try {
        const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          savedBlobRef.current = blob;
          await sendForTranscription(blob);
        };
        recorder.start();
      } catch (e) {
        console.warn('MediaRecorder unavailable:', e);
      }

      // Initialize Web Speech API for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          const text = currentTranscript.trim();
          setTranscription(text);
          transcriptRef.current = text;
        };
        
        recognition.onend = () => {
          // Auto-restart if user is still actively speaking and microphone stream is alive
          if (streamRef.current && recognitionRef.current && !paused) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // ignore if already started
            }
          }
        };
        
        recognition.onerror = (e: any) => console.warn('Speech recognition error', e);
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition failed to start', e);
        }
      }

      const updateData = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 255;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length) * 100;

        setFftData(new Uint8Array(dataArray));
        setRmsLevel(rms);

        if (rms > 5) {
          setIsSilent(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            setIsSilent(true);
            setSessionState('EVALUATING');
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }, 2000);
        }
        rafRef.current = requestAnimationFrame(updateData);
      };
      updateData();
    } catch (err) {
      console.warn('Mic access denied:', err);
      setTranscription('Microphone not available — type your answer instead.');
    }
  };

  // ── Step 3: Send to Whisper STT + VADER analysis ────────────────────────
  const sendForTranscription = async (blob: Blob) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio_file', blob, 'recording.webm');
      // Pass the Web Speech API transcript to bypass the slow Whisper model
      formData.append('transcript', transcriptRef.current);

      const res = await fetch('/api/voice/analyze', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Analyze failed');
      const data = await res.json();
      if (data.transcript) {
        setTranscription(data.transcript);
      }
      if (data.analysis?.metrics) {
        setCurrentWPM(data.analysis.metrics.wpm || 130);
        setVoiceAnalysis({
          wpm: data.analysis.metrics.wpm,
          filler_count: data.analysis.metrics.filler_word_count,
          confidence_score: data.analysis.metrics.tone_confidence_score,
          pause_count: data.analysis.metrics.long_pauses,
          energy_consistency_score: data.analysis.metrics.energy_consistency_score,
          filler_words_used: data.analysis.metrics.filler_words_used,
        });
      }
    } catch (err) {
      console.warn('Backend voice analysis failed. Falling back to browser transcript.', err);
      // Whisper/Backend unavailable — preserve the real-time browser Web Speech API transcription as a fallback
      if (transcriptRef.current) {
        setTranscription(transcriptRef.current);
      } else {
        setTranscription('No verbal response detected.');
      }
    }
  };

  // ── Manual: Save recording to user profile ───────────────────────────────
  const saveRecording = useCallback(async (sessionId: string, questionId: string) => {
    if (!savedBlobRef.current) return false;
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio_file', savedBlobRef.current, 'recording.webm');
      const res = await fetch(
        `/api/voice/save-recording?session_id=${sessionId}&question_id=${questionId}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (res.ok) {
        setIsRecordingSaved(true);
        return true;
      }
    } catch {
      /* silent */
    }
    return false;
  }, []);

  // ── Manual: Download recording locally ──────────────────────────────────
  const downloadRecording = useCallback(() => {
    if (!savedBlobRef.current) return;
    const url = URL.createObjectURL(savedBlobRef.current);
    const a = document.createElement('a');
    a.href = url;
    a.download = `answer_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const stopSession = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    // Stop active audio playbacks to prevent leaking overlap sounds
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = '';
      } catch (e) {}
      activeAudioRef.current = null;
    }
    currentSpeakingTextRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    setRmsLevel(0);
    setFftData(new Uint8Array(64));
  }, []);

  // Synchronise paused state changes with audio playing and speech recording
  useEffect(() => {
    if (paused) {
      if (activeAudioRef.current && !activeAudioRef.current.paused) {
        try { activeAudioRef.current.pause(); } catch (e) {}
      }
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        try { window.speechSynthesis.pause(); } catch (e) {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.pause(); } catch (e) {}
      }
    } else {
      if (activeAudioRef.current && activeAudioRef.current.paused && activeAudioRef.current.src) {
        try { activeAudioRef.current.play().catch(() => {}); } catch (e) {}
      }
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch (e) {}
      }
      if (sessionState === 'USER_ANSWERING') {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
          try { mediaRecorderRef.current.resume(); } catch (e) {}
        }
      }
    }
  }, [paused, sessionState]);

  useEffect(() => () => { stopSession(); }, [stopSession]);

  return {
    sessionState,
    isSpeaking: sessionState === 'AI_SPEAKING',
    isListening: sessionState === 'USER_ANSWERING',
    isEvaluating: sessionState === 'EVALUATING',
    currentWPM,
    rmsLevel,
    fftData,
    transcription,
    isSilent,
    voiceAnalysis,
    isRecordingSaved,
    startSpeaking,
    stopSession,
    saveRecording,
    downloadRecording,
    hasMicAccess: !!streamRef.current,
  };
}
