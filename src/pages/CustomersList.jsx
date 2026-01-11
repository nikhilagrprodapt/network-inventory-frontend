import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { customersApi } from "../api/customers.api";

export default function CustomersList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Search by name or ID
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
    const query = q.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((c) => {
      const id = c.id ?? c.customerId ?? c.customer_id ?? c.customerID;
      const name = String(c.name ?? "").toLowerCase();
      const idStr = String(id ?? "").toLowerCase();
      return name.includes(query) || idStr.includes(query);
    });
  }, [customers, q]);

  const onDelete = async (id) => {
    if (!id) return alert("Customer ID missing in response!");
    if (!confirm(`Delete customer ${id}?`)) return;
    try {
      await customersApi.remove(id);
      await load();
    } catch {
      alert("Delete failed");
    }
  };

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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Customers</h2>

        <div className="flex items-center gap-2">
          <Link
            to="/customers/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add Customer
          </Link>

          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ✅ Search */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="grid gap-1 text-sm text-slate-300 w-full sm:w-[360px]">
            <span className="font-medium">Search customer (Name or ID)</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. House A1.2 or 2"
              className={inputCls}
            />
          </label>

          <div className="text-xs text-slate-400">
            Showing <span className="text-slate-200 font-semibold">{filtered.length}</span>{" "}
            of <span className="text-slate-200 font-semibold">{customers.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
              No customers match your search.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800">
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
                    {filtered.map((c, idx) => {
                      const id = c.id ?? c.customerId ?? c.customer_id ?? c.customerID;

                      return (
                        <tr
                          key={id ?? idx}
                          className="border-t border-slate-800 transition hover:bg-slate-900/50"
                        >
                          <td className="px-3 py-3 text-sm text-slate-200">{id ?? "-"}</td>
                          <td className="px-3 py-3 text-sm font-medium text-slate-100">
                            {c.name ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-200">{c.plan ?? "-"}</td>
                          <td className="px-3 py-3 text-sm text-slate-200">
                            {c.neighborhood ?? "-"}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              {/* ✅ Label matches screenshot */}
                              <Link
                                to={`/customers/${id}`}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                              >
                                View Connection Details
                              </Link>

                              <Link
                                to={`/customers/${id}/edit`}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                              >
                                Edit
                              </Link>

                              <button
                                onClick={() => onDelete(id)}
                                className="inline-flex items-center justify-center rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-950/50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";
