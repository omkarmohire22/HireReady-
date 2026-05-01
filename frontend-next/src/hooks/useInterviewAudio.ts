'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export type InterviewState = 'AI_SPEAKING' | 'USER_ANSWERING' | 'EVALUATING';

export function useInterviewAudio(questionText: string) {
  const [sessionState, setSessionState] = useState<InterviewState>('AI_SPEAKING');
  const [rmsLevel, setRmsLevel] = useState(0);
  const [currentWPM, setCurrentWPM] = useState(130);
  const [fftData, setFftData] = useState<Uint8Array>(new Uint8Array(64));
  
  // Real-time transcription simulation
  const [transcription, setTranscription] = useState<string>('');
  const [isSilent, setIsSilent] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Global Theme Accent
  useEffect(() => {
    const root = document.documentElement;
    if (sessionState === 'AI_SPEAKING') root.style.setProperty('--accent', '#6366F1');
    else if (sessionState === 'USER_ANSWERING') root.style.setProperty('--accent', '#06B6D4');
    else if (sessionState === 'EVALUATING') root.style.setProperty('--accent', '#F59E0B');
  }, [sessionState]);

  // AI TTS Speaking Simulation
  const startSpeaking = useCallback(() => {
    setSessionState('AI_SPEAKING');
    setTranscription('');
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 1.0;
      utterance.onend = () => {
        setSessionState('USER_ANSWERING');
        startListening();
      };
      utterance.onerror = () => {
        setSessionState('USER_ANSWERING');
        startListening();
      }
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setSessionState('USER_ANSWERING');
        startListening();
      }, 3000);
    }
  }, [questionText]);

  // Start Mic Listening
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const tCtx = new AudioContextCtor();
      audioCtxRef.current = tCtx;
      
      const source = tCtx.createMediaStreamSource(stream);
      const analyser = tCtx.createAnalyser();
      analyser.fftSize = 128; // gives 64 frequency bins
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const emptyData = new Uint8Array(bufferLength);

      let lastTranscribeTime = Date.now();
      const mockWords = "So, to set up a pipeline, I would probably use GitHub Actions. First I'd create a YAML workflow file that triggers on pushes to the main branch...".split(" ");
      let wordIndex = 0;

      const updateData = () => {
        if (!analyserRef.current || sessionState !== 'USER_ANSWERING') return;
        analyserRef.current.getByteFrequencyData(emptyData);
        
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < emptyData.length; i++) {
          const val = emptyData[i] / 255;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / emptyData.length) * 100;
        
        setFftData(new Uint8Array(emptyData));
        setRmsLevel(rms);
        
        // Handle Silence Decay + Trigger EVALUATING
        if (rms > 5) {
          setIsSilent(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            setIsSilent(true);
            setTimeout(() => setSessionState('EVALUATING'), 1000); // Trigger evaluating after silence
          }, 1500); 
        }

        // Mock Transcription progress
        if (rms > 10 && Date.now() - lastTranscribeTime > 300 && wordIndex < mockWords.length) {
          setTranscription(prev => prev + (prev ? ' ' : '') + mockWords[wordIndex]);
          wordIndex++;
          lastTranscribeTime = Date.now();
          
          // vary WPM slightly every few words
          if (wordIndex % 4 === 0) {
             setCurrentWPM(120 + Math.floor(Math.random()*25));
          }
        }

        rafRef.current = requestAnimationFrame(updateData);
      };

      updateData();
    } catch (err) {
      console.warn("Mic access denied or unavailable", err);
      // Fallback
    }
  };

  const stopSession = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
    setRmsLevel(0);
    setFftData(new Uint8Array(64));
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

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
    startSpeaking,
    hasMicAccess: !!streamRef.current
  };
}
