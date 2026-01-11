import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusPill from "../../ui/StatusPill";

/** ---------- helpers ---------- */
function norm(s) {
  return String(s || "").toLowerCase().trim();
}

function matchesSearch(text, searchText) {
  const q = norm(searchText);
  if (!q) return true;
  return norm(text).includes(q);
}

function statusAllowed(status, statusFilter) {
  const filter = (statusFilter || []).map((x) => String(x).toUpperCase());
  if (filter.length === 0) return true;
  return filter.includes(String(status || "").toUpperCase());
}

function filterTopology(raw, { searchText, showOnlyActiveLines, statusFilter }) {
  if (!raw) return raw;

  const q = norm(searchText);

  const headendMatches =
    !q ||
    matchesSearch(raw.headendName, q) ||
    matchesSearch(raw.headendLocation, q) ||
    matchesSearch(raw.headendId, q);

  const fdhs = (raw.fdhs || [])
    .map((fdh) => {
      const fdhMatches =
        headendMatches ||
        matchesSearch(fdh.name, q) ||
        matchesSearch(fdh.location, q) ||
        matchesSearch(fdh.region, q) ||
        matchesSearch(fdh.fdhId, q);

      const splitters = (fdh.splitters || [])
        .map((sp) => {
          const splitterMatches =
            fdhMatches ||
            matchesSearch(sp.name, q) ||
            matchesSearch(sp.model, q) ||
            matchesSearch(sp.portCapacity, q) ||
            matchesSearch(sp.splitterId, q);

          const customers = (sp.customers || []).filter((c) => {
            const okStatus = statusAllowed(c.status, statusFilter);
            const okSearch =
              splitterMatches ||
              matchesSearch(c.name, q) ||
              matchesSearch(c.customerId, q) ||
              matchesSearch(c.splitterPort, q) ||
              matchesSearch(c.status, q);
            return okStatus && okSearch;
          });

          const fiberDropLines = (sp.fiberDropLines || []).filter((l) => {
            if (showOnlyActiveLines && String(l.status).toUpperCase() !== "ACTIVE") return false;

            const okStatus = statusAllowed(l.status, statusFilter);
            const okSearch =
              splitterMatches ||
              matchesSearch(l.lineId, q) ||
              matchesSearch(l.lengthMeters, q) ||
              matchesSearch(l.status, q) ||
              matchesSearch(l.customer?.name, q) ||
              matchesSearch(l.customer?.customerId, q);

            const okCustomerStatus =
              (statusFilter || []).length === 0
                ? true
                : statusAllowed(l.customer?.status, statusFilter);

            return okStatus && okCustomerStatus && okSearch;
          });

          const keepSplitter = splitterMatches || customers.length > 0 || fiberDropLines.length > 0;
          if (!keepSplitter) return null;

          return { ...sp, customers, fiberDropLines };
        })
        .filter(Boolean);

      const keepFdh = fdhMatches || splitters.length > 0;
      if (!keepFdh) return null;

      return { ...fdh, splitters };
    })
    .filter(Boolean);

  return { ...raw, fdhs };
}

