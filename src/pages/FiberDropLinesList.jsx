import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fiberDropLinesApi } from "../api/fiberDropLines.api";
import { splittersApi } from "../api/splitters.api";
import { customersApi } from "../api/customers.api";

function StatusPill({ status }) {
  const s = String(status || "").toUpperCase();
  const cls =
    s === "ACTIVE"
      ? "border-emerald-600/50 bg-emerald-950/40 text-emerald-200"
      : s === "DISCONNECTED"
      ? "border-red-600/50 bg-red-950/40 text-red-200"
      : "border-slate-700 bg-slate-900/40 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {s || "UNKNOWN"}
    </span>
  );
}

export default function FiberDropLinesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromSplitterIdFilter = searchParams.get("fromSplitterId") || "";
  const statusFilter = searchParams.get("status") || "";

  const [lines, setLines] = useState([]);
  const [splitters, setSplitters] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [l, s, c] = await Promise.all([
        fiberDropLinesApi.getAll(),
        splittersApi.getAll(),
        customersApi.getAll(),
      ]);

      let list = Array.isArray(l) ? l : [];

      if (fromSplitterIdFilter) {
        list = list.filter((x) => String(x.fromSplitterId) === String(fromSplitterIdFilter));
      }
      if (statusFilter) {
        list = list.filter((x) => String(x.status) === String(statusFilter));
      }

      setLines(list);
      setSplitters(Array.isArray(s) ? s : []);
      setCustomers(Array.isArray(c) ? c : []);
    } catch {
      setErr("Failed to load fiber drop lines / splitters / customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromSplitterIdFilter, statusFilter]);

  const splitterMap = useMemo(() => {
    const map = new Map();
    splitters.forEach((s) => {
      const id = s.splitterId ?? s.id;
      if (id != null) map.set(id, `${id} — ${s.name ?? "Splitter"} (${s.model ?? "no model"})`);
    });
    return map;
  }, [splitters]);

  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      const id = c.customerId ?? c.id;
      if (id != null) map.set(id, `${id} — ${c.name ?? "Customer"} (${c.status ?? "UNKNOWN"})`);
    });
    return map;
  }, [customers]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading Fiber Drop Lines...
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
        <h2 className="m-0 text-xl font-semibold text-slate-100">Fiber Drop Lines</h2>

        <div className="flex items-center gap-2">
          <Link
            to="/fiber-drop-lines/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add Fiber Line
          </Link>

          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">From Splitter</span>
            <input
              value={fromSplitterIdFilter}
              onChange={(e) => {
                const v = e.target.value.trim();
                const next = new URLSearchParams(searchParams);
                if (!v) next.delete("fromSplitterId");
                else next.set("fromSplitterId", v);
                setSearchParams(next);
              }}
              placeholder="e.g. 10"
              className="h-10 w-40 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                const v = e.target.value;
                const next = new URLSearchParams(searchParams);
                if (!v) next.delete("status");
                else next.set("status", v);
                setSearchParams(next);
              }}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">All</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISCONNECTED">DISCONNECTED</option>
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
        {lines.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No fiber drop lines found.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">From Splitter</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">To Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Length (m)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {lines.map((l, idx) => {
                    const splitterLabel =
                      splitterMap.get(l.fromSplitterId) ??
                      `${l.fromSplitterId ?? "-"} — (unknown splitter)`;
                    const customerLabel =
                      customerMap.get(l.toCustomerId) ??
                      `${l.toCustomerId ?? "-"} — (unknown customer)`;

                    return (
                      <tr
                        key={l.lineId ?? idx}
                        className="border-t border-slate-800 transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{l.lineId}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{splitterLabel}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{customerLabel}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{l.lengthMeters ?? "-"}</td>
                        <td className="px-3 py-3">
                          <StatusPill status={l.status} />
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
