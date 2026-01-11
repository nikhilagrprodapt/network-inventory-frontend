import { api } from "./axios";

export const auditApi = {
  getRecent: async () => {
    const res = await api.get("/api/audit/recent");
    return res.data?.data ?? [];
  },
};
