import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customersApi } from "../api/customers.api";

export default function PlannerCustomersList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await customersApi.getAll();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Failed to load customers.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Customers (Planner)</h2>

        <button
          onClick={load}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
        >
          Refresh
        </button>
      </div>

      {err && (
        <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
          {err}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {loading ? (
          <div className="text-slate-300">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="text-slate-300">
                <tr className="border-b border-slate-800">
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Neighborhood</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.customerId ?? c.id} className="border-b border-slate-900/60">
                    <td className="p-3">{c.customerId ?? c.id}</td>
                    <td className="p-3 font-semibold">{c.name}</td>
                    <td className="p-3">{c.plan}</td>
                    <td className="p-3">{c.neighborhood}</td>
                    <td className="p-3">{c.status}</td>
                    <td className="p-3">
                      <Link
                        to={`/customers/${c.customerId ?? c.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-900/50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td className="p-3 text-slate-400" colSpan={6}>
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-400">
        Planner access is View-only. Use <b>New Onboarding</b> to create + assign splitter/port + devices + task.
      </p>
    </div>
  );
}
