import { api } from "./axios";

export const tasksApi = {
  getAll: async (params = {}) =>
    (await api.get("/api/tasks", { params })).data.data,

  create: async (payload) =>
    (await api.post("/api/tasks", payload)).data.data,

  remove: async (taskId) =>
    (await api.delete(`/api/tasks/${taskId}`)).data.data,

  getDetail: (taskId) =>
    api.get(`/api/tasks/${taskId}/detail`).then((r) => r.data.data),

  addNote: (taskId, payload) =>
    api.post(`/api/tasks/${taskId}/notes`, payload).then((r) => r.data.data),

  addChecklistItem: (taskId, payload) =>
    api.post(`/api/tasks/${taskId}/checklist`, payload).then((r) => r.data.data),

  toggleChecklistItem: (itemId, payload) =>
    api.put(`/api/tasks/checklist/${itemId}/toggle`, payload).then((r) => r.data.data),

  // ✅ backend: PUT /api/tasks/{id}/assign-technician
  assign: async (taskId, payload) =>
    (await api.put(`/api/tasks/${taskId}/assign-technician`, payload)).data.data,

  // ✅ backend: PUT /api/tasks/{id}/status
  updateStatus: async (taskId, payload) =>
    (await api.put(`/api/tasks/${taskId}/status`, payload)).data.data,

  // extra helpers (optional)
  byTechnician: async (technicianId) =>
    (await api.get(`/api/tasks/by-technician/${technicianId}`)).data.data,

  byCustomer: async (customerId) =>
    (await api.get(`/api/tasks/by-customer/${customerId}`)).data.data,
};
