import { api } from "./axios";

export const fiberDropLinesApi = {
  getAll: async (params) => (await api.get("/api/fiber-lines", { params })).data,
  create: async (payload) => (await api.post("/api/fiber-lines", payload)).data,
};
