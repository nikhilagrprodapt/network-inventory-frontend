import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { assetsApi } from "../api/assets.api";

// ✅ Match backend enums (do NOT include STB)
const ASSET_TYPES = [
  "",
  "ONT",
  "ROUTER",
  "SWITCH",
  "SPLITTER",
  "FDH",
  "CORE_SWITCH",
  "HEADEND",
  "FIBER_CABLE",
  "FIBER_ROLL",
]; // keep "" = All

// ✅ Match backend AssetStatus enum (include FAULTY)
const ASSET_STATUSES = ["", "AVAILABLE", "ASSIGNED", "FAULTY", "RETIRED"];

const inputCls =
  "h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40";

export default function AssetsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await assetsApi.getAll({ type, status });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Failed to load assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status]);

  const normalizedStatus = (s) => String(s ?? "").toUpperCase();

  const onUnassign = async (assetId) => {
    if (!assetId) return;
    if (!confirm(`Unassign/Reclaim asset #${assetId}?`)) return;

    setBusyId(assetId);
    setErr("");
    try {
      await assetsApi.unassign(assetId);
      await load();
    } catch (e2) {
      const statusCode = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        e2.message;

      setErr(`HTTP ${statusCode || "?"}: ${serverMsg}`);
    } finally {
      setBusyId(null);
    }
  };

  // ✅ NEW (Journey-3): update status (AVAILABLE / FAULTY / RETIRED)
  const onUpdateStatus = async (assetId, nextStatus) => {
    if (!assetId) return;

    const label =
      nextStatus === "AVAILABLE"
        ? "set to AVAILABLE"
        : nextStatus === "FAULTY"
        ? "mark FAULTY"
        : nextStatus === "RETIRED"
        ? "mark RETIRED"
        : `set to ${nextStatus}`;

    if (!confirm(`Asset #${assetId}: ${label}?`)) return;

    setBusyId(assetId);
    setErr("");
    try {
      await assetsApi.updateStatus(assetId, nextStatus);
      await load();
    } catch (e2) {
      const statusCode = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        e2.message;

      setErr(`HTTP ${statusCode || "?"}: ${serverMsg}`);
    } finally {
      setBusyId(null);
    }
  };

  const filteredCountLabel = useMemo(() => {
    const parts = [];
    if (type) parts.push(`Type: ${type}`);
    if (status) parts.push(`Status: ${status}`);
    return parts.length ? `(${parts.join(", ")})` : "";
  }, [type, status]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading assets...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
        {err}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">
            Assets{" "}
            <span className="text-sm font-medium text-slate-400">{filteredCountLabel}</span>
          </h2>

          {/* Filters */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {ASSET_TYPES.map((t) => (
                  <option key={t || "ALL"} value={t}>
                    {t || "All"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {ASSET_STATUSES.map((s) => (
                  <option key={s || "ALL"} value={s}>
                    {s || "All"}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={load}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Refresh
            </button>

            {/* ✅ Quick filters for Journey-3 */}
            <button
              onClick={() => {
                setType("ONT");
                setStatus("AVAILABLE");
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-700/40 bg-emerald-950/40 px-4 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-950/60 active:scale-[0.99]"
              title="Show Available ONTs"
            >
              Available ONTs
            </button>

            <button
              onClick={() => {
                setType("ONT");
                setStatus("");
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
              title="Show all ONTs"
            >
              All ONTs
            </button>
          </div>
        </div>

        <Link
          to="/assets/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          + Add Asset
        </Link>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No assets found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Model</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Serial</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Assigned To</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Assigned At</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((a) => {
                    const s = normalizedStatus(a.status);
                    const isAssigned = s === "ASSIGNED" || !!a.assignedCustomerId;

                    return (
                      <tr
                        key={a.assetId}
                        className="border-t border-slate-800 transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{a.assetId}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{a.type ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{a.model ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{a.serialNumber ?? "-"}</td>

                        <td className="px-3 py-3 text-sm text-slate-200">
                          <AssetStatusBadge status={a.status} />
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-200">{a.assignedCustomerId ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {a.assignedAt ? new Date(a.assignedAt).toLocaleString() : "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/assets/${a.assetId}/assign`}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                            >
                              Assign
                            </Link>

                            <Link
                              to={`/assets/${a.assetId}/history`}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                            >
                              History
                            </Link>

                            {/* ✅ Existing Unassign (only when assigned) */}
                            {s === "ASSIGNED" && (
                              <button
                                onClick={() => onUnassign(a.assetId)}
                                disabled={busyId === a.assetId}
                                className={[
                                  "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                                  "border-red-900/50 bg-red-950/30 text-red-200 hover:bg-red-950/50",
                                  busyId === a.assetId ? "opacity-70 cursor-not-allowed" : "",
                                ].join(" ")}
                              >
                                {busyId === a.assetId ? "Unassigning..." : "Unassign"}
                              </button>
                            )}

                            {/* ✅ NEW (Journey-3): Status actions (disabled while assigned) */}
                            <button
                              onClick={() => onUpdateStatus(a.assetId, "FAULTY")}
                              disabled={busyId === a.assetId || isAssigned}
                              title={isAssigned ? "Unassign first" : "Mark this asset as FAULTY"}
                              className={[
                                "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                                "border-amber-700/40 bg-amber-950/30 text-amber-200 hover:bg-amber-950/50",
                                busyId === a.assetId || isAssigned ? "opacity-60 cursor-not-allowed" : "",
                              ].join(" ")}
                            >
                              {busyId === a.assetId ? "..." : "Mark FAULTY"}
                            </button>

                            <button
                              onClick={() => onUpdateStatus(a.assetId, "RETIRED")}
                              disabled={busyId === a.assetId || isAssigned}
                              title={isAssigned ? "Unassign first" : "Retire this asset"}
                              className={[
                                "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                                "border-red-900/40 bg-red-950/20 text-red-200 hover:bg-red-950/40",
                                busyId === a.assetId || isAssigned ? "opacity-60 cursor-not-allowed" : "",
                              ].join(" ")}
                            >
                              {busyId === a.assetId ? "..." : "Retire"}
                            </button>

                            <button
                              onClick={() => onUpdateStatus(a.assetId, "AVAILABLE")}
                              disabled={busyId === a.assetId || isAssigned}
                              title={isAssigned ? "Unassign first" : "Set this asset back to AVAILABLE"}
                              className={[
                                "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                                "border-emerald-700/40 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50",
                                busyId === a.assetId || isAssigned ? "opacity-60 cursor-not-allowed" : "",
                              ].join(" ")}
                            >
                              {busyId === a.assetId ? "..." : "Set AVAILABLE"}
                            </button>
                          </div>

                          {isAssigned && (
                            <div className="mt-2 text-[11px] text-slate-500">
                              Status update disabled while ASSIGNED (unassign first)
                            </div>
                          )}
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

function AssetStatusBadge({ status }) {
  const s = String(status ?? "").toUpperCase();

  const cls =
    s === "AVAILABLE"
      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
      : s === "ASSIGNED"
      ? "border-blue-700/40 bg-blue-950/40 text-blue-200"
      : s === "FAULTY"
      ? "border-amber-700/40 bg-amber-950/40 text-amber-200"
      : s === "RETIRED"
      ? "border-red-900/40 bg-red-950/40 text-red-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status ?? "-"}
    </span>
  );
}
