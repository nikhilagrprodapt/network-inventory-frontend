import { api } from "./axios";

export const coreSwitchesApi = {
  getAll: async () => (await api.get("/api/core-switches")).data,
  create: async (payload) => (await api.post("/api/core-switches", payload)).data,
};
