import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { headendsApi } from "../api/headends.api";

export default function HeadendsList() {
  const navigate = useNavigate();
  const [headends, setHeadends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await headendsApi.getAll();
      setHeadends(Array.isArray(data) ? data : []);
    } catch {
      setErr("Failed to load headends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading headends...
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
        <h2 className="m-0 text-xl font-semibold text-slate-100">Headends</h2>

        <div className="flex items-center gap-2">
          <Link
            to="/headends/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add Headend
          </Link>

          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {headends.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No headends found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Bandwidth (Mbps)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {headends.map((h, idx) => (
                    <tr
                      key={h.headendId ?? idx}
                      className="border-t border-slate-800 transition hover:bg-slate-900/50"
                    >
                      <td className="px-3 py-3 text-sm text-slate-200">{h.headendId}</td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-100">{h.name ?? "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-200">{h.location ?? "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-200">{h.bandwidthCapacityMbps ?? "-"}</td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/headends/${h.headendId}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                          >
                            Edit
                          </Link>

                          <button
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                            onClick={() => navigate(`/fdh?headendId=${h.headendId}`)}
                          >
                            View FDHs →
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
