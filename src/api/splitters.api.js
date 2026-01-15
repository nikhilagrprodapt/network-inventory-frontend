import { api } from "./axios";

export const splittersApi = {
  // ✅ backend returns ApiResponse => { success, message, data: [...] }
  getAll: async (params) => {
    const res = await api.get("/api/splitters", { params });
    const data = res?.data?.data;
    return Array.isArray(data) ? data : [];
  },

  // ✅ backend returns ApiResponse => { success, message, data: {...} }
  create: async (payload) => {
    const res = await api.post("/api/splitters", payload);
    return res?.data?.data;
  },

  // ✅ NEW: available ports
  getAvailablePorts: async (splitterId) => {
    const res = await api.get(`/api/splitters/${splitterId}/available-ports`);
    const data = res?.data?.data;
    return Array.isArray(data) ? data : [];
  },
};
