import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { tasksApi } from "../api/tasks.api";
import { techniciansApi } from "../api/technicians.api";
import { useAuth } from "../auth/AuthContext";

export default function MyTasks() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [tasks, setTasks] = useState([]);
  const [matchedTechs, setMatchedTechs] = useState([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | IN_PROGRESS | COMPLETED

  const username = String(user?.username || "").trim();

  const norm = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const toUiStatus = (backendStatus) => {
    const b = String(backendStatus || "").toUpperCase();
    if (b === "IN_PROGRESS") return "IN_PROGRESS";
    if (b === "DONE") return "COMPLETED";
    if (b === "OPEN" || b === "ASSIGNED") return "PENDING";
    return "PENDING";
  };

  const asArraySafe = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    return [];
  };

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const [techRes, taskRes] = await Promise.all([
        techniciansApi.getAll(),
        tasksApi.getAll(),
      ]);

      const techs = asArraySafe(techRes);
      const items = asArraySafe(taskRes);

      const u = username.toLowerCase();
      const uNorm = norm(username);

      // 1) Prefer email local-part match (tech1@company.com -> tech1)
      const byEmailLocal = techs.filter((t) => {
        const email = String(t?.email || "").toLowerCase();
        const emailLocal = email.includes("@") ? email.split("@")[0] : email;
        return emailLocal === u || email === u;
      });

      // 2) If no email match, fallback to name normalized match
      const byNameNorm =
        byEmailLocal.length > 0
          ? []
          : techs.filter((t) => norm(t?.name) === uNorm);

      const candidates = byEmailLocal.length > 0 ? byEmailLocal : byNameNorm;

      setMatchedTechs(candidates);

      const candidateIds = new Set(
        candidates
          .map((t) => t?.technicianId ?? t?.id)
          .filter((x) => x !== null && x !== undefined)
          .map(String)
      );

      const mine = items.filter((t) => {
        const tid = t?.technicianId ?? t?.technician?.technicianId ?? null;
        return tid != null && candidateIds.has(String(tid));
      });

      setTasks(mine);
    } catch (e) {
      console.error(e);
      setErr("Failed to load My Tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return tasks.filter((t) => {
      const backend = String(t?.status || "OPEN").toUpperCase();
      const ui = toUiStatus(backend);

      const matchesStatus = statusFilter === "ALL" ? true : ui === statusFilter;

      const hay = [
        t.taskId,
        t.taskType,
        t.notes,
        t.customerName,
        t.customerId,
        backend,
        ui,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesText = qq ? hay.includes(qq) : true;
      return matchesStatus && matchesText;
    });
  }, [tasks, q, statusFilter]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading My Tasks...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        {err}
        <div className="mt-3">
          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const techIdText =
    matchedTechs.length === 1
      ? String(matchedTechs[0]?.technicianId ?? matchedTechs[0]?.id ?? "-")
      : "-";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">My Tasks</h2>
          <div className="mt-1 text-sm text-slate-400">
            Logged in as{" "}
            <span className="font-semibold text-slate-200">{username || "-"}</span>
            <span className="mx-2 text-slate-600">|</span>
            Technician ID:{" "}
            <span className="font-semibold text-slate-200">{techIdText}</span>
          </div>
        </div>

        <button
          onClick={load}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Search tasks..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full max-w-md rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full max-w-xs rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <div className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-100">{filtered.length}</span> /{" "}
            {tasks.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="text-base font-extrabold text-slate-100">No tasks assigned</div>
            <div className="mt-1 text-sm text-slate-400">
              If you expect tasks, make sure the admin assigned a technician to the task.
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
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Timeline</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => {
                    const uiStatus = toUiStatus(t?.status);
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
                          <StatusBadge value={uiStatus} />
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
                          <Link
                            to={`/tasks/${t.taskId}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                          >
                            Open
                          </Link>
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

function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function StatusBadge({ value }) {
  const v = String(value ?? "PENDING").toUpperCase();

  const cls =
    v === "COMPLETED"
      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
      : v === "IN_PROGRESS"
      ? "border-blue-700/40 bg-blue-950/40 text-blue-200"
      : v === "PENDING"
      ? "border-amber-700/40 bg-amber-950/40 text-amber-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {v}
    </span>
  );
}
