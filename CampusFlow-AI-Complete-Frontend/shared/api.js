window.CampusFlowAPI = (() => {
  const base = localStorage.getItem("CAMPUSFLOW_API_BASE") || "http://localhost:3000";

  async function req(path, opt = {}) {
    const headers = { "Content-Type": "application/json", ...(opt.headers || {}) };
    const token = localStorage.getItem("campusflow_token");
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(base + path, { ...opt, headers });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      const error = new Error(data.message || data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.code = data.error;
      error.data = data;
      throw error;
    }
    return data;
  }

  return {
    baseUrl: base,
    setToken: (token) => localStorage.setItem("campusflow_token", token),
    clearToken: () => localStorage.removeItem("campusflow_token"),
    login: (identifier, password) =>
      req("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
      }),
    health: () => req("/api/health"),
    me: () => req("/api/me"),
    notices: () => req("/api/notices"),
    publishNotice: (payload) =>
      req("/api/notices", { method: "POST", body: JSON.stringify(payload) }),
    applications: (payload) =>
      req("/api/applications", { method: "POST", body: JSON.stringify(payload) }),
    listApplications: () => req("/api/applications"),
    decideApplication: (id, decision) =>
      req(`/api/applications/${encodeURIComponent(id)}/${decision}`, { method: "POST" }),
    attendance: (payload) =>
      req("/api/attendance/check-in", { method: "POST", body: JSON.stringify(payload) }),
    attendanceHistory: () => req("/api/attendance"),
    students: () => req("/api/students"),
    audit: () => req("/api/audit"),
    ai: (question) =>
      req("/api/ai/chat", { method: "POST", body: JSON.stringify({ question }) }),
    workflow: () => req("/api/workflow/tasks"),
    syncWorkflow: () => req("/api/workflow/sync", { method: "POST" }),
    decideWorkflow: (id, decision) =>
      req(`/api/workflow/tasks/${encodeURIComponent(id)}/${decision}`, { method: "POST" })
  };
})();
