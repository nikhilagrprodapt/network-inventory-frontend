import { api } from "./axios";

export const assetsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);

    const url = query.toString() ? `/api/assets?${query.toString()}` : "/api/assets";
    return (await api.get(url)).data?.data;
  },

  create: async (payload) => (await api.post("/api/assets", payload)).data?.data,

  assign: async (id, payload) => (await api.put(`/api/assets/${id}/assign`, payload)).data?.data,

  unassign: async (id) => (await api.put(`/api/assets/${id}/unassign`)).data?.data,

  history: async (id) => (await api.get(`/api/assets/${id}/history`)).data?.data,

  updateStatus: async (id, status) =>
    (await api.patch(`/api/assets/${id}/status`, { status })).data?.data,

  // ✅ NEW: bulk upload CSV (multipart/form-data)
  bulkUpload: async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    return (
      await api.post("/api/assets/bulk-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data?.data;
  },
};
