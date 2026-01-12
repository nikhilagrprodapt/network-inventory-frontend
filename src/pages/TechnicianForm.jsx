import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { techniciansApi } from "../api/technicians.api";

export default function TechnicianForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = mode === "create";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "ACTIVE",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    if (isCreate) return;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await techniciansApi.getOne(id);
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          status: data.status ?? "ACTIVE",
        });
           } catch (e) {
        const status = e?.response?.status;
        const data = e?.response?.data;
        const serverMsg =
          data?.message ||
          data?.error ||
          (typeof data === "string" ? data : JSON.stringify(data)) ||
          e?.message ||
          "Failed to load technician.";
        setErr(`Failed to load technician. HTTP ${status || "?"}: ${serverMsg}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isCreate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const name = form.name.trim();
    if (!name) return setErr("Name is required.");

    const payload = {
      name,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: String(form.status || "ACTIVE").trim().toUpperCase(),
    };

    try {
      setLoading(true);
      if (isCreate) {
        await techniciansApi.create(payload);
        setMsg("✅ Technician created!");
      } else {
        await techniciansApi.update(id, payload);
        setMsg("✅ Technician updated!");
      }
      setTimeout(() => navigate("/technicians"), 600);
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        e2?.message ||
        "Save failed.";
      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="m-0 text-xl font-semibold text-slate-100">
        {isCreate ? "Add Technician" : `Edit Technician #${id}`}
      </h2>

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
            <input name="name" value={form.name} onChange={onChange} className={inputCls} />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Email</span>
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="tech@company.com"
              className={inputCls}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="9876543210"
              className={inputCls}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Status</span>
            <select name="status" value={form.status} onChange={onChange} className={inputCls}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? "Saving..." : isCreate ? "Create" : "Update"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/technicians")}
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
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";
