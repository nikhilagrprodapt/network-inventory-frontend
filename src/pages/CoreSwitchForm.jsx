import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { headendsApi } from "../api/headends.api";
import { fdhsApi } from "../api/fdhs.api";
import { coreSwitchesApi } from "../api/coreSwitches.api";

export default function CoreSwitchForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    location: "",
    headendId: "",
    fdhId: "", // helper selection
  });

  const [headends, setHeadends] = useState([]);
  const [fdhs, setFdhs] = useState([]);
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

  // Load headends + fdhs once
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setErr("");
      try {
        const [h, f] = await Promise.all([headendsApi.getAll(), fdhsApi.getAll()]);
        setHeadends(Array.isArray(h) ? h : []);
        setFdhs(Array.isArray(f) ? f : []);
      } catch {
        setErr("Failed to load headends/FDHs for dropdown.");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Filter FDHs based on selected headend (optional)
  const fdhsFiltered = useMemo(() => {
    const hid = Number(form.headendId);
    if (!form.headendId || Number.isNaN(hid)) return fdhs;
    return fdhs.filter((x) => Number(x.headendId) === hid);
  }, [fdhs, form.headendId]);

  // If user selects FDH, auto-set headendId
  const onFdhChange = (e) => {
    const selectedFdhId = e.target.value;
    const fdhObj = fdhs.find((x) => String(x.fdhId) === String(selectedFdhId));

    setForm((p) => ({
      ...p,
      fdhId: selectedFdhId,
      headendId: fdhObj?.headendId ? String(fdhObj.headendId) : p.headendId,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const name = form.name.trim();
    const headendId = Number(form.headendId);

    if (!name) return setErr("Name is required.");
    if (!String(form.headendId || "").trim())
      return setErr("Headend is required (select Headend or FDH).");
    if (Number.isNaN(headendId)) return setErr("Headend must be a valid selection.");

    const payload = {
      name,
      location: form.location.trim() || null,
      headendId,
    };

    try {
      await coreSwitchesApi.create(payload);
      showSuccess("✅ Core Switch created!");
      setTimeout(() => navigate("/core-switches"), 600);
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
        Loading dropdown data...
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h2 className="m-0 text-xl font-semibold text-slate-100">Add Core Switch</h2>

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

      {/* Outer card (same as others) */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Name *</span>
            <input name="name" value={form.name} onChange={onChange} className={inputCls} />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Location</span>
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              className={inputCls}
            />
          </label>

          {/* Headend dropdown */}
          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Headend *</span>
            <select name="headendId" value={form.headendId} onChange={onChange} className={inputCls}>
              <option value="">Select headend...</option>
              {headends.map((h) => (
                <option key={h.headendId} value={h.headendId}>
                  {h.headendId} — {h.name} ({h.location ?? "no location"})
                </option>
              ))}
            </select>
          </label>

          {/* FDH dropdown */}
          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">FDH (optional)</span>
            <select name="fdhId" value={form.fdhId} onChange={onFdhChange} className={inputCls}>
              <option value="">Select FDH...</option>
              {fdhsFiltered.map((f) => (
                <option key={f.fdhId} value={f.fdhId}>
                  {f.fdhId} — {f.name} ({f.region ?? "no region"})
                </option>
              ))}
            </select>

            <div className="text-xs text-slate-400">
              Selecting an FDH will auto-select its Headend.
            </div>
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
              onClick={() => navigate("/core-switches")}
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

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";