/** ---------- UI ---------- */
export default function TopologyTree({
  data,
  showOnlyActiveLines = false,
  searchText = "",
  statusFilter = [],
}) {
  const navigate = useNavigate();

  const filtered = useMemo(
    () => filterTopology(data, { searchText, showOnlyActiveLines, statusFilter }),
    [data, searchText, showOnlyActiveLines, statusFilter]
  );

  const [openFdhs, setOpenFdhs] = useState({});
  const [openSplitters, setOpenSplitters] = useState({});

  const toggle = (mapSetter, id) => {
    mapSetter((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const linkCls =
    "cursor-pointer text-blue-300 underline decoration-blue-400/40 underline-offset-2 font-extrabold hover:text-blue-200";

  const openHeadends = () => navigate("/headends");
  const openFdh = () => navigate("/fdh");
  const openSplittersPage = () => navigate("/splitters");
  const openLinesPage = () => navigate("/fiber-drop-lines");
  const openCustomer = (id) => navigate(`/customers/${id}`);

  if (!filtered) return null;

  const totalFdhs = (filtered.fdhs || []).length;

  return (
    <div className="grid gap-4">
      {/* Headend card */}
      <div className="rounded-2xl border border-slate-800 bg-[#0b1220] p-4">
        <div className="text-sm font-extrabold text-slate-100">
          Headend:{" "}
          <span onClick={openHeadends} className={linkCls} title="Open Headends page">
            {filtered.headendName}
          </span>{" "}
          <span className="text-slate-400 font-semibold">(ID: {filtered.headendId})</span>
        </div>

        <div className="mt-2 text-sm text-slate-400">{filtered.headendLocation}</div>

        <div className="mt-3 text-xs text-slate-400">FDHs shown: {totalFdhs}</div>
        <div className="mt-2 text-xs text-slate-500">
          (Click headend name to open <b>/headends</b>)
        </div>
      </div>

      {totalFdhs === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
          No nodes match your filters/search.
        </div>
      ) : null}

      {/* FDHs */}
      {(filtered.fdhs || []).map((fdh) => {
        const fdhOpen = openFdhs[fdh.fdhId] ?? true;

        return (
          <div
            key={fdh.fdhId}
            className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]"
          >
            {/* FDH header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a]/70 p-4">
              <div className="grid gap-1">
                <div className="text-sm font-extrabold text-slate-100">
                  FDH:{" "}
                  <span onClick={openFdh} className={linkCls} title="Open FDH page">
                    {fdh.name}
                  </span>{" "}
                  <span className="text-slate-400 font-semibold">(ID: {fdh.fdhId})</span>
                </div>

                <div className="text-sm text-slate-400">
                  {fdh.location} • Region: {fdh.region}
                </div>

                <div className="text-xs text-slate-500">
                  (Click FDH name to open <b>/fdh</b>)
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400">Splitters: {(fdh.splitters || []).length}</div>

                <button
                  onClick={() => toggle(setOpenFdhs, fdh.fdhId)}
                  className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-900/50"
                >
                  {fdhOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {/* Splitters */}
            {fdhOpen && (
              <div className="grid gap-4 p-4">
                {(fdh.splitters || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No splitters under this FDH.</div>
                ) : null}

                {(fdh.splitters || []).map((sp) => {
                  const spOpen = openSplitters[sp.splitterId] ?? true;
                  const customersCount = (sp.customers || []).length;
                  const linesCount = (sp.fiberDropLines || []).length;

                  return (
                    <div
                      key={sp.splitterId}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]"
                    >
                      {/* Splitter header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a]/60 p-4">
                        <div className="grid gap-1">
                          <div className="text-sm font-extrabold text-slate-100">
                            Splitter:{" "}
                            <span
                              onClick={openSplittersPage}
                              className={linkCls}
                              title="Open Splitters page"
                            >
                              {sp.name}
                            </span>{" "}
                            <span className="text-slate-400 font-semibold">(ID: {sp.splitterId})</span>
                          </div>

                          <div className="text-sm text-slate-400">
                            Model: {sp.model || "—"} • Ports: {sp.portCapacity ?? "—"}
                          </div>

                          <div className="text-xs text-slate-500">
                            (Click splitter name to open <b>/splitters</b>)
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs text-slate-400">
                            Customers: {customersCount}
                            <br />
                            Lines: {linesCount}
                          </div>

                          <button
                            onClick={() => toggle(setOpenSplitters, sp.splitterId)}
                            className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:bg-slate-900/50"
                          >
                            {spOpen ? "Collapse" : "Expand"}
                          </button>
                        </div>
                      </div>

                      {spOpen && (
                        <div className="grid gap-6 p-4">
                          {/* Fiber Drop Lines */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-extrabold text-slate-100">Fiber Drop Lines</div>
                              <span
                                onClick={openLinesPage}
                                className="cursor-pointer text-xs font-semibold text-blue-300 underline underline-offset-2 hover:text-blue-200"
                                title="Open Fiber Drop Lines page"
                              >
                                (Open /fiber-drop-lines)
                              </span>
                            </div>

                            {linesCount === 0 ? (
                              <div className="mt-2 text-sm text-slate-400">
                                No fiber drop lines under this splitter.
                              </div>
                            ) : (
                              <div className="mt-3 grid gap-3">
                                {(sp.fiberDropLines || []).map((line) => (
                                  <div
                                    key={line.lineId}
                                    onClick={openLinesPage}
                                    title="Click to open Fiber Drop Lines page"
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 transition hover:bg-slate-900/40 cursor-pointer"
                                  >
                                    <div className="grid gap-1">
                                      <div className="text-sm font-extrabold text-slate-100">
                                        Line #{line.lineId} • {Number(line.lengthMeters || 0).toFixed(1)} m
                                      </div>

                                      <div className="text-sm text-slate-400">
                                        Customer:{" "}
                                        {line.customer?.customerId ? (
                                          <span
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openCustomer(line.customer.customerId);
                                            }}
                                            className={linkCls}
                                            title="Open Customer details"
                                          >
                                            {line.customer?.name || `Customer ${line.customer.customerId}`}
                                          </span>
                                        ) : (
                                          <span>—</span>
                                        )}
                                      </div>

                                      <div className="text-xs text-slate-500">
                                        (Click line card → /fiber-drop-lines, click customer → /customers/:id)
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <StatusPill status={line.status} />
                                      {line.customer?.status ? <StatusPill status={line.customer.status} /> : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Customers */}
                          <div>
                            <div className="text-sm font-extrabold text-slate-100">Customers</div>

                            {customersCount === 0 ? (
                              <div className="mt-2 text-sm text-slate-400">
                                No customers under this splitter.
                              </div>
                            ) : (
                              <div className="mt-3 grid gap-3">
                                {(sp.customers || []).map((c) => (
                                  <div
                                    key={c.customerId}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0b1220] p-4"
                                  >
                                    <div className="grid gap-1">
                                      <div className="text-sm font-extrabold text-slate-100">
                                        <span
                                          onClick={() => openCustomer(c.customerId)}
                                          className="cursor-pointer font-extrabold text-slate-100 hover:text-slate-200"
                                          title="Open Customer details"
                                        >
                                          {c.name}
                                        </span>
                                        <span className="ml-2 text-slate-400 font-medium">
                                          • Port {c.splitterPort ?? "—"}
                                        </span>
                                      </div>

                                      <div className="text-xs text-slate-500">
                                        (Click name to open <b>/customers/{c.customerId}</b>)
                                      </div>
                                    </div>

                                    <StatusPill status={c.status} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
