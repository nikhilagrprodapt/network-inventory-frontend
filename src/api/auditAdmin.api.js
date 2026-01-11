import { api } from "./axios";

function cleanParams(params) {
  const out = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    const s = String(v).trim();
    if (!s) return;
    out[k] = s;
  });
  return out;
}

export const auditAdminApi = {
  async search({ actor = "", action = "", entityType = "", days = 7, limit = 200 } = {}) {
    const params = cleanParams({ actor, action, entityType, days, limit });
    const res = await api.get("/api/audit/search", { params });
    return res.data?.data ?? [];
  },

  async getById(id) {
    const res = await api.get(`/api/audit/${id}`);
    return res.data?.data;
  },

  async exportCsv({ actor = "", action = "", entityType = "", days = 7 } = {}) {
    const params = cleanParams({ actor, action, entityType, days });
    const res = await api.get("/api/audit/export.csv", {
      params,
      responseType: "blob",
    });
    return res.data; // Blob
  },
};
