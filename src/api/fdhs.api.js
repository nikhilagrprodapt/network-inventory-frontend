import { api } from "./axios";

export const fdhsApi = {
  getAll: async (params) => (await api.get("/api/fdhs", { params })).data,
  create: async (payload) => (await api.post("/api/fdhs", payload)).data,
};
