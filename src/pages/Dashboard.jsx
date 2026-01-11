import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard.api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const d = await dashboardApi.get();
      setData(d);
    } catch (e) {
      console.error("Dashboard load error:", e);
      const status = e?.response?.status;
      const resp = e?.response?.data;
      setErr(
        `Failed to load dashboard. HTTP ${status || "?"}: ${
          resp?.message || resp?.error || JSON.stringify(resp || e.message)
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const d = data || {};
    return {
      customers: d.customers ?? 0,
      activeCustomers: d.activeCustomers ?? 0,
      pendingCustomers: d.pendingCustomers ?? 0,
      splitters: d.splitters ?? 0,
      fdhs: d.fdhs ?? 0,
      headends: d.headends ?? 0,
      coreSwitches: d.coreSwitches ?? 0,
      fiberLines: d.fiberDropLines ?? 0,
      activeLines: d.activeFiberLines ?? 0,
      disconnectedLines: d.disconnectedFiberLines ?? 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading dashboard...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 break-words">
        {err}
      </div>
    );
  }

  const recentCustomers = Array.isArray(data?.recentCustomers)
    ? data.recentCustomers
    : [];
  const recentAuditLogs = Array.isArray(data?.recentAuditLogs)
    ? data.recentAuditLogs
    : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Dashboard</h2>

        <button
          onClick={load}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          Refresh
        </button>
      </div>

      {/* KPI grid */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card title="Customers" value={counts.customers} link="/customers" />
        <Card title="Active Customers" value={counts.activeCustomers} />
        <Card title="Pending Customers" value={counts.pendingCustomers} />
        <Card title="Splitters" value={counts.splitters} link="/splitters" />
        <Card title="FDH" value={counts.fdhs} link="/fdh" />
        <Card title="Headends" value={counts.headends} link="/headends" />
        <Card
          title="Core Switches"
          value={counts.coreSwitches}
          link="/core-switches"
        />
        <Card
          title="Fiber Drop Lines"
          value={counts.fiberLines}
          link="/fiber-drop-lines"
        />
        <Card title="Active Fiber Lines" value={counts.activeLines} />
        <Card title="Disconnected Lines" value={counts.disconnectedLines} />
      </div>

      {/* Panels */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Recent Customers">
          <MiniTable
            columns={["ID", "Name", "Status"]}
            rows={recentCustomers
              .slice(0, 8)
              .map((c) => [c.customerId, c.name, c.status])}
          />
          <Link
            to="/customers"
            className="mt-3 inline-flex text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Open Customers →
          </Link>
        </Panel>

        <Panel title="Recent Audit Logs">
          <MiniTable
            columns={["Time", "Action", "Entity", "EntityId"]}
            rows={recentAuditLogs.slice(0, 8).map((l) => [
              formatTime(l.createdAt),
              l.action,
              l.entityType,
              l.entityId,
            ])}
          />
          <Link
            to="/audit"
            className="mt-3 inline-flex text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Open Audit Logs →
          </Link>
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Card({ title, value, link: to }) {
  const body = (
    <div className="group rounded-2xl border border-slate-800 bg-[#0f172a] p-4 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-600 hover:bg-slate-900/40 hover:shadow-md">
      <div className="text-xs font-medium text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-100">
        {value}
      </div>
      {to && (
        <div className="mt-3 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
          View →
        </div>
      )}
    </div>
  );

  if (!to) return body;

  return (
    <Link to={to} className="no-underline text-inherit">
      {body}
    </Link>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-slate-100">{title}</div>
      {children}
    </div>
  );
}

function MiniTable({ columns, rows }) {
  const hasStatusColumn = columns.some((c) => String(c).toLowerCase() === "status");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0f172a]">
              {columns.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-left text-xs font-semibold text-slate-300"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-3 text-sm text-slate-300"
                  colSpan={columns.length}
                >
                  No data
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-t border-slate-800 transition hover:bg-slate-900/50"
                >
                  {r.map((cell, j) => {
                    const colName = columns[j];
                    const isStatusCell =
                      hasStatusColumn &&
                      String(colName).toLowerCase() === "status";

                    if (isStatusCell) {
                      return (
                        <td key={j} className="px-3 py-3 text-sm text-slate-200">
                          <StatusBadge value={cell} />
                        </td>
                      );
                    }

                    return (
                      <td key={j} className="px-3 py-3 text-sm text-slate-200">
                        {cell ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  const v = String(value ?? "").toUpperCase();

  const cls =
    v === "ACTIVE"
      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
      : v === "PENDING"
      ? "border-amber-700/40 bg-amber-950/40 text-amber-200"
      : v === "INACTIVE"
      ? "border-slate-600/50 bg-slate-900/60 text-slate-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value ?? "-"}
    </span>
  );
}

function formatTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}
