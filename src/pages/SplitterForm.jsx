import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { splittersApi } from "../api/splitters.api";
import { fdhsApi } from "../api/fdhs.api";
import { headendsApi } from "../api/headends.api";

export default function SplitterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    model: "",
    portCapacity: "",
    headendId: "",
    fdhId: "",
  });

  const [fdhs, setFdhs] = useState([]);
  const [headends, setHeadends] = useState([]);
  const [loading, setLoading] = useState(true);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const showSuccess = (t) => {
    setMsg(t);
    setErr("");
    setTimeout(() => setMsg(""), 2500);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setErr("");
      try {
        const [f, h] = await Promise.all([fdhsApi.getAll(), headendsApi.getAll()]);
        setFdhs(Array.isArray(f) ? f : []);
        setHeadends(Array.isArray(h) ? h : []);
      } catch {
        setErr("Failed to load FDHs / Headends for dropdown.");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const filteredFdhs = useMemo(() => {
    const hid = String(form.headendId || "").trim();
    if (!hid) return fdhs;
    return fdhs.filter((f) => String(f.headendId) === hid);
  }, [fdhs, form.headendId]);

  useEffect(() => {
    if (!form.headendId) return;
    if (!form.fdhId) return;

    const stillValid = filteredFdhs.some((f) => String(f.fdhId) === String(form.fdhId));
    if (!stillValid) setForm((p) => ({ ...p, fdhId: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.headendId, filteredFdhs]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const name = form.name.trim();
    const portCapacity = Number(String(form.portCapacity ?? "").trim());
    const fdhId = Number(String(form.fdhId ?? "").trim());

    if (!name) return setErr("Name is required.");
    if (!String(form.portCapacity ?? "").trim()) return setErr("Port capacity is required.");
    if (Number.isNaN(portCapacity)) return setErr("Port capacity must be a valid number.");
    if (!String(form.fdhId ?? "").trim()) return setErr("FDH is required.");
    if (Number.isNaN(fdhId)) return setErr("FDH must be a valid selection.");

    const payload = {
      name,
      model: form.model.trim() || null,
      portCapacity,
      fdhId,
    };

    try {
      await splittersApi.create(payload);
      showSuccess("✅ Splitter created!");
      setTimeout(() => navigate("/splitters"), 600);
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        e2?.message ||
        "Create failed.";
      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
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
    <div className="max-w-xl">
      <h2 className="m-0 text-xl font-semibold text-slate-100">Add Splitter</h2>

      {msg ? (
        <div className="mt-4 rounded-xl border border-emerald-700/40 bg-emerald-950/40 p-3 text-emerald-200 font-semibold">
          {msg}
        </div>
      ) : null}

      {err ? (
        <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 p-3 text-red-200 whitespace-pre-wrap">
          {err}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Name *</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Model</span>
            <input
              name="model"
              value={form.model}
              onChange={onChange}
              placeholder="e.g. 1:8"
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Port Capacity *</span>
            <input
              name="portCapacity"
              value={form.portCapacity}
              onChange={onChange}
              placeholder="e.g. 8"
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Headend (optional filter)</span>
            <select
              name="headendId"
              value={form.headendId}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All headends</option>
              {headends.map((h) => (
                <option key={h.headendId} value={h.headendId}>
                  {h.headendId} — {h.name} ({h.location ?? "no location"})
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-400">
              This only filters the FDH list. Backend uses FDH only.
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">FDH *</span>
            <select
              name="fdhId"
              value={form.fdhId}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select FDH...</option>
              {filteredFdhs.map((f) => {
                const head = headends.find((h) => String(h.headendId) === String(f.headendId));
                const headLabel = head ? `${head.headendId} — ${head.name}` : `${f.headendId}`;

                return (
                  <option key={f.fdhId} value={f.fdhId}>
                    {f.fdhId} — {f.name} ({f.region ?? "no region"}) | Headend: {headLabel}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Create
            </button>

            <button
              type="button"
              onClick={() => navigate("/splitters")}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
