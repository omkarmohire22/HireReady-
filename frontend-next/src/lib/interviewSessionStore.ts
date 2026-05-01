import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionQuestion {
  id: string;
  text: string;
  skill: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  asked: boolean;
}

export interface QuestionScore {
  questionId: string;
  questionText: string;
  technicalScore: number;
  transcript: string;
  metrics: {
    wpm: number;
    fillerWords: number;
    longPauses: number;
    voiceEnergy: number;
    confidenceTone: number;
  };
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  resumeId: string;
  role: string;
  resumeSkills: string[];
  missingSkills: string[];
  questions: SessionQuestion[];
  currentQuestionIndex: number;
  scores: QuestionScore[];
  status: 'setup' | 'in-progress' | 'completed';
  startedAt: number;
  completedAt?: number;
}

interface InterviewSessionState {
  session: InterviewSession | null;
  
  // Session Management
  startSession: (data: Omit<InterviewSession, 'status' | 'currentQuestionIndex' | 'scores' | 'startedAt'>) => void;
  endSession: () => void;
  clearSession: () => void;
  
  // Question Navigation
  nextQuestion: () => void;
  previousQuestion: () => void;
  
  // Scoring
  addScore: (score: QuestionScore) => void;
  getSessionScore: () => number;
  
  // Status
  updateStatus: (status: 'setup' | 'in-progress' | 'completed') => void;
}

export const useInterviewSessionStore = create<InterviewSessionState>()(
  persist(
    (set, get) => ({
      session: null,

      startSession: (data) =>
        set({
          session: {
            ...data,
            status: 'setup',
            currentQuestionIndex: 0,
            scores: [],
            startedAt: Date.now(),
          },
        }),

      endSession: () =>
        set((state) => {
          if (!state.session) return state;
          return {
            session: {
              ...state.session,
              status: 'completed',
              completedAt: Date.now(),
            },
          };
        }),

      clearSession: () => set({ session: null }),

      nextQuestion: () =>
        set((state) => {
          if (!state.session) return state;
          const nextIndex = state.session.currentQuestionIndex + 1;
          if (nextIndex < state.session.questions.length) {
            return {
              session: {
                ...state.session,
                currentQuestionIndex: nextIndex,
              },
            };
          }
          return state;
        }),

      previousQuestion: () =>
        set((state) => {
          if (!state.session) return state;
          const prevIndex = state.session.currentQuestionIndex - 1;
          if (prevIndex >= 0) {
            return {
              session: {
                ...state.session,
                currentQuestionIndex: prevIndex,
              },
            };
          }
          return state;
        }),

      addScore: (score) =>
        set((state) => {
          if (!state.session) return state;
          return {
            session: {
              ...state.session,
              scores: [...state.session.scores, score],
            },
          };
        }),

      getSessionScore: () => {
        const session = get().session;
        if (!session || session.scores.length === 0) return 0;

        const avgTechnical = session.scores.reduce((sum, s) => sum + s.technicalScore, 0) / session.scores.length;
        const avgCommunication =
          session.scores.reduce((sum, s) => {
            const wpmScore = s.metrics.wpm >= 120 && s.metrics.wpm <= 150 ? 10 : s.metrics.wpm >= 100 && s.metrics.wpm <= 160 ? 7 : 5;
            const fillerScore = s.metrics.fillerWords <= 2 ? 10 : s.metrics.fillerWords <= 5 ? 7 : 5;
            const pauseScore = s.metrics.longPauses === 0 ? 10 : s.metrics.longPauses <= 2 ? 7 : 5;
            const energyScore = s.metrics.voiceEnergy >= 70 ? 10 : s.metrics.voiceEnergy >= 50 ? 7 : 5;
            return sum + (wpmScore + fillerScore + pauseScore + energyScore) / 4;
          }, 0) / session.scores.length;
        const avgConfidence = session.scores.reduce((sum, s) => sum + s.metrics.confidenceTone, 0) / session.scores.length;

        return Math.round((avgTechnical * 0.5 + avgCommunication * 0.3 + avgConfidence * 0.2) / 10 * 100);
      },

      updateStatus: (status) =>
        set((state) => {
          if (!state.session) return state;
          return {
            session: {
              ...state.session,
              status,
            },
          };
        }),
    }),
    { name: 'hireready-interview-session' }
  )
);
