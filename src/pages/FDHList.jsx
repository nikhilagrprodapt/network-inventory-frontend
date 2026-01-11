import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fdhsApi } from "../api/fdhs.api";
import { headendsApi } from "../api/headends.api";

export default function FDHList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const headendIdFilter = searchParams.get("headendId") || "";

  const [items, setItems] = useState([]);
  const [headends, setHeadends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [f, h] = await Promise.all([fdhsApi.getAll(), headendsApi.getAll()]);

      let list = Array.isArray(f) ? f : [];

      if (headendIdFilter) {
        list = list.filter((x) => String(x.headendId) === String(headendIdFilter));
      }

      setItems(list);
      setHeadends(Array.isArray(h) ? h : []);
    } catch {
      setErr("Failed to load FDHs / Headends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headendIdFilter]);

  const headendMap = useMemo(() => {
    const map = new Map();
    headends.forEach((h) => {
      const id = h.headendId ?? h.id;
      if (id != null) {
        map.set(id, `${id} — ${h.name ?? "Headend"} (${h.location ?? "no location"})`);
      }
    });
    return map;
  }, [headends]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading FDHs...
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
        <h2 className="m-0 text-xl font-semibold text-slate-100">
          FDH{" "}
          {headendIdFilter ? (
            <span className="text-sm font-medium text-slate-400">(Headend {headendIdFilter})</span>
          ) : null}
        </h2>

        <div className="flex items-center gap-2">
          <Link
            to="/fdh/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add FDH
          </Link>

          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-300">Filter by Headend</span>
            <select
              value={headendIdFilter}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) setSearchParams({});
                else setSearchParams({ headendId: v });
              }}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All</option>
              {headends.map((h) => (
                <option key={h.headendId} value={h.headendId}>
                  {h.headendId} — {h.name}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => setSearchParams({})}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Clear
          </button>
        </div>

        {/* Table / Empty */}
        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No FDHs found.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">FDH ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Region</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Max Ports</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Headend</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((f, idx) => {
                    const headendLabel =
                      headendMap.get(f.headendId) ?? `${f.headendId ?? "-"} — (unknown headend)`;

                    return (
                      <tr
                        key={f.fdhId ?? idx}
                        className="border-t border-slate-800 transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{f.fdhId}</td>
                        <td className="px-3 py-3 text-sm font-medium text-slate-100">{f.name ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{f.location ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{f.region ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{f.maxPorts ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{headendLabel}</td>
                        <td className="px-3 py-3">
                          <button
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                            onClick={() => navigate(`/splitters?fdhId=${f.fdhId}`)}
                          >
                            View Splitters →
                          </button>
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
  );
}
