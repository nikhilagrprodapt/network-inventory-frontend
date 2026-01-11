import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { splittersApi } from "../api/splitters.api";
import { fdhsApi } from "../api/fdhs.api";

export default function SplittersList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fdhIdFilter = searchParams.get("fdhId") || "";

  const [items, setItems] = useState([]);
  const [fdhs, setFdhs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [s, f] = await Promise.all([splittersApi.getAll(), fdhsApi.getAll()]);

      let list = Array.isArray(s) ? s : [];
      const fdhList = Array.isArray(f) ? f : [];

      if (fdhIdFilter) {
        list = list.filter((x) => String(x.fdhId) === String(fdhIdFilter));
      }

      setItems(list);
      setFdhs(fdhList);
    } catch {
      setErr("Failed to load splitters / FDHs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fdhIdFilter]);

  const fdhMap = useMemo(() => {
    const map = new Map();
    fdhs.forEach((f) => {
      const id = f.fdhId ?? f.id;
      if (id != null) map.set(id, `${id} — ${f.name ?? "FDH"} (${f.region ?? "no region"})`);
    });
    return map;
  }, [fdhs]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading splitters...
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
          Splitters{" "}
          {fdhIdFilter ? (
            <span className="text-sm font-medium text-slate-400">(FDH {fdhIdFilter})</span>
          ) : null}
        </h2>

        <Link
          to="/splitters/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          + Add Splitter
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-300">Filter by FDH</span>
            <select
              value={fdhIdFilter}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) setSearchParams({});
                else setSearchParams({ fdhId: v });
              }}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All</option>
              {fdhs.map((f) => (
                <option key={f.fdhId} value={f.fdhId}>
                  {f.fdhId} — {f.name}
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

          <button
            onClick={load}
            className="ml-auto inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>

        {/* Table / Empty */}
        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No splitters found.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      Splitter ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      Model
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      Port Capacity
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      FDH
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((s, idx) => {
                    const fdhLabel = fdhMap.get(s.fdhId) ?? `${s.fdhId ?? "-"} — (unknown FDH)`;

                    return (
                      <tr
                        key={s.splitterId ?? idx}
                        className="border-t border-slate-800 transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{s.splitterId}</td>
                        <td className="px-3 py-3 text-sm font-medium text-slate-100">
                          {s.name ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">{s.model ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{s.portCapacity ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{fdhLabel}</td>
                        <td className="px-3 py-3">
                          <button
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                            onClick={() => navigate(`/fiber-drop-lines?fromSplitterId=${s.splitterId}`)}
                          >
                            View Fiber Lines →
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
