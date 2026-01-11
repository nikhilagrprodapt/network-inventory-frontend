import React, { useEffect, useMemo, useState } from "react";
import { getHeadends, getTopology } from "../../api/topologyApi";
import TopologyTree from "./TopologyTree";
import TopologyGraph from "./TopologyGraph";
import { api } from "../../api/axios";

/* =========================
   Status Legend
========================= */
function StatusLegend({ statusFilter, setStatusFilter, showOnlyActiveLines }) {
  const items = [
    {
      label: "ACTIVE",
      pill: "border-emerald-700/40 bg-emerald-950/40 text-emerald-200",
      dot: "bg-emerald-500",
    },
    {
      label: "DISCONNECTED",
      pill: "border-red-900/50 bg-red-950/35 text-red-200",
      dot: "bg-red-500",
    },
    {
      label: "PENDING",
      pill: "border-amber-700/40 bg-amber-950/40 text-amber-200",
      dot: "bg-amber-500",
    },
    {
      label: "INACTIVE",
      pill: "border-slate-700 bg-slate-900/50 text-slate-200",
      dot: "bg-slate-400",
    },
  ];

  const activeSet = new Set((statusFilter || []).map((s) => String(s).toUpperCase()));

  const toggle = (label) => {
    const L = label.toUpperCase();
    if (showOnlyActiveLines) return;

    if (activeSet.has(L)) {
      setStatusFilter((prev) => (prev || []).filter((x) => String(x).toUpperCase() !== L));
    } else {
      setStatusFilter((prev) => [...(prev || []), L]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#0b1220] p-4">
      <div className="text-sm font-extrabold text-slate-200">Legend</div>

      {items.map((it) => {
        const selected = activeSet.has(it.label);

        return (
          <button
            key={it.label}
            onClick={() => toggle(it.label)}
            disabled={showOnlyActiveLines}
            title={
              showOnlyActiveLines
                ? "Disabled because 'Show only ACTIVE lines' is ON"
                : "Click to filter"
            }
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
              selected ? it.pill : "border-slate-700 bg-[#0f172a] text-slate-200",
              showOnlyActiveLines ? "cursor-not-allowed opacity-60" : "hover:bg-slate-900/40",
            ].join(" ")}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${it.dot}`} />
            {it.label}
          </button>
        );
      })}

      <span className="ml-auto text-xs text-slate-400">
        Graph edges follow Line/Customer status (dashed = non-active)
      </span>
    </div>
  );
}

/* =========================
   Splitter Summary (Journey 5 Step 4)
========================= */
function computeSplitterSummary(topology) {
  const fdhs = Array.isArray(topology?.fdhs) ? topology.fdhs : [];
  const rows = [];

  fdhs.forEach((fdh) => {
    const splitters = Array.isArray(fdh?.splitters) ? fdh.splitters : [];
    splitters.forEach((sp) => {
      const total = Number(sp?.portCapacity ?? 0) || 0;

      const customers = Array.isArray(sp?.customers) ? sp.customers : [];
      const usedPortsSet = new Set(
        customers
          .map((c) => c?.splitterPort)
          .filter((p) => p !== null && p !== undefined && String(p).trim() !== "")
          .map((p) => Number(p))
          .filter((n) => Number.isFinite(n))
      );

      const used = usedPortsSet.size;
      const free = Math.max(0, total - used);

      rows.push({
        fdhId: fdh?.fdhId,
        fdhName: fdh?.name,
        splitterId: sp?.splitterId,
        splitterName: sp?.name,
        model: sp?.model,
        total,
        used,
        free,
        signalIssues: "—",
      });
    });
  });

  rows.sort((a, b) => {
    const fa = String(a.fdhName ?? "");
    const fb = String(b.fdhName ?? "");
    if (fa !== fb) return fa.localeCompare(fb);
    return String(a.splitterName ?? "").localeCompare(String(b.splitterName ?? ""));
  });

  return rows;
}

function SplitterSummary({ topology }) {
  const rows = useMemo(() => computeSplitterSummary(topology), [topology]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1220] p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-sm font-extrabold text-slate-100">Splitter Summary</div>
          <div className="mt-1 text-xs text-slate-400">
            Total ports / Used / Free (Signal issues placeholder)
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Splitters shown: <span className="font-semibold text-slate-300">{rows.length}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 text-sm text-slate-400">No splitters found under the selected headend.</div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="border-b border-slate-800 py-2 pr-4">FDH</th>
                <th className="border-b border-slate-800 py-2 pr-4">Splitter</th>
                <th className="border-b border-slate-800 py-2 pr-4">Model</th>
                <th className="border-b border-slate-800 py-2 pr-4">Total Ports</th>
                <th className="border-b border-slate-800 py-2 pr-4">Used</th>
                <th className="border-b border-slate-800 py-2 pr-4">Free</th>
                <th className="border-b border-slate-800 py-2">Signal Issues</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.fdhId}-${r.splitterId}`} className="text-slate-200">
                  <td className="border-b border-slate-900/60 py-2 pr-4">
                    <div className="font-semibold text-slate-100">{r.fdhName ?? "—"}</div>
                    <div className="text-xs text-slate-500">ID: {r.fdhId ?? "—"}</div>
                  </td>

                  <td className="border-b border-slate-900/60 py-2 pr-4">
                    <div className="font-semibold text-slate-100">{r.splitterName ?? "—"}</div>
                    <div className="text-xs text-slate-500">ID: {r.splitterId ?? "—"}</div>
                  </td>

                  <td className="border-b border-slate-900/60 py-2 pr-4">{r.model ?? "—"}</td>

                  <td className="border-b border-slate-900/60 py-2 pr-4 font-semibold">{r.total}</td>
                  <td className="border-b border-slate-900/60 py-2 pr-4">{r.used}</td>
                  <td className="border-b border-slate-900/60 py-2 pr-4">{r.free}</td>

                  <td className="border-b border-slate-900/60 py-2">{r.signalIssues}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TopologyPage() {
  const [headends, setHeadends] = useState([]);
  const [selectedHeadendId, setSelectedHeadendId] = useState("");
  const [topology, setTopology] = useState(null);

  const [view, setView] = useState("TREE"); // TREE | GRAPH
  const [showOnlyActiveLines, setShowOnlyActiveLines] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const asArray = (v) => (Array.isArray(v) ? v : []);

  const effectiveStatusFilter = useMemo(() => {
    return showOnlyActiveLines ? [] : statusFilter;
  }, [showOnlyActiveLines, statusFilter]);

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter([]);
    setShowOnlyActiveLines(false);
  };

  const exportPdf = async () => {
    try {
      if (topology?.headendId) {
        await api.post("/api/audit/log", {
          action: "TOPOLOGY_EXPORT",
          entityType: "HEADEND",
          entityId: Number(topology.headendId),
          details: `Export from ${view} view`,
        });
      }
    } catch {
      // do not block export
    }
    window.print();
  };

  /* ---------- load headends ---------- */
  useEffect(() => {
    setError("");
    getHeadends()
      .then((data) => {
        const list = asArray(data);
        setHeadends(list);

        if (list.length > 0) setSelectedHeadendId(String(list[0].headendId));
        else setSelectedHeadendId("");
      })
      .catch((e) => setError(e?.message || "Failed to load headends"));
  }, []);

  /* ---------- load topology for selected headend ---------- */
  useEffect(() => {
    if (!selectedHeadendId) return;

    setLoading(true);
    setError("");
    setTopology(null);

    getTopology(Number(selectedHeadendId))
      .then(async (data) => {
        setTopology(data || null);

        try {
          if (data?.headendId) {
            await api.post("/api/audit/log", {
              action: "TOPOLOGY_VIEW",
              entityType: "HEADEND",
              entityId: Number(data.headendId),
              details: "Topology loaded",
            });
          }
        } catch {
          // ignore
        }
      })
      .catch((e) => setError(e?.message || "Failed to load topology"))
      .finally(() => setLoading(false));
  }, [selectedHeadendId]);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100">Topology</h2>
          <div className="mt-1 text-sm text-slate-400">
            Headend → FDH → Splitter → Fiber Drop Line → Customer
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Root Headend
            <select
              value={selectedHeadendId}
              onChange={(e) => setSelectedHeadendId(e.target.value)}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              {asArray(headends).map((h) => (
                <option key={h.headendId} value={String(h.headendId)}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex overflow-hidden rounded-xl border border-slate-700">
            <button
              onClick={() => setView("TREE")}
              disabled={view === "TREE"}
              className={[
                "px-4 py-2 text-sm font-semibold transition",
                view === "TREE"
                  ? "bg-blue-600 text-white"
                  : "bg-[#0f172a] text-slate-300 hover:bg-slate-900/50",
              ].join(" ")}
            >
              Tree
            </button>

            <button
              onClick={() => setView("GRAPH")}
              disabled={view === "GRAPH"}
              className={[
                "px-4 py-2 text-sm font-semibold transition",
                view === "GRAPH"
                  ? "bg-blue-600 text-white"
                  : "bg-[#0f172a] text-slate-300 hover:bg-slate-900/50",
              ].join(" ")}
            >
              Graph
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showOnlyActiveLines}
              onChange={(e) => setShowOnlyActiveLines(e.target.checked)}
            />
            Show only ACTIVE lines
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search: headend, fdh, splitter, customer, line id…"
          className="h-11 w-full max-w-md rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:ring-2 focus:ring-blue-500/40"
        />

        <button
          onClick={clearFilters}
          className="h-11 rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-900/50"
        >
          Clear filters
        </button>

        {/* ✅ Export PDF next to Clear Filters */}
        <button
          onClick={exportPdf}
          className="h-11 rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          title="Export as PDF (Print → Save as PDF)"
        >
          Export PDF
        </button>

        <div className="text-xs text-slate-400">
          Tip: Search matches names, IDs, model, region, ports, status.
        </div>
      </div>

      <StatusLegend
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showOnlyActiveLines={showOnlyActiveLines}
      />

      {/* Journey 5 Step 4 */}
      {!loading && !error && topology ? <SplitterSummary topology={topology} /> : null}

      {/* Content */}
      <div>
        {loading && <div className="text-slate-300">Loading topology…</div>}
        {error && <div className="text-red-400">{error}</div>}

        {!loading && !error && !topology && <div className="text-slate-400">No topology data.</div>}

        {!loading && topology && (
          <>
            {view === "TREE" ? (
              <TopologyTree
                data={topology}
                showOnlyActiveLines={showOnlyActiveLines}
                searchText={searchText}
                statusFilter={effectiveStatusFilter}
              />
            ) : (
              <TopologyGraph
                data={topology}
                showOnlyActiveLines={showOnlyActiveLines}
                searchText={searchText}
                statusFilter={effectiveStatusFilter}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
