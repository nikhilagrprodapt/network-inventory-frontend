import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tasksApi } from "../api/tasks.api";
import { techniciansApi } from "../api/technicians.api";
import { customersApi } from "../api/customers.api";

export default function TaskForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    taskType: "",
    notes: "",
    technicianId: "",
    customerId: "",
  });

  const [techs, setTechs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [t, c] = await Promise.all([techniciansApi.getAll(), customersApi.getAll()]);
        setTechs(Array.isArray(t) ? t : []);
        setCustomers(Array.isArray(c) ? c : []);
      } catch {
        setErr("Failed to load technicians/customers.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const taskType = form.taskType.trim();
    if (!taskType) return setErr("Task Type is required.");

    const customerIdRaw = String(form.customerId || "").trim();
    const customerId = customerIdRaw ? Number(customerIdRaw) : null;
    if (!customerId || Number.isNaN(customerId)) return setErr("Customer is required.");

    const techIdRaw = String(form.technicianId || "").trim();
    const technicianId = techIdRaw ? Number(techIdRaw) : null;
    if (techIdRaw && Number.isNaN(technicianId)) return setErr("Technician must be a valid selection.");

    const payload = {
      customerId,
      technicianId,
      taskType,
      notes: form.notes.trim() || null,
    };

    try {
      setSaving(true);
      await tasksApi.create(payload);
      setMsg("✅ Task created!");
      setTimeout(() => navigate("/tasks"), 600);
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        "Create failed.";
      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading dropdowns...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Add Task</h2>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {msg && (
          <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/40 p-4 text-emerald-200 font-semibold">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 grid gap-4 max-w-xl">
          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Task Type *</span>
            <input name="taskType" value={form.taskType} onChange={onChange} className={inputCls} />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Notes</span>
            <textarea name="notes" value={form.notes} onChange={onChange} className={textareaCls} rows={4} />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Technician (optional)</span>
            <select name="technicianId" value={form.technicianId} onChange={onChange} className={inputCls}>
              <option value="">None</option>
              {techs.map((t) => (
                <option key={t.technicianId} value={t.technicianId}>
                  {t.technicianId} — {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Customer *</span>
            <select name="customerId" value={form.customerId} onChange={onChange} className={inputCls}>
              <option value="">Select customer...</option>
              {customers.map((c) => {
                const id = c.customerId ?? c.id;
                return (
                  <option key={id} value={id}>
                    {id} — {c.name}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {saving ? "Creating..." : "Create"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40";

const textareaCls =
  "w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40";
