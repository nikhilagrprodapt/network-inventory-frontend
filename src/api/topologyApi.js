import { api } from "./axios";

// backend wraps as: { success, message, data, timestamp }
const unwrap = (res) => res?.data?.data;

export async function getHeadends() {
  const res = await api.get("/api/topology/headends");
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

export async function getTopology(headendId) {
  const res = await api.get(`/api/topology/${headendId}`);
  return unwrap(res) ?? null;
}

// ✅ NEW: Drilldown details (Journey 5)
export async function getCustomerNodeDetails(customerId) {
  const res = await api.get(`/api/topology/customer/${customerId}`);
  return unwrap(res) ?? null;
}
