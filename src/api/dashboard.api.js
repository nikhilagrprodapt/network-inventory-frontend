import { api } from "./axios";

export const dashboardApi = {
  get: async () => {
    const res = await api.get("/api/dashboard");
    return res.data?.data;
  },
};
