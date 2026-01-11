import React from "react";

function Row({ k, v }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <div className="text-slate-400">{k}:</div>
      <div className="text-slate-100 font-semibold">{v ?? "-"}</div>
    </div>
  );
}

function Pill({ value }) {
  const v = String(value ?? "").toUpperCase();
  const cls =
    v === "ACTIVE"
      ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
      : v === "PENDING"
      ? "border-amber-700/40 bg-amber-950/40 text-amber-200"
      : v === "INACTIVE"
      ? "border-slate-700 bg-slate-900/50 text-slate-200"
      : v === "DISCONNECTED"
      ? "border-red-900/50 bg-red-950/30 text-red-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value ?? "-"}
    </span>
  );
}

export default function TopologyCustomerPanel({
  open,
  loading,
  error,
  data,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-800 bg-[#0b1220] shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="text-base font-extrabold text-slate-100">Node Details</div>
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-900/50"
        >
          Close
        </button>
      </div>

      <div className="h-[calc(100%-52px)] overflow-auto p-4">
        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            Loading customer details…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {error}
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-400">
            No data.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-slate-100">
                  Customer: {data.name}
                </div>
                <Pill value={data.status} />
              </div>

              <div className="mt-3 grid gap-2">
                <Row k="Customer ID" v={data.customerId} />
                <Row k="Address" v={data.address} />
                <Row k="Splitter" v={data.splitterName ? `${data.splitterName} (#${data.splitterId})` : "-"} />
                <Row k="Port" v={data.splitterPort} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
              <div className="text-sm font-extrabold text-slate-100">Assets</div>
              <div className="mt-3 grid gap-2">
                <Row k="ONT" v={data.ontSerial || "-"} />
                <Row k="ONT Status" v={<Pill value={data.ontStatus} />} />
                <Row k="Router" v={data.routerSerial || "-"} />
                <Row k="Router Status" v={<Pill value={data.routerStatus} />} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
              <div className="text-sm font-extrabold text-slate-100">Fiber</div>
              <div className="mt-3 grid gap-2">
                <Row k="Line ID" v={data.fiberLineId} />
                <Row k="Length (m)" v={data.fiberLengthMeters} />
                <Row k="Status" v={<Pill value={data.fiberStatus} />} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
