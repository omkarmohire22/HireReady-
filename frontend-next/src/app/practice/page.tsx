'use client';
import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import MicTest from '@/components/practice/MicTest';
import ResumeUpload from '@/components/practice/ResumeUpload';
import SkillAlignment from '@/components/practice/SkillAlignment';
import InterviewPanel from '@/components/practice/InterviewPanel';
import { useRouter } from 'next/navigation';
import { useInterviewSessionStore } from '@/lib/interviewSessionStore';

const C = {
  primary: '#6C47FF',
  success: '#00D97E',
};

const STEPS = ['Mic Check', 'Resume', 'Role & Setup', 'Live Interview'];

export default function PracticePage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const { session } = useInterviewSessionStore();

  const handleEnd = async () => {
    const sessionId = session?.id;
    try {
      if (sessionId) {
        const token = localStorage.getItem('token');
        await fetch(`/api/interview/${sessionId}/end`, {
          method: 'PUT',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }
    } catch (e) {
      console.warn('End session error (non-fatal):', e);
    }
    router.push(sessionId ? `/report/${sessionId}` : '/report/latest');
  };

  if (step === 4) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <InterviewPanel onEnd={handleEnd} />
      </div>
    );
  }


  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.3s ease' }} data-aos="fade-up">
      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 48 }} data-aos="fade-up" data-aos-delay={80}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step > i + 1 ? C.success : step === i + 1 ? C.primary : 'var(--elevated)',
                border: `2px solid ${step >= i + 1 ? (step > i + 1 ? C.success : C.primary) : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: step >= i + 1 ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${step === i + 1 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-[20px] sm:w-[45px] h-[2px] mx-2 sm:mx-3 transition-colors duration-300" style={{ background: step > i + 1 ? C.success : 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div data-aos="fade-up" data-aos-delay={120}>
          <MicTest onNext={() => setStep(2)} />
        </div>
      )}
      {step === 2 && (
        <div data-aos="fade-up" data-aos-delay={120}>
          <ResumeUpload onNext={() => setStep(3)} />
        </div>
      )}
      {step === 3 && (
        <div data-aos="fade-up" data-aos-delay={120}>
          <SkillAlignment onNext={() => setStep(4)} onBack={() => setStep(2)} />
        </div>
      )}
    </div>
  );
}
