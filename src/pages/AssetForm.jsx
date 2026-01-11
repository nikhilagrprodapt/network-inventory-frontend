import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assetsApi } from "../api/assets.api";

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

export default function AssetForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    type: "ONT",
    model: "",
    serialNumber: "",
    status: "AVAILABLE",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const payload = {
      type: form.type,
      model: form.model.trim() || null,
      serialNumber: form.serialNumber.trim(),
      status: form.status,
    };

    if (!payload.serialNumber) {
      setErr("Serial Number is required.");
      return;
    }

    try {
      setLoading(true);
      await assetsApi.create(payload);
      setMsg("✅ Asset created!");
      setTimeout(() => navigate("/assets"), 600);
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        e2.message;

      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Add Asset</h2>
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
            <span className="font-medium">Type *</span>
            <select name="type" value={form.type} onChange={onChange} className={inputCls}>
              <option value="ONT">ONT</option>
              <option value="ROUTER">ROUTER</option>
              <option value="SWITCH">SWITCH</option>
              <option value="SPLITTER">SPLITTER</option>
              <option value="FDH">FDH</option>
              <option value="CORE_SWITCH">CORE_SWITCH</option>
              <option value="HEADEND">HEADEND</option>
              <option value="FIBER_CABLE">FIBER_CABLE</option>
              <option value="FIBER_ROLL">FIBER_ROLL</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Model</span>
            <input
              name="model"
              value={form.model}
              onChange={onChange}
              className={inputCls}
              placeholder="optional (e.g. Nokia G-240W-F)"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Serial Number *</span>
            <input
              name="serialNumber"
              value={form.serialNumber}
              onChange={onChange}
              className={inputCls}
              placeholder="e.g. ONT-SN1234"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Status *</span>
            <select name="status" value={form.status} onChange={onChange} className={inputCls}>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="FAULTY">FAULTY</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? "Creating..." : "Create"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/assets")}
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
