import { api } from "./axios";

export const customersApi = {
  getAll: async () => (await api.get("/api/customers")).data?.data,
  getOne: async (id) => (await api.get(`/api/customers/${id}`)).data?.data,
  create: async (payload) => (await api.post("/api/customers", payload)).data?.data,
  update: async (id, payload) =>
    (await api.patch(`/api/customers/${id}`, payload)).data?.data,
  assignSplitter: async (id, payload) =>
    (await api.put(`/api/customers/${id}/assign-splitter`, payload)).data?.data,
  remove: async (id) => (await api.delete(`/api/customers/${id}`)).data?.data,

  // ✅ Journey 4
  deactivate: async (id, payload) =>
    (await api.post(`/api/customers/${id}/deactivate`, payload)).data?.data,
};
