import { api } from "./axios";

export const adminApi = {
  async getUsers() {
    const res = await api.get("/api/admin/users");
    // backend wraps in ApiResponse
    return res.data?.data ?? [];
  },

  async updateUserRole(userId, role) {
    const res = await api.put(`/api/admin/users/${userId}/role`, { role });
    return res.data?.data;
  },
};
