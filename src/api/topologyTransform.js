// src/api/topologyTransform.js

function safeStr(v) {
  return v === null || v === undefined ? "" : String(v);
}

function normStatus(status) {
  return safeStr(status).toUpperCase();
}

function statusColors(status) {
  const s = normStatus(status);
  if (s === "ACTIVE") return { border: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (s === "DISCONNECTED") return { border: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  if (s === "INACTIVE") return { border: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  if (s === "PENDING") return { border: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { border: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
}

function typeColors(type) {
  if (type === "headend") return { border: "#60a5fa", bg: "rgba(96,165,250,0.14)" };
  if (type === "fdh") return { border: "#a78bfa", bg: "rgba(167,139,250,0.14)" };
  if (type === "splitter") return { border: "#f97316", bg: "rgba(249,115,22,0.12)" };
  if (type === "line") return { border: "#06b6d4", bg: "rgba(6,182,212,0.12)" };
  if (type === "customer") return { border: "#22c55e", bg: "rgba(34,197,94,0.10)" };
  return { border: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
}

function makeNodeStyle({ type, status }) {
  const byType = typeColors(type);
  const byStatus = status ? statusColors(status) : null;

  const border = byStatus?.border || byType.border;
  const bg = byStatus?.bg || byType.bg;

  return {
    border: `1px solid ${border}`,
    background: bg,
    color: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    width: 270,
    fontSize: 12,
    lineHeight: 1.25,
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
  };
}

function makeEdgeStyle(status) {
  const s = normStatus(status);
  if (s === "ACTIVE") return { stroke: "#22c55e", strokeWidth: 2 };
  if (s === "DISCONNECTED") return { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "6 4" };
  if (s === "INACTIVE") return { stroke: "#94a3b8", strokeWidth: 2, strokeDasharray: "2 6" };
  if (s === "PENDING") return { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" };
  return { stroke: "#60a5fa", strokeWidth: 2 };
}

export function topologyToGraph(topology) {
  if (!topology) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];

  const xGap = 330;
  const yGap = 115;

  // HEADEND
  const headendNodeId = `headend-${topology.headendId}`;
  nodes.push({
    id: headendNodeId,
    position: { x: 0, y: 0 },
    data: {
      label: `HEADEND: ${safeStr(topology.headendName)}\n${safeStr(topology.headendLocation)}`,
      meta: { type: "headend", id: topology.headendId },
    },
    style: makeNodeStyle({ type: "headend" }),
  });

  const fdhs = Array.isArray(topology.fdhs) ? topology.fdhs : [];
  let fdhRow = 0;

  fdhs.forEach((fdh) => {
    const fdhNodeId = `fdh-${fdh.fdhId}`;
    const fdhY = (fdhRow++) * (yGap * 2);

    nodes.push({
      id: fdhNodeId,
      position: { x: xGap, y: fdhY },
      data: {
        label: `FDH: ${safeStr(fdh.name)}\nRegion: ${safeStr(fdh.region)}\n${safeStr(fdh.location)}`,
        meta: { type: "fdh", id: fdh.fdhId },
      },
      style: makeNodeStyle({ type: "fdh" }),
    });

    edges.push({
      id: `e-${headendNodeId}-${fdhNodeId}`,
      source: headendNodeId,
      target: fdhNodeId,
      style: { stroke: "#334155", strokeWidth: 2 },
    });

    const splitters = Array.isArray(fdh.splitters) ? fdh.splitters : [];
    let splitterRow = 0;

    splitters.forEach((splitter) => {
      const splitterNodeId = `splitter-${splitter.splitterId}`;
      const splitterY = fdhY + (splitterRow++) * (yGap * 1.6);

      nodes.push({
        id: splitterNodeId,
        position: { x: xGap * 2, y: splitterY },
        data: {
          label: `SPLITTER: ${safeStr(splitter.name)}\nModel: ${safeStr(splitter.model)}\nPorts: ${safeStr(
            splitter.portCapacity
          )}`,
          meta: { type: "splitter", id: splitter.splitterId },
        },
        style: makeNodeStyle({ type: "splitter" }),
      });

      edges.push({
        id: `e-${fdhNodeId}-${splitterNodeId}`,
        source: fdhNodeId,
        target: splitterNodeId,
        style: { stroke: "#334155", strokeWidth: 2 },
      });

      // Fiber Drop Lines
      const lines = Array.isArray(splitter.fiberDropLines) ? splitter.fiberDropLines : [];
      let lineRow = 0;

      lines.forEach((line) => {
        const lineNodeId = `line-${line.lineId}`;
        const lineY = splitterY + (lineRow++) * yGap;

        nodes.push({
          id: lineNodeId,
          position: { x: xGap * 3, y: lineY },
          data: {
            label: `FIBER LINE: #${safeStr(line.lineId)}\nLength: ${safeStr(line.lengthMeters)} m\nStatus: ${safeStr(
              line.status
            )}`,
            meta: { type: "line", id: line.lineId },
          },
          style: makeNodeStyle({ type: "line", status: line.status }),
        });

        // Splitter -> Line edge (styled by line status)
        edges.push({
          id: `e-${splitterNodeId}-${lineNodeId}`,
          source: splitterNodeId,
          target: lineNodeId,
          style: makeEdgeStyle(line.status),
          animated: normStatus(line.status) === "ACTIVE",
        });

        // Customer (if present)
        if (line.customer && line.customer.customerId) {
          const cust = line.customer;
          const custNodeId = `customer-${cust.customerId}-${line.lineId}`;

          nodes.push({
            id: custNodeId,
            position: { x: xGap * 4, y: lineY },
            data: {
              label: `CUSTOMER: ${safeStr(cust.name)}\nPort: ${safeStr(cust.splitterPort)}\nStatus: ${safeStr(
                cust.status
              )}`,
              meta: { type: "customer", id: cust.customerId },
            },
            style: makeNodeStyle({ type: "customer", status: cust.status }),
          });

          // Line -> Customer edge (styled by customer status)
          edges.push({
            id: `e-${lineNodeId}-${custNodeId}`,
            source: lineNodeId,
            target: custNodeId,
            style: makeEdgeStyle(cust.status),
            animated: normStatus(cust.status) === "ACTIVE",
          });
        }
      });
    });
  });

  return { nodes, edges };
}
