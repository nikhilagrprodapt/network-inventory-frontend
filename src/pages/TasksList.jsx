import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tasksApi } from "../api/tasks.api";

export default function TasksList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  // Workflow filter (Journey-friendly)
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | IN_PROGRESS | COMPLETED | (ADV:OPEN/ASSIGNED/...)
  const [showAdvanced, setShowAdvanced] = useState(false);

  // per-row advanced status change
  const [rowStatus, setRowStatus] = useState({}); // { [taskId]: "OPEN" | ... }

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await tasksApi.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setErr("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items.filter((t) => {
      const backend = String(t?.status || "OPEN").toUpperCase();
      const ui = toUiStatus(backend);

      const matchesStatus = (() => {
        if (statusFilter === "ALL") return true;

        // Workflow filters
        if (statusFilter === "PENDING") return ui === "PENDING";
        if (statusFilter === "IN_PROGRESS") return ui === "IN_PROGRESS";
        if (statusFilter === "COMPLETED") return ui === "COMPLETED";

        // Advanced filters (exact backend match)
        return backend === statusFilter;
      })();

      const hay = [
        t.taskId,
        t.taskType,
        t.notes,
        t.customerName,
        t.technicianName,
        t.customerId,
        t.technicianId,
        backend,
        ui,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesText = qq ? hay.includes(qq) : true;

      return matchesStatus && matchesText;
    });
  }, [items, q, statusFilter]);

  const onDelete = async (id) => {
    if (!confirm(`Delete task ${id}?`)) return;
    try {
      await tasksApi.remove(id);
      await load();
    } catch {
      alert("Delete failed");
    }
  };

  const onQuickStart = async (taskId, currentBackend) => {
    const ui = toUiStatus(currentBackend);
    if (ui !== "PENDING") {
      alert("Only PENDING tasks can be started.");
      return;
    }

    try {
      await tasksApi.updateStatus(taskId, { status: "IN_PROGRESS" });
      await load();
    } catch (e) {
      alert(extractErr(e, "Start failed"));
    }
  };

  const onAdvancedStatusSave = async (taskId) => {
    const next = String(rowStatus[taskId] || "").trim().toUpperCase();
    if (!next) return alert("Select a status first.");

    try {
      await tasksApi.updateStatus(taskId, { status: next });
      await load();
    } catch (e) {
      alert(extractErr(e, "Status update failed"));
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading tasks...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        {err}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Tasks</h2>

        <div className="flex items-center gap-2">
          <Link
            to="/tasks/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add Task
          </Link>

          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Search by task/customer/technician/status..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full max-w-md rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
          />

          {/* Workflow filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full max-w-xs rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">All (Workflow)</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>

            {showAdvanced ? (
              <>
                <option disabled>──────────</option>
                <option value="OPEN">OPEN (backend)</option>
                <option value="ASSIGNED">ASSIGNED (backend)</option>
                <option value="BLOCKED">BLOCKED (backend)</option>
                <option value="DONE">DONE (backend)</option>
                <option value="CANCELLED">CANCELLED (backend)</option>
              </>
            ) : null}
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((p) => !p)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </button>

          <div className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-100">{filtered.length}</span> /{" "}
            {items.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="text-base font-extrabold text-slate-100">No tasks found</div>
            <div className="mt-1 text-sm text-slate-400">
              Try changing the workflow filter or search keyword.
            </div>
            <div className="mt-3">
              <Link to="/tasks/new" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
                + Create your first task
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Task</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Technician</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Timeline</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => {
                    const backend = String(t?.status || "OPEN").toUpperCase();
                    const ui = toUiStatus(backend);
                    const canStart = ui === "PENDING";

                    return (
                      <tr
                        key={t.taskId}
                        className="border-t border-slate-800 align-top transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{t.taskId}</td>

                        <td className="px-3 py-3 text-sm text-slate-200">
                          <div className="font-extrabold text-slate-100">{t.taskType ?? "-"}</div>
                          {t.notes ? <div className="mt-1 text-sm text-slate-300">{t.notes}</div> : null}
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-200">
                          <StatusBadge value={ui} />
                          {showAdvanced ? (
                            <div className="mt-2 text-xs text-slate-500">Backend: {backend}</div>
                          ) : null}
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-200">
                          {t.technicianName ?? t.technicianId ?? "-"}
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-200">
                          {t.customerName ?? t.customerId ?? "-"}
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-200">
                          <div>Scheduled: {fmtDate(t.scheduledAt)}</div>
                          <div className="mt-1 text-slate-300">Started: {fmtDate(t.startedAt)}</div>
                          <div className="mt-1 text-slate-300">Done: {fmtDate(t.completedAt)}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/tasks/${t.taskId}`}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                            >
                              View
                            </Link>

                            <button
                              className={`${btnSm} ${canStart ? "" : "opacity-40 cursor-not-allowed"}`}
                              disabled={!canStart}
                              onClick={() => onQuickStart(t.taskId, backend)}
                              title={!canStart ? "Allowed only when PENDING" : "Start task"}
                            >
                              Start
                            </button>

                            {/* Completing from list is unsafe because checklist enforcement is on detail page */}
                            <Link
                              to={`/tasks/${t.taskId}`}
                              className="inline-flex items-center justify-center rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-950/35"
                              title="Open task to complete checklist and finish"
                            >
                              Open to Complete
                            </Link>

                            {showAdvanced ? (
                              <>
                                <div className="w-full" />
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={rowStatus[t.taskId] ?? ""}
                                    onChange={(e) =>
                                      setRowStatus((p) => ({ ...p, [t.taskId]: e.target.value }))
                                    }
                                    className="h-9 rounded-lg border border-slate-700 bg-[#0f172a] px-2 text-xs text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
                                  >
                                    <option value="">Set backend status…</option>
                                    <option value="OPEN">OPEN</option>
                                    <option value="ASSIGNED">ASSIGNED</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="BLOCKED">BLOCKED</option>
                                    <option value="DONE">DONE</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>

                                  <button
                                    className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500"
                                    onClick={() => onAdvancedStatusSave(t.taskId)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </>
                            ) : null}

                            <button
                              className="inline-flex items-center justify-center rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-950/50"
                              onClick={() => onDelete(t.taskId)}
                            >
                              Delete
                            </button>
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
  );
}

/* ---------- Helpers ---------- */

function toUiStatus(backend) {
  const b = String(backend || "").toUpperCase();
  if (b === "IN_PROGRESS") return "IN_PROGRESS";
  if (b === "DONE" || b === "COMPLETED") return "COMPLETED";
  if (b === "OPEN" || b === "ASSIGNED" || b === "PENDING") return "PENDING";
  return b;
}

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function extractErr(e, fallback) {
  const status = e?.response?.status;
  const data = e?.response?.data;
  const serverMsg =
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
    fallback;
  return `HTTP ${status || "?"}: ${serverMsg}`;
}

function StatusBadge({ value }) {
  const v = String(value ?? "PENDING").toUpperCase();
  const cls =
    v === "COMPLETED"
      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
      : v === "IN_PROGRESS"
      ? "border-blue-700/40 bg-blue-950/40 text-blue-200"
      : v === "PENDING"
      ? "border-amber-700/40 bg-amber-950/30 text-amber-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {v}
    </span>
  );
}

const btnSm =
  "inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50";
