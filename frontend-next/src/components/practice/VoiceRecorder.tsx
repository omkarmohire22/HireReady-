'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Square, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isLoading?: boolean;
  onError?: (error: string) => void;
}

const C = {
  primary: '#6C47FF',
  accent: '#00E5FF',
  success: '#00D97E',
  error: '#FF4D6A',
  warning: '#FFB547',
};

export default function VoiceRecorder({ onRecordingComplete, isLoading = false, onError }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const reduceMotion = useReducedMotion();
  const hoverLift = reduceMotion ? undefined : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? undefined : { scale: 0.98 };
  
  const recordingRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      setPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      recordingRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stopAllStreams();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (error) {
      setPermissionDenied(true);
      const msg = 'Please enable microphone access in browser settings';
      onError?.(msg);
      console.error('Microphone error:', error);
    }
  };

  const stopRecording = () => {
    if (recordingRef.current && isRecording) {
      recordingRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    stopAllStreams();
    setRecordingTime(0);
    audioChunksRef.current = [];
    setAudioBlob(null);
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      resetRecording();
    }
  };

  const stopAllStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      padding: '24px',
      borderRadius: 12,
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
    }}>
      {/* Error Message */}
      {permissionDenied && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 8,
          background: `${C.error}15`,
          border: `1px solid ${C.error}33`,
          width: '100%',
        }}>
          <AlertCircle size={16} color={C.error} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ color: C.error, fontSize: 13 }}>
            <strong>Microphone access denied.</strong> Please enable microphone in your browser settings and reload the page.
          </div>
        </div>
      )}

      {/* Recording Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        fontSize: 14,
        color: isRecording ? C.error : 'var(--text-muted)',
      }}>
        {isRecording && (
          <>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: C.error,
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ fontWeight: 600 }}>Recording...</span>
          </>
        )}
        {!isRecording && audioBlob === null && recordingTime === 0 && (
          <>
            <Mic size={16} color={C.primary} />
            <span>Your answer will be recorded</span>
          </>
        )}
        {!isRecording && audioBlob && (
          <>
            <CheckCircle2 size={16} color={C.success} />
            <span style={{ color: C.success }}>Ready to submit</span>
          </>
        )}
        {isRecording && (
          <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: C.error }}>
            {formatTime(recordingTime)}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
        {!isRecording ? (
          <motion.button
            onClick={startRecording}
            disabled={isLoading || permissionDenied}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: isLoading || permissionDenied ? 'not-allowed' : 'pointer',
              opacity: isLoading || permissionDenied ? 0.6 : 1,
              transition: 'all 0.2s',
              fontSize: 14,
            }}
            whileHover={isLoading || permissionDenied ? undefined : hoverLift}
            whileTap={isLoading || permissionDenied ? undefined : tapDown}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <Mic size={16} /> Start Speaking
          </motion.button>
        ) : (
          <motion.button
            onClick={stopRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              background: C.error,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: 14,
            }}
            whileHover={hoverLift}
            whileTap={tapDown}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <Square size={16} /> Stop Recording
          </motion.button>
        )}

        {audioBlob && !isRecording && (
          <>
            <motion.button
              onClick={resetRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'var(--elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text-high)',
                transition: 'all 0.2s',
                fontSize: 14,
              }}
              whileHover={hoverLift}
              whileTap={tapDown}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <RotateCcw size={16} /> Re-record
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 24px',
                background: C.success,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s',
                fontSize: 14,
              }}
              whileHover={isLoading ? undefined : hoverLift}
              whileTap={isLoading ? undefined : tapDown}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <CheckCircle2 size={16} /> {isLoading ? 'Analyzing...' : 'Submit Answer'}
            </motion.button>
          </>
        )}
      </div>

      {/* Recording Time Indicator */}
      {recordingTime > 0 && recordingTime < 5 && !audioBlob && (
        <div style={{ fontSize: 12, color: C.warning, fontWeight: 600 }}>
          Minimum 5 seconds required • {5 - recordingTime}s remaining
        </div>
      )}
    </div>
  );
}
