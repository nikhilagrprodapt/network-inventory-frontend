import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { techniciansApi } from "../api/technicians.api";

function StatusPill({ value }) {
  const v = String(value ?? "").toUpperCase();
  const cls =
    v === "ACTIVE"
      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
      : v === "INACTIVE"
      ? "border-red-900/50 bg-red-950/35 text-red-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {v || "-"}
    </span>
  );
}

export default function TechniciansList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await techniciansApi.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setErr("Failed to load technicians.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (t) => {
    const next = String(t.status || "").toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await techniciansApi.updateStatus(t.technicianId, next);
      await load();
    } catch {
      alert("Failed to update status");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading technicians...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        {err}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Technicians</h2>

        <div className="flex items-center gap-2">
          <Link
            to="/technicians/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add Technician
          </Link>

          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No technicians found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((t) => (
                    <tr
                      key={t.technicianId}
                      className="border-t border-slate-800 transition hover:bg-slate-900/50"
                    >
                      <td className="px-3 py-3 text-sm text-slate-200">{t.technicianId}</td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-100">{t.name}</td>
                      <td className="px-3 py-3 text-sm text-slate-200">{t.email || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-200">{t.phone || "-"}</td>
                      <td className="px-3 py-3">
                        <StatusPill value={t.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/technicians/${t.technicianId}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => toggleStatus(t)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                          >
                            {String(t.status).toUpperCase() === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
