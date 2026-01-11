import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { headendsApi } from "../api/headends.api";

export default function HeadendForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = mode === "create";

  const [form, setForm] = useState({
    name: "",
    location: "",
    bandwidthCapacityMbps: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const showSuccess = (t) => {
    setMsg(t);
    setErr("");
    setTimeout(() => setMsg(""), 2000);
  };

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
        const data = await headendsApi.getOne(id);
        setForm({
          name: data.name ?? "",
          location: data.location ?? "",
          bandwidthCapacityMbps: data.bandwidthCapacityMbps ?? "",
        });
      } catch {
        setErr("Failed to load headend.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isCreate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const name = form.name.trim();
    if (!name) return setErr("Name is required.");

    const bwRaw = String(form.bandwidthCapacityMbps ?? "").trim();
    const bw = bwRaw ? Number(bwRaw) : null;
    if (bwRaw && Number.isNaN(bw)) return setErr("Bandwidth must be a valid number.");

    const payload = {
      name,
      location: form.location.trim() || null,
      bandwidthCapacityMbps: bw,
    };

    try {
      setLoading(true);

      if (isCreate) {
        await headendsApi.create(payload);
        showSuccess("✅ Headend created!");
      } else {
        await headendsApi.update(id, payload);
        showSuccess("✅ Headend updated!");
      }

      setTimeout(() => navigate("/headends"), 600);
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        "Save failed.";
      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !msg && !isCreate) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h2 className="m-0 text-xl font-semibold text-slate-100">
        {isCreate ? "Add Headend" : `Edit Headend #${id}`}
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
            <span className="text-xs font-medium text-slate-300">Bandwidth Capacity (Mbps)</span>
            <input
              name="bandwidthCapacityMbps"
              value={form.bandwidthCapacityMbps}
              onChange={onChange}
              placeholder="e.g. 100000"
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {loading ? "Saving..." : isCreate ? "Create" : "Update"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/headends")}
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
