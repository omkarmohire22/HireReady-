'use client';
import React from 'react';
import { BarChart3, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface CommunicationMetrics {
  wpm: number;
  fillerWords: number;
  longPauses: number;
  voiceEnergy: number;
  confidenceTone: number;
}

interface CommunicationFeedbackProps {
  metrics: CommunicationMetrics;
}

const C = {
  primary: '#6C47FF',
  accent: '#00E5FF',
  success: '#00D97E',
  warning: '#FFB547',
  error: '#FF4D6A',
};

export default function CommunicationFeedback({ metrics }: CommunicationFeedbackProps) {
  const getWpmStatus = (wpm: number) => {
    if (wpm >= 120 && wpm <= 150) return { color: C.success, label: 'Ideal', icon: '✓' };
    if (wpm < 120) return { color: C.warning, label: 'Slow', icon: '↓' };
    return { color: C.error, label: 'Fast', icon: '↑' };
  };

  const getFillerStatus = (count: number) => {
    if (count <= 2) return { color: C.success, label: 'Excellent', icon: '✓' };
    if (count <= 5) return { color: C.warning, label: 'Good', icon: '~' };
    return { color: C.error, label: 'Needs work', icon: '!' };
  };

  const getEnergyStatus = (energy: number) => {
    if (energy >= 70) return { color: C.success, label: 'Strong', icon: '✓' };
    if (energy >= 50) return { color: C.warning, label: 'Moderate', icon: '~' };
    return { color: C.error, label: 'Low', icon: '↓' };
  };

  const getToneStatus = (tone: number) => {
    if (tone >= 7) return { color: C.success, label: 'Confident', icon: '✓' };
    if (tone >= 5) return { color: C.warning, label: 'Neutral', icon: '~' };
    return { color: C.error, label: 'Hesitant', icon: '!' };
  };

  const wpmStatus = getWpmStatus(metrics.wpm);
  const fillerStatus = getFillerStatus(metrics.fillerWords);
  const energyStatus = getEnergyStatus(metrics.voiceEnergy);
  const toneStatus = getToneStatus(metrics.confidenceTone);

  const MetricCard = ({ 
    label, 
    value, 
    unit, 
    status,
    ideal,
    progress = true,
  }: any) => (
    <div style={{
      flex: 1,
      minWidth: 140,
      padding: '16px',
      borderRadius: 10,
      background: 'var(--card-bg)',
      border: `1px solid var(--border)`,
      borderTop: `3px solid ${status.color}`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: 0.5,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: 10,
          color: status.color,
          fontWeight: 700,
          background: `${status.color}15`,
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {status.icon} {status.label}
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontWeight: 800,
          fontSize: 20,
          color: status.color,
        }}>
          {value}
        </span>
        <span style={{
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          {unit}
        </span>
      </div>

      {ideal && (
        <div style={{
          fontSize: 11,
          color: 'var(--text-subtle)',
          marginBottom: 10,
        }}>
          Ideal: {ideal}
        </div>
      )}

      {progress && (
        <div style={{
          height: 4,
          background: 'var(--elevated)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(value / (unit === 'WPM' ? 200 : unit === '%' ? 100 : 20), 1) * 100}%`,
              background: status.color,
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
      }}>
        <BarChart3 size={20} color={C.primary} />
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          margin: 0,
          color: 'var(--text-high)',
        }}>
          Communication Quality
        </h3>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}>
        <MetricCard
          label="Speaking Pace"
          value={Math.round(metrics.wpm)}
          unit="WPM"
          status={wpmStatus}
          ideal="120-150"
        />
        <MetricCard
          label="Filler Words"
          value={metrics.fillerWords}
          unit="count"
          status={fillerStatus}
          ideal="≤2"
          progress={false}
        />
        <MetricCard
          label="Long Pauses"
          value={metrics.longPauses}
          unit="detected"
          status={{
            color: metrics.longPauses === 0 ? C.success : metrics.longPauses <= 2 ? C.warning : C.error,
            label: metrics.longPauses === 0 ? 'None' : 'Some',
            icon: metrics.longPauses === 0 ? '✓' : '!',
          }}
          progress={false}
        />
        <MetricCard
          label="Voice Energy"
          value={Math.round(metrics.voiceEnergy)}
          unit="%"
          status={energyStatus}
          ideal="70%+"
        />
        <MetricCard
          label="Confidence Tone"
          value={Math.round(metrics.confidenceTone * 10) / 10}
          unit="/10"
          status={toneStatus}
          ideal="7+"
          progress={false}
        />
      </div>

      {/* Tips Section */}
      <div style={{
        padding: '16px',
        borderRadius: 10,
        background: `${C.warning}10`,
        border: `1px solid ${C.warning}30`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}>
          <Zap size={16} color={C.warning} />
          <span style={{
            fontWeight: 700,
            color: C.warning,
            fontSize: 14,
          }}>
            Tips for Improvement
          </span>
        </div>

        <ul style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          paddingLeft: 24,
          lineHeight: 1.7,
          margin: 0,
        }}>
          {metrics.wpm < 120 && (
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: C.warning, fontWeight: 600 }}>Speaking pace:</span> Increase speed slightly (120-150 WPM) to engage the interviewer
            </li>
          )}
          {metrics.wpm > 150 && (
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: C.warning, fontWeight: 600 }}>Speaking pace:</span> Slow down to let interviewer take notes
            </li>
          )}
          {metrics.fillerWords > 5 && (
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: C.warning, fontWeight: 600 }}>Filler words:</span> Pause instead of saying "um", "uh", or "like"
            </li>
          )}
          {metrics.longPauses > 2 && (
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: C.warning, fontWeight: 600 }}>Pauses:</span> Practice structured answers to reduce hesitation
            </li>
          )}
          {metrics.voiceEnergy < 50 && (
            <li style={{ marginBottom: 8 }}>
              <span style={{ color: C.warning, fontWeight: 600 }}>Voice energy:</span> Speak with more confidence and energy
            </li>
          )}
          {metrics.confidenceTone < 6 && (
            <li>
              <span style={{ color: C.warning, fontWeight: 600 }}>Tone:</span> Work on sounding more definitive and confident
            </li>
          )}
          {metrics.wpm >= 120 && metrics.wpm <= 150 && metrics.fillerWords <= 2 && metrics.voiceEnergy >= 70 && (
            <li style={{ color: C.success, fontWeight: 600 }}>
              ✓ Excellent communication! Keep it up.
            </li>
          )}
        </ul>
      </div>

      {/* Summary Score */}
      <div style={{
        padding: '14px',
        borderRadius: 8,
        background: 'var(--elevated)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            Communication Score
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-high)',
          }}>
            {Math.round(
              (metrics.wpm >= 120 && metrics.wpm <= 150 ? 10 : metrics.wpm >= 100 && metrics.wpm <= 160 ? 7 : 5) * 0.25 +
              (metrics.fillerWords <= 2 ? 10 : metrics.fillerWords <= 5 ? 7 : 5) * 0.25 +
              (metrics.longPauses === 0 ? 10 : metrics.longPauses <= 2 ? 7 : 5) * 0.25 +
              metrics.confidenceTone * 0.25
            )} / 100
          </div>
        </div>
        <CheckCircle2 size={32} color={C.success} />
      </div>
    </div>
  );
}
