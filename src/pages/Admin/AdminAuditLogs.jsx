import { useEffect, useMemo, useState } from "react";
import Badge from "../../ui/Badge";
import { auditAdminApi } from "../../api/auditAdmin.api";

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

export default function AdminAuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filters
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [days, setDays] = useState(7);

  // Details drawer
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");
  const [detail, setDetail] = useState(null);

  const entityOptions = useMemo(() => {
    const s = new Set();
    for (const r of rows) {
      const t = String(r?.entityType ?? "").trim();
      if (t) s.add(t.toUpperCase());
    }
    return ["", ...Array.from(s).sort()];
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await auditAdminApi.search({
        actor,
        action,
        entityType,
        days,
        limit: 500,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      const status = e?.response?.status;
      const body = e?.response?.data;
      setErr(
        `Failed to load audit logs. HTTP ${status || "?"}: ${JSON.stringify(body || e.message)}`
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetails = async (id) => {
    if (!id) return;
    setSelectedId(id);
    setOpen(true);
    setDetail(null);
    setDetailErr("");
    setDetailLoading(true);
    try {
      const d = await auditAdminApi.getById(id);
      setDetail(d || null);
    } catch (e) {
      const status = e?.response?.status;
      const body = e?.response?.data;
      setDetailErr(
        `Failed to load audit details. HTTP ${status || "?"}: ${JSON.stringify(body || e.message)}`
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      const blob = await auditAdminApi.exportCsv({ actor, action, entityType, days });
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;

      const ts = new Date().toISOString().replaceAll(":", "-");
      a.download = `audit_export_${ts}.csv`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Make sure you are logged in as ADMIN.");
    }
  };

  return (
    <div>
      {/* Header (clean) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">Admin Audit (UJ6)</h2>
          <div className="mt-1 text-xs text-slate-400">
            Filter by actor/action/entity/date window and export to CSV.
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing{" "}
          <span className="font-semibold text-slate-100">{rows.length}</span>{" "}
          record{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Filters + Actions inside card */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-sm text-slate-300">
            <span className="font-medium">Actor</span>
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g. admin"
              className={inputCls}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            <span className="font-medium">Action</span>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. TOPOLOGY VIEW, DEACTIVATE"
              className={inputCls}
            />
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            <span className="font-medium">Entity Type</span>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={inputCls}>
              <option value="">All</option>
              {entityOptions
                .filter((x) => x)
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replaceAll("_", " ")}
                  </option>
                ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-slate-300">
            <span className="font-medium">Days</span>
            <input
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value || 7))}
              className={inputCls}
            />
          </label>

          {/* ✅ Buttons moved into filter card */}
          <div className="grid gap-2">
            <div className="text-sm font-medium text-slate-300 opacity-0">Actions</div>
            <div className="flex gap-2">
              <button
                onClick={load}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Search
              </button>

              <button
                onClick={exportCsv}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {/* Table */}
        <div className="mt-4">
          {loading ? (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
              Loading audit logs...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
              No audit logs found for current filters.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <div className="w-full overflow-x-auto">
                {/* ✅ readability: wider min width */}
                <table className="w-full table-fixed border-collapse">
                  <thead>
                    <tr className="bg-[#0f172a]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                        Time
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                        Actor
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                        Action
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                        Entity
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                        Entity ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
                        Details (preview)
                      </th>
                      <th className="w-[140px] px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
  Request ID
</th>

                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => openDetails(l.id)}
                        className="cursor-pointer border-t border-slate-800 align-top transition hover:bg-slate-900/50"
                        title="Click to view full context"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200 whitespace-nowrap">
                          {formatTime(l.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200 whitespace-nowrap">
                          {l.actor ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200 whitespace-nowrap">
                          <ActionBadge value={l.action} />
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200 whitespace-nowrap">
                          {(l.entityType ?? "-").replaceAll("_", " ")}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200 whitespace-nowrap">
                          {l.entityId ?? "-"}
                        </td>

                        {/* ✅ readability: wrap + max width */}
                        <td className="px-3 py-3 text-sm text-slate-200 max-w-[520px]">
                          <span className="block break-words">
                            {shortText(l.details, 110)}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-sm text-slate-200" title={l.requestId ?? ""}>
  <span className="inline-flex max-w-[120px] truncate rounded-full border border-slate-700 bg-slate-900/40 px-2.5 py-1 text-xs font-semibold text-slate-200">
    {shortId(l.requestId)}
  </span>
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

      {/* Details Drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setOpen(false);
              setSelectedId(null);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto border-l border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-100">Audit Details</div>
                <div className="text-xs text-slate-400">ID: {selectedId}</div>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  setSelectedId(null);
                }}
                className="rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-900/50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4">
              {detailLoading ? (
                <div className="text-slate-300">Loading full context...</div>
              ) : detailErr ? (
                <div className="rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
                  {detailErr}
                </div>
              ) : !detail ? (
                <div className="text-slate-300">No detail found.</div>
              ) : (
                <div className="grid gap-3 text-sm">
                  <KV label="Time" value={formatTime(detail.createdAt)} />
                  <KV label="Actor" value={detail.actor} />
                  <KV label="Action" value={<ActionBadge value={detail.action} />} />
                  <KV label="Entity Type" value={(detail.entityType ?? "-").replaceAll("_", " ")} />
                  <KV label="Entity ID" value={detail.entityId ?? "-"} />
                  <KV label="Request ID" value={detail.requestId ?? "-"} />
                  <KV
                    label="Details"
                    value={
                      <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-[#0f172a] p-3 text-xs text-slate-200">
                        {detail.details ?? "-"}
                      </pre>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-slate-100">{value ?? "-"}</div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

function shortId(x) {
  if (!x) return "-";
  const s = String(x);
  return s.length > 12 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;
}

function shortText(x, n = 60) {
  if (!x) return "-";
  const s = String(x);
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/** ✅ Updated mapping so your real actions become colorful */
function ActionBadge({ value }) {
  const raw = String(value ?? "-");
  const v = raw.toUpperCase();

  const kind =
    v.includes("TOPOLOGY") ? "TOPOLOGY" :
    v.includes("NODE") ? "NODE" :
    v.includes("VIEW") ? "VIEW" :
    v.includes("DEACTIVATE") || v.includes("DISCONNECT") ? "DEACTIVATE" :
    v.includes("ONBOARD") || v.includes("CONFIRM") ? "ONBOARDING" :
    v.includes("ASSIGN") || v.includes("UNASSIGN") ? "ASSIGN" :
    v.includes("CREATE") || v.includes("CREATED") ? "CREATE" :
    v.includes("DELETE") || v.includes("DELETED") ? "DELETE" :
    v.includes("STATUS") ? "STATUS_CHANGE" :
    v.includes("UPDATE") || v.includes("NOTE") || v.includes("CHECKLIST") ? "UPDATE" :
    v;

  const variant =
    kind === "TOPOLOGY"
      ? "purple"
      : kind === "NODE"
      ? "warn"
      : kind === "VIEW"
      ? "info"
      : kind === "DEACTIVATE"
      ? "danger"
      : kind === "ONBOARDING"
      ? "success"
      : kind === "CREATE"
      ? "success"
      : kind === "UPDATE"
      ? "info"
      : kind === "DELETE"
      ? "danger"
      : kind === "ASSIGN"
      ? "warn"
      : kind === "STATUS_CHANGE"
      ? "purple"
      : "neutral";

  const label = v.replaceAll("_", " ");
  return <Badge variant={variant}>{label}</Badge>;
}
