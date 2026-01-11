import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../../api/customers.api";

export default function SupportCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await customersApi.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;

    return customers.filter((c) => {
      const id = String(c.customerId ?? c.id ?? "");
      const name = String(c.name ?? "").toLowerCase();
      return id.includes(s) || name.includes(s);
    });
  }, [customers, q]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading customers...
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">
            Support · Customers
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Search customer and open connection details to deactivate and reclaim assets.
          </p>
        </div>

        <button
          onClick={load}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-200">
          Search customer (Name or ID)
        </label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. House A1.2 or 2"
          className="mt-2 h-10 w-full max-w-md rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
        />

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0f172a]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Plan
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Neighborhood
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-3 text-sm text-slate-300"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => {
                    const id = c.customerId ?? c.id;
                    return (
                      <tr
                        key={id ?? idx}
                        className="border-t border-slate-800 transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {id ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-slate-100">
                          {c.name ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {c.plan ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {c.neighborhood ?? "-"}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() =>
                              navigate(`/support/customers/${id}`)
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                          >
                            View Connection Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-2 text-xs text-slate-400">
          Showing {filtered.length} of {customers.length}
        </div>
      </div>
    </div>
  );
}
