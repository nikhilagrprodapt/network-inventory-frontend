import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { tasksApi } from "../api/tasks.api";
import { techniciansApi } from "../api/technicians.api";
import { useAuth } from "../auth/AuthContext";

/**
 * STEP D:
 * Technician can:
 * - Start task (PENDING -> IN_PROGRESS)
 * - Add notes
 * - Add checklist items
 * - Toggle checklist
 * - Complete task (IN_PROGRESS -> COMPLETED) only if checklist all done
 *
 * Admin can:
 * - Do everything technician can
 * - Assign/change technician
 *
 * Backend mapping:
 * PENDING = OPEN / ASSIGNED
 * COMPLETED = DONE
 */

const ROLE = {
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
};

function normalizeRoles(user) {
  const raw = user?.roles ?? (user?.role ? [user.role] : []);
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((r) => String(r).trim())
    .filter(Boolean)
    .map((r) => r.replace(/^ROLE_/, "").toUpperCase());
}

export default function TaskDetail() {
  const { user } = useAuth();
  const roles = normalizeRoles(user);
  const isTechnician = roles.includes(ROLE.TECHNICIAN);
  const isAdmin = roles.includes(ROLE.ADMIN);

  const { taskId } = useParams();
  const navigate = useNavigate();

  const id = useMemo(() => {
    const n = Number(taskId);
    return Number.isFinite(n) ? n : null;
  }, [taskId]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [detail, setDetail] = useState(null);

  const [techs, setTechs] = useState([]);
  const [assignTechId, setAssignTechId] = useState("");

  const [noteText, setNoteText] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("");

  const [checkLabel, setCheckLabel] = useState("");

  const asArraySafe = (res) => {
    // handles: array, {data:array}, {data:{data:array}} etc.
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    return [];
  };

  const load = async () => {
    if (!id) return setErr("Invalid task id.");

    setLoading(true);
    setErr("");

    try {
      const [d, t] = await Promise.all([tasksApi.getDetail(id), techniciansApi.getAll()]);

      setDetail(d || null);

      // safer: tech list could be ApiResponse-ish
      const techArr = asArraySafe(t);
      setTechs(techArr);

      const taskObj = d?.task || d?.deploymentTask || d?.data || d || {};
      const techId =
        taskObj?.technicianId ??
        d?.technicianId ??
        d?.task?.technicianId ??
        d?.deploymentTask?.technicianId ??
        "";

      setAssignTechId(techId ? String(techId) : "");
    } catch (e) {
      setErr(extractErr(e, "Failed to load task details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // normalize possible response shapes safely
  const task = detail?.task || detail?.deploymentTask || detail?.data || detail || {};

  const notes =
    detail?.notes || detail?.taskNotes || task?.notesList || task?.taskNotes || task?.notes || [];

  const checklist =
    detail?.checklist ||
    detail?.checklistItems ||
    detail?.taskChecklist ||
    task?.checklist ||
    task?.checklistItems ||
    [];

  const backendStatusRaw = String(task?.status || task?.taskStatus || "OPEN").toUpperCase();
  const uiStatus = useMemo(() => toUiStatus(backendStatusRaw), [backendStatusRaw]);

  const checklistAllDone = useMemo(() => {
    const items = Array.isArray(checklist) ? checklist : [];
    if (items.length === 0) return true;
    return items.every((it) => !!(it?.done ?? it?.isDone));
  }, [checklist]);

  const canStart = uiStatus === "PENDING";
  const canComplete = uiStatus === "IN_PROGRESS" && checklistAllDone;

  const onSetUiStatus = async (nextUi) => {
    if (!id) return;

    if (nextUi === "IN_PROGRESS" && !canStart) {
      alert(`Invalid transition: ${uiStatus} -> IN_PROGRESS`);
      return;
    }

    if (nextUi === "COMPLETED" && !canComplete) {
      if (!checklistAllDone) alert("Complete all checklist items before marking COMPLETED.");
      else alert(`Invalid transition: ${uiStatus} -> COMPLETED`);
      return;
    }

    const nextBackend = toBackendStatus(nextUi, backendStatusRaw);

    try {
      await tasksApi.updateStatus(id, { status: nextBackend });
      await load();
    } catch (e) {
      alert(extractErr(e, "Status update failed"));
    }
  };

  const onAssign = async () => {
    if (!id) return;

    // Technicians should not assign
    if (!isAdmin) {
      alert("Only Admin can assign/change technician.");
      return;
    }

    const raw = String(assignTechId || "").trim();
    const technicianId = raw ? Number(raw) : null;

    if (raw && Number.isNaN(technicianId)) return alert("Invalid technician selection.");

    try {
      await tasksApi.assign(id, { technicianId });
      await load();
    } catch (e) {
      alert(extractErr(e, "Assign failed"));
    }
  };

  const onAddNote = async (e) => {
    e.preventDefault();
    if (!id) return;

    const text = String(noteText || "").trim();
    if (!text) return alert("Note text is required.");

    const payload = {
      text,
      author: String(noteAuthor || "").trim() || null,
    };

    try {
      await tasksApi.addNote(id, payload);
      setNoteText("");
      setNoteAuthor("");
      await load();
    } catch (e2) {
      alert(extractErr(e2, "Add note failed"));
    }
  };

  const onAddChecklist = async (e) => {
    e.preventDefault();
    if (!id) return;

    const label = String(checkLabel || "").trim();
    if (!label) return alert("Checklist label is required.");

    try {
      await tasksApi.addChecklistItem(id, { label });
      setCheckLabel("");
      await load();
    } catch (e2) {
      alert(extractErr(e2, "Add checklist item failed"));
    }
  };

  const onToggleChecklist = async (item) => {
    const itemId = item?.itemId ?? item?.id;
    if (!itemId) return;

    const current = !!(item?.done ?? item?.isDone);
    const next = !current;

    try {
      await tasksApi.toggleChecklistItem(itemId, { done: next });
      await load();
    } catch (e2) {
      alert(extractErr(e2, "Checklist update failed"));
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading task...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
        {err}
        <div className="mt-3">
          <button
            onClick={() => navigate(isTechnician ? "/my-tasks" : "/tasks")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={isTechnician ? "/my-tasks" : "/tasks"}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            ← Back
          </Link>

          <h2 className="m-0 text-xl font-semibold text-slate-100">
            Task #{task?.taskId ?? task?.id ?? id}
          </h2>

          <StatusBadge value={uiStatus} />
        </div>

        <button
          onClick={load}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="text-xs font-semibold text-slate-400">Task Type</div>
            <div className="mt-1 text-base font-extrabold text-slate-100">{task?.taskType ?? "-"}</div>

            <div className="mt-4 text-xs font-semibold text-slate-400">Notes</div>
            <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{task?.notes ?? "-"}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="text-xs font-semibold text-slate-400">Customer</div>
            <div className="mt-1 text-sm text-slate-100">
              {task?.customerName ?? (task?.customerId ? `Customer #${task.customerId}` : "-")}
            </div>

            <div className="mt-4 text-xs font-semibold text-slate-400">Technician</div>
            <div className="mt-1 text-sm text-slate-100">
              {task?.technicianName ?? (task?.technicianId ? `Tech #${task.technicianId}` : "-")}
            </div>

            {/* ✅ Only Admin can assign */}
            {isAdmin ? (
              <div className="mt-4 grid gap-2">
                <label className="text-xs font-semibold text-slate-400">Assign / Change Technician</label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={assignTechId}
                    onChange={(e) => setAssignTechId(e.target.value)}
                    className="h-10 w-full max-w-sm rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Unassigned</option>
                    {techs.map((t) => (
                      <option key={t.technicianId ?? t.id} value={t.technicianId ?? t.id}>
                        {t.technicianId ?? t.id} — {t.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={onAssign}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99]"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="text-xs font-semibold text-slate-400">Timeline</div>
            <div className="mt-2 text-sm text-slate-200">
              <div>Scheduled: {fmtDate(task?.scheduledAt)}</div>
              <div className="mt-1 text-slate-300">Started: {fmtDate(task?.startedAt)}</div>
              <div className="mt-1 text-slate-300">Completed: {fmtDate(task?.completedAt)}</div>
            </div>

            <div className="mt-4 text-xs font-semibold text-slate-400">Workflow</div>
            <div className="mt-2 grid gap-2">
              <div className="text-xs text-slate-400">
                Checklist:
                <span
                  className={`ml-2 font-semibold ${
                    checklistAllDone ? "text-emerald-200" : "text-amber-200"
                  }`}
                >
                  {checklistAllDone ? "Complete" : "Incomplete"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btnCls} ${canStart ? "" : "opacity-40 cursor-not-allowed"}`}
                  disabled={!canStart}
                  onClick={() => onSetUiStatus("IN_PROGRESS")}
                  title={!canStart ? "Allowed only from PENDING" : "Start task"}
                >
                  Start (IN_PROGRESS)
                </button>

                <button
                  type="button"
                  className={`${btnCls} ${canComplete ? "" : "opacity-40 cursor-not-allowed"}`}
                  disabled={!canComplete}
                  onClick={() => onSetUiStatus("COMPLETED")}
                  title={
                    !canComplete
                      ? uiStatus !== "IN_PROGRESS"
                        ? "Allowed only from IN_PROGRESS"
                        : "Complete all checklist items first"
                      : "Complete task"
                  }
                >
                  Complete (COMPLETED)
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Enforced flow:{" "}
                <span className="text-slate-300 font-semibold">PENDING → IN_PROGRESS → COMPLETED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes + Checklist */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Notes */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-extrabold text-slate-100">Notes</div>
              <div className="text-xs text-slate-400">
                {Array.isArray(notes) ? notes.length : 0} items
              </div>
            </div>

            <form onSubmit={onAddNote} className="mt-3 grid gap-2">
              <input
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
                placeholder="Author (optional)"
                className={inputCls}
              />
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write installation notes..."
                rows={3}
                className={textareaCls}
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99]"
              >
                + Add Note
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {Array.isArray(notes) && notes.length > 0 ? (
                notes
                  .slice()
                  .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
                  .map((n) => (
                    <div
                      key={n.noteId ?? n.id ?? `${n.createdAt}-${n.text}`}
                      className="rounded-xl border border-slate-800 bg-[#0b1220] p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-100">{n.author || "System"}</div>
                        <div className="text-xs text-slate-400">{fmtDate(n.createdAt)}</div>
                      </div>
                      <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">{n.text}</div>
                    </div>
                  ))
              ) : (
                <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-3 text-sm text-slate-400">
                  No notes yet.
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-extrabold text-slate-100">Installation Checklist</div>
              <div className="text-xs text-slate-400">
                {Array.isArray(checklist) ? checklist.length : 0} items
              </div>
            </div>

            <form onSubmit={onAddChecklist} className="mt-3 flex flex-wrap gap-2">
              <input
                value={checkLabel}
                onChange={(e) => setCheckLabel(e.target.value)}
                placeholder="Add checklist item..."
                className={`${inputCls} flex-1`}
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99]"
              >
                + Add
              </button>
            </form>

            {!checklistAllDone && uiStatus === "IN_PROGRESS" ? (
              <div className="mt-3 rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-sm text-amber-200">
                Complete all checklist items to enable <span className="font-semibold">COMPLETED</span>.
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {Array.isArray(checklist) && checklist.length > 0 ? (
                checklist.map((it) => {
                  const done = !!(it.done ?? it.isDone);
                  return (
                    <button
                      key={it.itemId ?? it.id ?? `${it.label}-${done}`}
                      onClick={() => onToggleChecklist(it)}
                      className="w-full rounded-xl border border-slate-800 bg-[#0b1220] p-3 text-left transition hover:bg-slate-900/40"
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                            done
                              ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-200"
                              : "border-slate-700 bg-[#0f172a] text-slate-400"
                          }`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <div className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-100"}`}>
                          {it.label}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-3 text-sm text-slate-400">
                  No checklist items yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function toUiStatus(backend) {
  const b = String(backend || "").toUpperCase();
  if (b === "IN_PROGRESS") return "IN_PROGRESS";
  if (b === "DONE" || b === "COMPLETED") return "COMPLETED";
  if (b === "OPEN" || b === "ASSIGNED" || b === "PENDING") return "PENDING";
  return b;
}

function toBackendStatus(uiStatus, currentBackend) {
  const u = String(uiStatus || "").toUpperCase();
  const cur = String(currentBackend || "").toUpperCase();

  if (u === "PENDING") {
    if (cur === "ASSIGNED") return "ASSIGNED";
    return "OPEN";
  }
  if (u === "IN_PROGRESS") return "IN_PROGRESS";
  if (u === "COMPLETED") return "DONE";

  return u;
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

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const textareaCls =
  "w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const btnCls =
  "inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50";
