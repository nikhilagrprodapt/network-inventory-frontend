import { api } from "./axios";

function extractToken(payload) {
  if (!payload) return null;
  return (
    payload.token ||
    payload?.data?.token ||
    payload?.data?.data?.token ||
    null
  );
}

export const authApi = {
  async login(username, password) {
    const res = await api.post("/api/auth/login", { username, password });
    const payload = res?.data;

    const token = extractToken(payload);

    // Your backend login returns direct fields:
    // { token, username, role }
    const user = {
      username: payload?.username ?? username,
      role: payload?.role,
      roles: payload?.role ? [payload.role] : [], // normalize immediately
    };

    return { token, user, raw: payload };
  },

  async me() {
    const res = await api.get("/api/auth/me");
    // ApiResponse<T> => { message, data }
    return res?.data?.data; // ✅ return only the "data" payload
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};
