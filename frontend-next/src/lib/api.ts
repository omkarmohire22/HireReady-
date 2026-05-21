// Use /api/backend/* to proxy to FastAPI — avoids collision with NextAuth's /api/auth/* routes
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/backend";

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const api = {
    // Auth
    login: async (data: any) => {
        // FastAPI OAuth2PasswordRequestForm expects form data, not JSON
        const form = new URLSearchParams();
        form.append("username", data.email);
        form.append("password", data.password);
        
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: form.toString()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Login failed. Please check your credentials.");
        }
        return res.json();
    },
    
    register: async (data: any) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Registration failed. Try a different email.");
        }
        return res.json();
    },

    getMe: async () => {
        const token = getToken();
        if (!token) throw new Error("No token");
        
        const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: {"Authorization": `Bearer ${token}`}
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
    },

    updateMe: async (data: {name?: string, role?: string, avatar_url?: string, resume_skills?: string[], theme?: string}) => {
        const res = await fetch(`${BASE_URL}/auth/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Failed to update profile");
        return res.json();
    },

    uploadAvatar: async (file: File) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${BASE_URL}/user/avatar/upload`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`},
            body: form
        });
        if (!res.ok) throw new Error("Failed to upload avatar");
        return res.json();
    },

    // Resume
    uploadResume: async (file: File) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${BASE_URL}/resume/upload`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`},
            body: form
        });
        if (!res.ok) throw new Error("Failed to upload resume");
        return res.json();
    },

    // Interview
    startSession: async (data: {target_role: string, session_type?: string, difficulty?: string, missing_skills?: string[]}) => {
        const res = await fetch(`${BASE_URL}/interview/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to start interview session.");
        }
        return res.json();
    },
    
    getNextQuestion: async (sessionId: string | number, _retry = true): Promise<any> => {
        try {
            const res = await fetch(`${BASE_URL}/interview/${sessionId}/next`, {
                headers: {"Authorization": `Bearer ${getToken()}`}
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const msg = errBody.detail || "Failed to get question";
                // Retry once on server errors (500+)
                if (_retry && res.status >= 500) {
                    await new Promise(r => setTimeout(r, 1000));
                    return api.getNextQuestion(sessionId, false);
                }
                throw new Error(msg);
            }
            return res.json();
        } catch (err: any) {
            // Retry once on network errors
            if (_retry && err.name !== 'Error') {
                await new Promise(r => setTimeout(r, 1000));
                return api.getNextQuestion(sessionId, false);
            }
            throw err;
        }
    },

    submitAnswer: async (sessionId: string | number, data: {question_id: string, question_text: string, answer_text: string, communication_metrics?: any}) => {
        const res = await fetch(`${BASE_URL}/interview/${sessionId}/answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                session_id: parseInt(sessionId.toString()),
                question_id: data.question_id,
                question_text: data.question_text,
                answer_text: data.answer_text,
                communication_metrics: data.communication_metrics
            })
        });
        if (!res.ok) throw new Error("Failed to submit answer");
        return res.json();
    },
    
    endSession: async (sessionId: string | number) => {
        const res = await fetch(`${BASE_URL}/interview/${sessionId}/end`, {
            method: "PUT",
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to end session");
        return res.json();
    },

    // Report & Roadmap
    generateReport: async (sessionId: string | number) => {
        const res = await fetch(`${BASE_URL}/report/generate/${sessionId}`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to generate report");
        return res.json();
    },
    
    getReport: async (sessionId: string | number) => {
        const res = await fetch(`${BASE_URL}/report/${sessionId}`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch report");
        return res.json();
    },

    getRoadmap: async (sessionId: string | number) => {
        const res = await fetch(`${BASE_URL}/roadmap/${sessionId}`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch roadmap");
        return res.json();
    },

    // User / Dashboard
    getDashboardStats: async () => {
        const res = await fetch(`${BASE_URL}/user/dashboard`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        return res.json();
    },

    getUserProgress: async () => {
        const res = await fetch(`${BASE_URL}/user/progress`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch user progress stats");
        return res.json();
    },

    getRecentSessions: async () => {
        const res = await fetch(`${BASE_URL}/user/sessions/recent`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch recent sessions");
        return res.json();
    },

    getAllSessions: async (skip = 0, limit = 50) => {
        const res = await fetch(`${BASE_URL}/user/sessions?skip=${skip}&limit=${limit}`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch session history");
        return res.json();
    },

    upgradePlan: async () => {
        // OLD mock endpoint logic
        const res = await fetch(`${BASE_URL}/user/upgrade`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to upgrade plan");
        return res.json();
    },

    createCheckoutSession: async () => {
        // REAL Stripe integration
        const res = await fetch(`${BASE_URL}/stripe/create-checkout-session`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to create checkout session");
        return res.json();
    },

    matchSkills: async (data: {target_role?: string, job_description?: string}) => {
        const res = await fetch(`${BASE_URL}/resume/match`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to calculate skill match alignment.");
        }
        return res.json();
    },

    editResumeSection: async (data: {section: string, section_text: string, target_role: string, skill_gaps: string[]}) => {
        const res = await fetch(`${BASE_URL}/resume/edit`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || "Failed to optimize resume section.");
        }
        return res.json();
    },

    getNotifications: async () => {
        const res = await fetch(`${BASE_URL}/user/notifications`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
    },

    markNotificationRead: async (notifId: number) => {
        const res = await fetch(`${BASE_URL}/user/notifications/${notifId}/read`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to mark notification as read");
        return res.json();
    },

    markAllNotificationsRead: async () => {
        const res = await fetch(`${BASE_URL}/user/notifications/read-all`, {
            method: "POST",
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to mark all notifications as read");
        return res.json();
    }
};
