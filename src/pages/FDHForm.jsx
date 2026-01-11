import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fdhsApi } from "../api/fdhs.api";
import { headendsApi } from "../api/headends.api";

export default function FDHForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    location: "",
    region: "",
    maxPorts: "",
    headendId: "",
  });

  const [headends, setHeadends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const showSuccess = (t) => {
    setMsg(t);
    setErr("");
    setTimeout(() => setMsg(""), 2200);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const loadHeadends = async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await headendsApi.getAll();
        setHeadends(Array.isArray(data) ? data : []);
      } catch {
        setErr("Failed to load headends for dropdown.");
      } finally {
        setLoading(false);
      }
    };
    loadHeadends();
  }, []);

  const headendMap = useMemo(() => {
    const m = new Map();
    headends.forEach((h) => m.set(String(h.headendId), h));
    return m;
  }, [headends]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const name = form.name.trim();
    if (!name) return setErr("Name is required.");

    const headendIdRaw = String(form.headendId ?? "").trim();
    if (!headendIdRaw) return setErr("Headend is required.");

    const headendId = Number(headendIdRaw);
    if (Number.isNaN(headendId)) return setErr("Headend must be a valid selection.");

    const maxPortsRaw = String(form.maxPorts ?? "").trim();
    const maxPorts = maxPortsRaw ? Number(maxPortsRaw) : null;
    if (maxPortsRaw && Number.isNaN(maxPorts)) return setErr("Max Ports must be a valid number.");

    const payload = {
      name,
      location: form.location.trim() || null,
      region: form.region.trim() || null,
      maxPorts,
      headendId,
    };

    try {
      await fdhsApi.create(payload);
      showSuccess("✅ FDH created!");
      setTimeout(() => navigate("/fdh"), 600);
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
        Loading headends...
      </div>
    );
  }

  const selectedHeadend = form.headendId ? headendMap.get(String(form.headendId)) : null;

  return (
    <div className="max-w-xl">
      <h2 className="m-0 text-xl font-semibold text-slate-100">Add FDH</h2>

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
            <span className="text-xs font-medium text-slate-300">Location</span>
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Region</span>
            <input
              name="region"
              value={form.region}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Max Ports</span>
            <input
              name="maxPorts"
              value={form.maxPorts}
              onChange={onChange}
              placeholder="e.g. 256"
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Headend *</span>
            <select
              name="headendId"
              value={form.headendId}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select headend...</option>
              {headends.map((h) => (
                <option key={h.headendId} value={h.headendId}>
                  {h.headendId} — {h.name} ({h.location ?? "no location"})
                </option>
              ))}
            </select>

            {selectedHeadend ? (
              <div className="text-xs text-slate-400">Selected: {selectedHeadend.name}</div>
            ) : null}
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
              onClick={() => navigate("/fdh")}
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
