import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8989",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    // ✅ 401 = unauthenticated (invalid/expired token) -> logout
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // ✅ 403 = authenticated but forbidden -> DO NOT logout
    // Just pass error to page so it can show message.
    return Promise.reject(error);
  }
);
