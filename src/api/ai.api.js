import { api } from "./axios";

export const aiApi = {
  chat: async (message) => {
    const res = await api.post("/api/ai/chat", { message });
    return res.data?.reply; // ✅ FIX
  },
};
