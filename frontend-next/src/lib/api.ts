const BASE_URL = "http://localhost:8000/api";

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
        if (!res.ok) throw new Error("Login failed");
        return res.json();
    },
    
    register: async (data: any) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error("Registration failed");
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
        if (!res.ok) throw new Error("Failed to start session");
        return res.json();
    },
    
    getNextQuestion: async (sessionId: string | number) => {
        const res = await fetch(`${BASE_URL}/interview/${sessionId}/next`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to get question");
        return res.json();
    },

    submitAnswer: async (sessionId: string | number, data: {question_id: string, question_text?: string, answer_text: string}) => {
        const res = await fetch(`${BASE_URL}/interview/${sessionId}/answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                session_id: parseInt(sessionId.toString()),
                ...data
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

    // Report
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

    // User / Dashboard
    getDashboardStats: async () => {
        const res = await fetch(`${BASE_URL}/user/dashboard`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        return res.json();
    },

    getRecentSessions: async () => {
        const res = await fetch(`${BASE_URL}/user/sessions/recent`, {
            headers: {"Authorization": `Bearer ${getToken()}`}
        });
        if (!res.ok) throw new Error("Failed to fetch recent sessions");
        return res.json();
    },
};
