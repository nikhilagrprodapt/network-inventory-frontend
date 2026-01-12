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
  if (payload?.data?.data && typeof payload.data.data === "object") return payload.data.data;

  return payload;
}

export const techniciansApi = {
  getAll: async () => {
    const res = await api.get("/api/technicians");
    return unwrap(res.data);
  },

  // ✅ FIX: backend has NO GET /api/technicians/{id}
  // so fallback to GET all and find by id
  getOne: async (id) => {
    const tid = String(id ?? "").trim();
    if (!tid) throw new Error("Technician id missing");

    try {
      // if you later add backend GET-by-id, this will start working automatically
      const res = await api.get(`/api/technicians/${tid}`);
      const one = unwrap(res.data);
      if (one && typeof one === "object") return one;
    } catch (e) {
      // fallback
      const status = e?.response?.status;
      // only fallback for "not found / not allowed / not implemented" kinds of errors
      if (![404, 405, 501].includes(status)) {
        // if it's something else (401/403/500), bubble up
        throw e;
      }
    }

    // fallback path
    const all = await techniciansApi.getAll();
    const arr = Array.isArray(all) ? all : [];
    const found = arr.find((t) => String(t?.id) === tid || String(t?.technicianId) === tid);

    if (!found) {
      throw new Error(`Technician not found in list: ${tid}`);
    }
    return found;
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
