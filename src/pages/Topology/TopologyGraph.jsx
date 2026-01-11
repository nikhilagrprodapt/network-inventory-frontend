import React, { useMemo, useCallback } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";
import { topologyToGraph } from "../../api/topologyTransform";
import { api } from "../../api/axios";

/** ---------- helpers ---------- */
function norm(s) {
  return (s || "").toString().trim().toUpperCase();
}
function includesText(hay, needle) {
  if (!needle) return true;
  return (hay || "").toString().toLowerCase().includes(needle.toLowerCase());
}

/** same pruning rules as Tree */
function filterTopology(topology, { searchText, statusFilter, showOnlyActiveLines }) {
  if (!topology) return null;

  const q = (searchText || "").trim();
  const statusSet = new Set((statusFilter || []).map(norm).filter(Boolean));
  const matchAny = (text) => includesText(text, q);

  const statusAllowed = (status) => {
    if (showOnlyActiveLines) return norm(status) === "ACTIVE";
    if (statusSet.size === 0) return true;
    return statusSet.has(norm(status));
  };

  const out = {
    headendId: topology.headendId,
    headendName: topology.headendName,
    headendLocation: topology.headendLocation,
    fdhs: [],
  };

  const fdhs = Array.isArray(topology.fdhs) ? topology.fdhs : [];

  fdhs.forEach((fdh) => {
    const splitters = Array.isArray(fdh.splitters) ? fdh.splitters : [];
    const keptSplitters = [];

    splitters.forEach((sp) => {
      const customers = Array.isArray(sp.customers) ? sp.customers : [];
      const lines = Array.isArray(sp.fiberDropLines) ? sp.fiberDropLines : [];

      const keptCustomers = customers.filter((c) => {
        const okStatus = statusAllowed(c.status);
        const okSearch =
          !q ||
          matchAny(c.name) ||
          matchAny(String(c.customerId)) ||
          matchAny(String(c.splitterPort)) ||
          matchAny(c.status);
        return okStatus && okSearch;
      });

      const keptLines = lines.filter((l) => {
        const okStatus = statusAllowed(l.status);
        const okSearch =
          !q ||
          matchAny(String(l.lineId)) ||
          matchAny(String(l.lengthMeters)) ||
          matchAny(l.status) ||
          (l.customer &&
            (matchAny(l.customer.name) ||
              matchAny(String(l.customer.customerId)) ||
              matchAny(String(l.customer.splitterPort)) ||
              matchAny(l.customer.status)));
        return okStatus && okSearch;
      });

      const splitterSelfMatch =
        !q ||
        matchAny(sp.name) ||
        matchAny(sp.model) ||
        matchAny(String(sp.splitterId)) ||
        matchAny(String(sp.portCapacity));

      const keepSplitter = splitterSelfMatch || keptCustomers.length > 0 || keptLines.length > 0;

      if (keepSplitter) {
        keptSplitters.push({
          ...sp,
          customers: keptCustomers,
          fiberDropLines: keptLines,
        });
      }
    });

    const fdhSelfMatch =
      !q ||
      matchAny(fdh.name) ||
      matchAny(fdh.region) ||
      matchAny(fdh.location) ||
      matchAny(String(fdh.fdhId));

    const keepFdh = fdhSelfMatch || keptSplitters.length > 0;

    if (keepFdh) {
      out.fdhs.push({
        ...fdh,
        splitters: keptSplitters,
      });
    }
  });

  return out;
}

async function auditNode(meta) {
  if (!meta?.type) return;

  const type = String(meta.type).toUpperCase();
  const id = meta?.id;

  const map = {
    HEADEND: "HEADEND",
    FDH: "FDH",
    SPLITTER: "SPLITTER",
    LINE: "FIBER_DROP_LINE",
    CUSTOMER: "CUSTOMER",
  };

  const entityType = map[type] || type;
  const entityId = Number(id);

  if (!Number.isFinite(entityId)) return;

  try {
    await api.post("/api/audit/log", {
      action: "TOPOLOGY_NODE_VIEW",
      entityType,
      entityId,
      details: `Clicked node type=${type}`,
    });
  } catch {
    // do not block navigation
  }
}

export default function TopologyGraph({
  data,
  showOnlyActiveLines = false,
  searchText = "",
  statusFilter = [],
}) {
  const navigate = useNavigate();

  const filtered = useMemo(
    () =>
      filterTopology(data, {
        searchText,
        statusFilter,
        showOnlyActiveLines,
      }),
    [data, searchText, statusFilter, showOnlyActiveLines]
  );

  const graph = useMemo(() => topologyToGraph(filtered), [filtered]);

  const onNodeClick = useCallback(
    async (evt, node) => {
      const meta = node?.data?.meta;
      if (!meta) return;

      await auditNode(meta);

      if (meta.type === "headend") return navigate("/headends");
      if (meta.type === "fdh") return navigate("/fdh");
      if (meta.type === "splitter") return navigate("/splitters");
      if (meta.type === "line") return navigate("/fiber-drop-lines");
      if (meta.type === "customer") return navigate(`/customers/${meta.id}`);
    },
    [navigate]
  );

  if (!filtered) return null;

  return (
    <div className="h-[75vh] overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]">
      <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView onNodeClick={onNodeClick}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
