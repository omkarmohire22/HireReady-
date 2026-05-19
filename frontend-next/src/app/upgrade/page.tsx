'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, ArrowRight, Loader2, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const C = {
  primary: 'var(--teal)',
  accent:  'var(--purple)',
  success: 'var(--teal)',
  border:  'var(--border)',
};

export default function UpgradePage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await api.createCheckoutSession();
      if (res.url) {
        window.location.href = res.url;
      } else {
        alert("Could not generate checkout link.");
      }
    } catch (e: any) {
      alert(e.message || "Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', animation: 'fadeIn 0.4s ease' }}>
      
      {/* Back to dashboard */}
      <div style={{ width: '100%', maxWidth: 1000, marginBottom: 40 }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 48 }} className="fade-up">
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12, fontWeight: 600 }}>Pro Access</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
          Level up your{' '}
          <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Interview Prep</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Unlimited mock interviews, advanced AI analytics, and personalized coaching.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'center', width: '100%', maxWidth: 1000 }}>
        
        {/* Basic Plan */}
        <motion.div 
          className="card fade-up-1"
          style={{ flex: '1 1 300px', maxWidth: 450, padding: 40, border: '1px solid var(--border)', position: 'relative' }}
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Basic</h3>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Great for getting started</div>
          <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: 24 }}>Free</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}><Check size={18} color="var(--text-muted)" /> 3 Mock Interviews / month</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}><Check size={18} color="var(--text-muted)" /> Basic text feedback</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text-muted)' }}><Check size={18} opacity={0.3} /> No Audio/Video processing</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text-muted)' }}><Check size={18} opacity={0.3} /> Standard wait times</div>
          </div>
          
          <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled>
            Current Plan
          </button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div 
          className="card fade-up-2"
          style={{ flex: '1 1 300px', maxWidth: 450, padding: 40, border: `2px solid ${C.primary}`, background: `linear-gradient(180deg, ${C.primary}05 0%, transparent 100%)`, position: 'relative' }}
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} fill="#fff" /> MOST POPULAR
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: C.primary }}>HireReady Pro</h3>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Everything you need to succeed</div>
          <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            $19 <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>/ month</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}><Check size={18} color={C.primary} /> <strong style={{ fontWeight: 600 }}>Unlimited</strong> Mock Interviews</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}><Check size={18} color={C.primary} /> Advanced Real-time Audio Analysis</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}><Check size={18} color={C.primary} /> In-depth Communication Reports</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}><Check size={18} color={C.primary} /> Priority AI processing speed</div>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, opacity: isProcessing ? 0.8 : 1 }}
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 size={18} className="animate-spin" /> Processing Securely...</>
            ) : (
              <><ShieldCheck size={18} /> Upgrade to Pro</>
            )}
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
            Secure checkout powered by Stripe. Cancel anytime.
          </div>
        </motion.div>

      </div>
    </div>
  );
}
