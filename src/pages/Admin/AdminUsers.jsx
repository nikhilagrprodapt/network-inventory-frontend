import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/admin.api";

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const ROLES = ["ADMIN", "MANAGER", "PLANNER", "TECHNICIAN", "INVENTORY_MANAGER", "SUPPORT_AGENT"];

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [roleDraft, setRoleDraft] = useState({}); // userId -> role

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await adminApi.getUsers();
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);

      // Initialize drafts from server values
      const init = {};
      for (const u of arr) {
        const id = u.userId ?? u.id;
        init[id] = u.role;
      }
      setRoleDraft(init);
    } catch (e) {
      const status = e?.response?.status;
      const body = e?.response?.data;
      setErr(`Failed to load users. HTTP ${status || "?"}: ${JSON.stringify(body || e.message)}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((u) => {
      const id = String(u.userId ?? u.id ?? "").toLowerCase();
      const un = String(u.username ?? "").toLowerCase();
      const role = String(u.role ?? "").toLowerCase();
      return id.includes(query) || un.includes(query) || role.includes(query);
    });
  }, [rows, q]);

  const saveRole = async (userId) => {
    const newRole = roleDraft[userId];
    if (!newRole) return;

    setSavingId(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      await load();
    } catch (e) {
      alert("Role update failed. Ensure you are logged in as ADMIN.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Manage User Roles (UJ6)</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="grid gap-1 text-sm text-slate-300 w-full sm:w-[380px]">
            <span className="font-medium">Search (id / username / role)</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. admin, planner1, TECHNICIAN"
              className={inputCls}
            />
          </label>

          <div className="text-xs text-slate-400">
            Showing{" "}
            <span className="text-slate-200 font-semibold">{filtered.length}</span>{" "}
            of{" "}
            <span className="text-slate-200 font-semibold">{rows.length}</span>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {/* Table */}
        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
              No users match your search.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="bg-[#0f172a]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">User ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Username</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Role</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Last Login</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((u, idx) => {
                      const id = u.userId ?? u.id;
                      const currentRole = String(u.role ?? "");
                      const draft = roleDraft[id] ?? currentRole;
                      const changed = String(draft) !== String(currentRole);

                      return (
                        <tr
                          key={id ?? idx}
                          className="border-t border-slate-800 transition hover:bg-slate-900/50"
                        >
                          <td className="px-3 py-3 text-sm text-slate-200">{id ?? "-"}</td>
                          <td className="px-3 py-3 text-sm font-medium text-slate-100">{u.username ?? "-"}</td>

                          <td className="px-3 py-3">
                            <select
                              value={draft}
                              onChange={(e) => setRoleDraft((p) => ({ ...p, [id]: e.target.value }))}
                              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-3 py-3 text-sm text-slate-200">{fmt(u.lastLogin)}</td>

                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                disabled={!changed || savingId === id}
                                onClick={() => saveRole(id)}
                                className={[
                                  "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                  savingId === id || !changed
                                    ? "cursor-not-allowed border border-slate-800 bg-slate-900/30 text-slate-500"
                                    : "border border-slate-700 bg-[#0f172a] text-slate-100 hover:border-slate-500 hover:bg-slate-900/50",
                                ].join(" ")}
                              >
                                {savingId === id ? "Saving..." : "Save Role"}
                              </button>

                              {changed && (
                                <button
                                  onClick={() => setRoleDraft((p) => ({ ...p, [id]: currentRole }))}
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(x) {
  if (!x) return "-";
  try {
    return new Date(x).toLocaleString();
  } catch {
    return String(x);
  }
}
