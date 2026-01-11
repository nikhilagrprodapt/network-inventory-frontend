import { api } from "./axios";

function unwrap(payload) {
  // supports:
  // 1) direct array: [...]
  // 2) ApiResponse: { success, message, data: [...] }
  // 3) extra safe nesting: { data: { data: [...] } }
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  // if it's a single object response, return it (used by getOne)
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if (payload?.data?.data && typeof payload.data.data === "object")
    return payload.data.data;

  return payload;
}

export const techniciansApi = {
  getAll: async () => {
    const res = await api.get("/api/technicians");
    return unwrap(res.data);
  },

  getOne: async (id) => {
    const res = await api.get(`/api/technicians/${id}`);
    return unwrap(res.data);
  },

  create: async (payload) => {
    const res = await api.post("/api/technicians", payload);
    return unwrap(res.data);
  },

  update: async (id, payload) => {
    const res = await api.patch(`/api/technicians/${id}`, payload);
    return unwrap(res.data);
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/api/technicians/${id}/status`, { status });
    return unwrap(res.data);
  },
};
