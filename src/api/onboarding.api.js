import { api } from "./axios";

export const onboardingApi = {
  getFdhs: async () => {
    const res = await api.get("/api/onboarding/fdhs");
    return res.data?.data ?? [];
  },

  getSplittersByFdh: async (fdhId) => {
    const res = await api.get("/api/onboarding/splitters", { params: { fdhId } });
    return res.data?.data ?? [];
  },

  getFreePorts: async (splitterId) => {
    const res = await api.get(`/api/onboarding/splitters/${splitterId}/free-ports`);
    return res.data?.data ?? [];
  },

  confirm: async (payload) => {
    const res = await api.post("/api/onboarding/confirm", payload);
    return res.data?.data;
  },
};
