import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assetsApi } from "../api/assets.api";
import { customersApi } from "../api/customers.api";

export default function AssetAssign() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await customersApi.getAll();
      const list = Array.isArray(data) ? data : [];
      setCustomers(list);
      if (list.length > 0) setCustomerId(String(list[0].customerId));
    } catch (e) {
      setErr("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onAssign = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!customerId) {
      setErr("Please select a customer.");
      return;
    }

    try {
      setSaving(true);
      await assetsApi.assign(id, { customerId: Number(customerId) });
      setMsg("✅ Asset assigned!");
      setTimeout(() => navigate("/assets"), 700);
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading customers...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Assign Asset #{id}</h2>
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

        <form onSubmit={onAssign} className="mt-4 grid gap-4 max-w-xl">
          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Select Customer *</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputCls}
            >
              {customers.length === 0 ? (
                <option value="">No customers found</option>
              ) : (
                customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.customerId} — {c.name} ({c.status})
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || customers.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {saving ? "Assigning..." : "Assign"}
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

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40";
