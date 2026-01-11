import { useEffect, useMemo, useState } from "react";
import { auditApi } from "../api/audit.api";
import Badge from "../ui/Badge";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // entity filter: "ALL" or a real entityType value (ex: "CUSTOMER", "CORE_SWITCH")
  const [entity, setEntity] = useState("ALL");

  // client-side paging (Load more)
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await auditApi.getRecent(); // should be array already
      const arr = Array.isArray(data) ? data : [];
      setLogs(arr);
      setVisibleCount(PAGE_SIZE); // reset paging on refresh
    } catch (e) {
      const status = e?.response?.status;
      const body = e?.response?.data;
      setErr(
        `Failed to load audit logs. HTTP ${status || "?"}: ${JSON.stringify(body || e.message)}`
      );
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build dropdown options dynamically from actual data
  const entityOptions = useMemo(() => {
    const set = new Set();
    for (const l of logs) {
      const t = String(l?.entityType ?? "").trim();
      if (t) set.add(t.toUpperCase());
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [logs]);

  // Filter logs by entity
  const filtered = useMemo(() => {
    if (entity === "ALL") return logs;
    return logs.filter(
      (x) => String(x.entityType).toUpperCase() === String(entity).toUpperCase()
    );
  }, [logs, entity]);

  // Apply "Load more" window after filtering
  const visibleRows = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const canLoadMore = visibleCount < filtered.length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading audit logs...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Audit Logs</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Entity:
            <select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              {entityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "All" : opt.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <button
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            onClick={() => {
              setEntity("ALL");
              setVisibleCount(PAGE_SIZE);
            }}
          >
            All
          </button>

          <button
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            onClick={() => {
              setEntity("CUSTOMER");
              setVisibleCount(PAGE_SIZE);
            }}
          >
            Customers Only
          </button>

          <div className="ml-auto text-sm text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-100">
              {Math.min(visibleCount, filtered.length)}
            </span>{" "}
            / {filtered.length}
          </div>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No audit logs found.
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <div className="w-full overflow-x-auto">
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
                        Details
                      </th>
                      <th className="w-[140px] px-3 py-2 text-left text-xs font-semibold text-slate-300 whitespace-nowrap">
  Request ID
</th>

                    </tr>
                  </thead>

                  <tbody>
                    {visibleRows.map((l) => (
                      <tr
                        key={l.id}
                        className="border-t border-slate-800 align-top transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{formatTime(l.createdAt)}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{l.actor ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          <ActionBadge value={l.action} />
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {(l.entityType ?? "-").replaceAll("_", " ")}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">{l.entityId ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{l.details ?? "-"}</td>
                       <td className="px-3 py-3 text-sm text-slate-200">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation?.();
      copyText(l.requestId);
    }}
    title={l.requestId ? `Click to copy\n${l.requestId}` : "—"}
    className="inline-flex max-w-[120px] items-center truncate rounded-full border border-slate-700 bg-slate-900/40 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
  >
    {shortId(l.requestId)}
  </button>
</td>



                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {canLoadMore && (
                <button
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))}
                >
                  Load more
                </button>
              )}

              <div className="text-xs text-slate-400">
                {entity === "ALL" ? "All logs" : `${entity.replaceAll("_", " ")} logs`}
              </div>
            </div>
          </>
        )}
      </div>
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

function ActionBadge({ value }) {
  const raw = String(value ?? "-");
  const v = raw.toUpperCase();

  // ✅ Map your real actions to colors
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

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(String(text));
  } catch {
    // fallback for older browsers / blocked clipboard
    const ta = document.createElement("textarea");
    ta.value = String(text);
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      ta.remove();
    }
  }
}
