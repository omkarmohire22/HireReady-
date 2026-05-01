'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  questionText: string;
  onPlaybackComplete?: () => void;
  autoPlay?: boolean;
}

const C = {
  primary: '#6C47FF',
  accent: '#00E5FF',
  success: '#00D97E',
};

export default function AudioPlayer({ 
  audioUrl, 
  questionText, 
  onPlaybackComplete,
  autoPlay = true 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onPlaybackComplete?.();
    };
    const handleError = () => {
      setError('Failed to load audio');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', () => setIsLoading(false));

    if (autoPlay) {
      setIsLoading(true);
      audio.play().catch(() => {
        setError('Could not auto-play audio');
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', () => setIsLoading(false));
    };
  }, [audioUrl, autoPlay, onPlaybackComplete]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Playback error');
      console.error(err);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: '20px',
      borderRadius: 12,
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
    }}>
      <audio ref={audioRef} src={audioUrl} />

      {/* Question Text */}
      <div style={{
        padding: '16px',
        borderRadius: 8,
        background: 'var(--elevated)',
        border: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Volume2 size={14} color={C.primary} />
          Interview Question
        </div>
        <p style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--text-high)',
          margin: 0,
        }}>
          "{questionText}"
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 6,
          background: '#FF4D6A15',
          border: '1px solid #FF4D6A33',
          color: '#FF4D6A',
          fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {/* Player Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={togglePlayPause}
          disabled={isLoading || !audioUrl}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            border: 'none',
            color: '#fff',
            cursor: isLoading || !audioUrl ? 'not-allowed' : 'pointer',
            opacity: isLoading || !audioUrl ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && audioUrl) {
              (e.currentTarget as any).style.transform = 'scale(1.05)';
              (e.currentTarget as any).style.boxShadow = `0 0 20px rgba(108,71,255,0.4)`;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as any).style.transform = 'scale(1)';
            (e.currentTarget as any).style.boxShadow = 'none';
          }}
        >
          {isLoading ? (
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              animation: 'spin 1s linear infinite',
            }} />
          ) : isPlaying ? (
            <Pause size={20} fill="#fff" />
          ) : (
            <Play size={20} fill="#fff" style={{ marginLeft: 2 }} />
          )}
        </button>

        <button
          onClick={handleReplay}
          disabled={isLoading || !audioUrl}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 6,
            background: 'var(--elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-high)',
            cursor: isLoading || !audioUrl ? 'not-allowed' : 'pointer',
            opacity: isLoading || !audioUrl ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isLoading && audioUrl) {
              (e.currentTarget as any).style.background = 'var(--border)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as any).style.background = 'var(--elevated)';
          }}
        >
          <RotateCcw size={16} />
        </button>

        <div style={{
          flex: 1,
          minWidth: 150,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28 }}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressClick}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: 'var(--border)',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(currentTime / duration) * 100}%`,
                background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                borderRadius: 2,
                transition: 'width 100ms linear',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Status Text */}
      {isPlaying && !isLoading && (
        <div style={{
          fontSize: 12,
          color: C.success,
          textAlign: 'center',
          fontWeight: 600,
        }}>
          ▶ Now playing...
        </div>
      )}
    </div>
  );
}
