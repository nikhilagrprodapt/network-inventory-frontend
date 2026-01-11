import { api } from "./axios";

export const headendsApi = {
  getAll: async () => (await api.get("/api/headends")).data,
  create: async (payload) => (await api.post("/api/headends", payload)).data,
  getOne: async (id) => (await api.get(`/api/headends/${id}`)).data,
  update: async (id, payload) => (await api.patch(`/api/headends/${id}`, payload)).data,
};
