import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { customersApi } from "../api/customers.api";
import { api } from "../api/axios";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [splitterId, setSplitterId] = useState("");
  const [splitterPort, setSplitterPort] = useState("");
  const [msg, setMsg] = useState("");

  // ✅ Deactivate modal state
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactReason, setDeactReason] = useState("CUSTOMER_REQUEST");
  const [exitNotes, setExitNotes] = useState("");
  const [deactLoading, setDeactLoading] = useState(false);

  // ✅ Connection details state (verify triggers)
  const [connLoading, setConnLoading] = useState(false);
  const [assignedOnt, setAssignedOnt] = useState([]);
  const [assignedRouters, setAssignedRouters] = useState([]);
  const [fiberLine, setFiberLine] = useState(null);

  const showSuccess = (text) => {
    setMsg(text);
    setErr("");
    setTimeout(() => setMsg(""), 3000);
  };

  const loadConnectionDetails = async (customerId) => {
    if (!customerId) return;

    setConnLoading(true);
    try {
      // 1) Assets (filter client-side)
      const assetsRes = await api.get("/api/assets");
      const assets = assetsRes?.data?.data;
      const list = Array.isArray(assets) ? assets : [];

      const assigned = list.filter((a) => {
        const assignedCustomerId =
          a.assignedCustomerId ?? a.assignedCustomerID ?? a.assigned_customer_id;
        return Number(assignedCustomerId) === Number(customerId);
      });

      setAssignedOnt(assigned.filter((a) => String(a.type).toUpperCase() === "ONT"));
      setAssignedRouters(assigned.filter((a) => String(a.type).toUpperCase() === "ROUTER"));

      // 2) Fiber lines (best-effort parsing)
      const fiberRes = await api.get("/api/fiber-lines");
      const lines = fiberRes?.data?.data;
      const flist = Array.isArray(lines) ? lines : [];

      const match = flist.find((l) => {
        const toId =
          l?.toCustomer?.customerId ??
          l?.toCustomer?.id ??
          l?.toCustomerId ??
          l?.to_customer_id;
        return Number(toId) === Number(customerId);
      });

      setFiberLine(match ?? null);
    } catch {
      // Don’t block page if this fails
      // Connection Details is a verification panel only
    } finally {
      setConnLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await customersApi.getOne(id);
      setCustomer(data);

      const customerId = data?.customerId ?? data?.id;
      await loadConnectionDetails(customerId);
    } catch (e) {
      setErr("Failed to load customer details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const cid = customer?.customerId ?? customer?.id;

  const isDeactivated = useMemo(() => {
    const v = String(customer?.status ?? "").toUpperCase();
    return v === "DEACTIVATED";
  }, [customer?.status]);

  const onAssignSplitter = async () => {
    setErr("");
    setMsg("");

    const sid = splitterId.trim();
    const sport = splitterPort.trim();

    if (!sid || !sport) {
      setErr("Splitter ID and Splitter Port are required.");
      return;
    }

    const payload = { splitterId: Number(sid), splitterPort: Number(sport) };

    if (Number.isNaN(payload.splitterId) || Number.isNaN(payload.splitterPort)) {
      setErr("Splitter ID and Port must be valid numbers.");
      return;
    }

    try {
      await customersApi.assignSplitter(id, payload);
      await load();
      showSuccess("✅ Splitter assigned successfully!");
      setSplitterId("");
      setSplitterPort("");
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        "Assign failed.";

      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    }
  };

  const openDeactivate = () => {
    setErr("");
    setMsg("");
    setDeactReason("CUSTOMER_REQUEST");
    setExitNotes("");
    setShowDeactivate(true);
  };

  const closeDeactivate = () => {
    if (deactLoading) return;
    setShowDeactivate(false);
  };

  const onConfirmDeactivate = async () => {
    if (deactLoading) return;

    setErr("");
    setMsg("");

    const notes = exitNotes.trim();
    if (!notes) {
      setErr("Exit notes are required to deactivate a customer.");
      return;
    }

    const payload = {
      reason: deactReason,
      exitNotes: notes,
    };

    try {
      setDeactLoading(true);
      await customersApi.deactivate(id, payload);
      setShowDeactivate(false);
      await load();
      showSuccess("✅ Customer deactivated. Assets reclaimed + fiber freed.");
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        "Deactivate failed.";

      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setDeactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading customer...
      </div>
    );
  }
  if (err && !customer) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        {err}
      </div>
    );
  }
  if (!customer) return <p className="text-slate-300">No customer found.</p>;

  const fiberStatus = String(fiberLine?.status ?? "-").toUpperCase();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">
          View Connection Details
        </h2>

        <div className="flex items-center gap-2">
          <Link
            to={`/customers/${id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Edit
          </Link>

          <button
            onClick={openDeactivate}
            disabled={isDeactivated}
            className={[
              "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition active:scale-[0.99]",
              isDeactivated
                ? "cursor-not-allowed border border-slate-800 bg-slate-900/40 text-slate-400"
                : "border border-red-900/50 bg-red-950/30 text-red-200 hover:bg-red-950/50",
            ].join(" ")}
            title={isDeactivated ? "Customer already deactivated" : "Deactivate customer"}
          >
            {isDeactivated ? "Deactivated" : "Deactivate"}
          </button>

          <button
            onClick={() => navigate("/customers")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {msg && (
          <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/40 p-4 text-emerald-200 font-semibold">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {/* Details Card */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="grid gap-2 text-sm text-slate-200">
            <Row k="ID" v={cid} />
            <Row k="Name" v={customer.name} strong />
            <Row k="Address" v={customer.address} />
            <Row k="Neighborhood" v={customer.neighborhood} />
            <Row k="Plan" v={customer.plan} />
            <Row k="Status" v={<StatusBadge value={customer.status} />} />
            <Row k="Connection Type" v={customer.connectionType} />
            <Row k="Splitter ID" v={customer.splitterId ?? "-"} />
            <Row k="Splitter Port" v={customer.splitterPort ?? "-"} />
          </div>
        </div>

        {/* ✅ Connection Details Verification (Journey 4 triggers) */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-100">
              Connection Details (Verification)
            </h3>

            <button
              onClick={() => loadConnectionDetails(cid)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-xs font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
            >
              Refresh Connection
            </button>
          </div>

          {connLoading ? (
            <div className="mt-3 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
              Loading connection details...
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
                <div className="text-sm font-semibold text-slate-100">Assigned ONT</div>
                <div className="mt-2 text-sm text-slate-300">
                  {assignedOnt.length === 0 ? (
                    <span className="text-slate-400">None</span>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {assignedOnt.map((a) => (
                        <li key={a.assetId}>
                          {a.serialNumber} ({a.model}) —{" "}
                          <span className="font-semibold">{a.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
                <div className="text-sm font-semibold text-slate-100">Assigned Router</div>
                <div className="mt-2 text-sm text-slate-300">
                  {assignedRouters.length === 0 ? (
                    <span className="text-slate-400">None</span>
                  ) : (
                    <ul className="list-disc pl-5 space-y-1">
                      {assignedRouters.map((a) => (
                        <li key={a.assetId}>
                          {a.serialNumber} ({a.model}) —{" "}
                          <span className="font-semibold">{a.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
                <div className="text-sm font-semibold text-slate-100">Fiber Path</div>
                <div className="mt-2 text-sm text-slate-300">
                  {fiberLine ? (
                    <>
                      <div>
                        Status:{" "}
                        <span className="font-semibold">{fiberStatus}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        (When deactivated, it should become DISCONNECTED and free)
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400">No active fiber line linked</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ Journey 4 “System triggers” summary */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-sm text-slate-200">
            <div className="font-semibold text-slate-100">System Triggers</div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-300">
              <li>
                Customer ={" "}
                <span className="font-semibold">
                  {String(customer.status ?? "-").toUpperCase()}
                </span>
              </li>
              <li>
                ONT/Router ={" "}
                <span className="font-semibold">
                  {assignedOnt.length === 0 && assignedRouters.length === 0
                    ? "Unassigned (✅)"
                    : "Still assigned (check)"}
                </span>
              </li>
              <li>
                Fiber path ={" "}
                <span className="font-semibold">
                  {!fiberLine ? "Free (✅)" : fiberStatus}
                </span>
              </li>
              <li>Exit notes captured during Deactivate</li>
              <li>Case marked as closed (backend)</li>
            </ul>
          </div>
        </div>

        {/* Assign Splitter */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-slate-100">Assign Splitter</h3>

          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl">
            <label className="grid gap-2 text-sm text-slate-300">
              <span className="font-medium">Splitter ID *</span>
              <input
                value={splitterId}
                onChange={(e) => setSplitterId(e.target.value)}
                placeholder="e.g. 10"
                className={inputCls}
                disabled={isDeactivated}
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              <span className="font-medium">Splitter Port *</span>
              <input
                value={splitterPort}
                onChange={(e) => setSplitterPort(e.target.value)}
                placeholder="e.g. 1"
                className={inputCls}
                disabled={isDeactivated}
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onAssignSplitter}
              disabled={isDeactivated}
              className={[
                "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99]",
                isDeactivated
                  ? "cursor-not-allowed bg-slate-700/40 text-slate-300"
                  : "bg-blue-600 hover:bg-blue-500",
              ].join(" ")}
              title={isDeactivated ? "Cannot assign splitter to a deactivated customer" : "Assign splitter"}
            >
              Assign
            </button>

            <button
              onClick={load}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
            >
              Refresh
            </button>
          </div>

          {isDeactivated && (
            <div className="mt-3 rounded-xl border border-amber-700/40 bg-amber-950/30 p-4 text-amber-200 text-sm">
              This customer is <span className="font-semibold">DEACTIVATED</span>. Splitter assignment is disabled.
            </div>
          )}
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivate && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeDeactivate} />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b1220] shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                <div className="text-base font-semibold text-slate-100">
                  Deactivate Customer
                </div>
                <button
                  onClick={closeDeactivate}
                  disabled={deactLoading}
                  className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-900/50 disabled:opacity-60"
                >
                  Close
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-sm text-slate-200">
                  <div className="font-semibold text-slate-100">This will:</div>
                  <ul className="mt-2 list-disc pl-5 text-slate-300 space-y-1">
                    <li>Mark customer as <b>DEACTIVATED</b></li>
                    <li>Unassign ONT + Router (inventory marked for collection)</li>
                    <li>Free fiber path (set DISCONNECTED)</li>
                    <li>Create a closed support case with your notes</li>
                  </ul>
                </div>

                <label className="grid gap-2 text-sm text-slate-300">
                  <span className="font-medium">Reason</span>
                  <select
                    value={deactReason}
                    onChange={(e) => setDeactReason(e.target.value)}
                    className={inputCls}
                    disabled={deactLoading}
                  >
                    <option value="CUSTOMER_REQUEST">Customer Request</option>
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  <span className="font-medium">Exit Notes *</span>
                  <textarea
                    value={exitNotes}
                    onChange={(e) => setExitNotes(e.target.value)}
                    placeholder="Add exit notes (required)..."
                    rows={4}
                    className={textAreaCls}
                    disabled={deactLoading}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-4">
                <button
                  onClick={closeDeactivate}
                  disabled={deactLoading}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={onConfirmDeactivate}
                  disabled={deactLoading}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-60"
                >
                  {deactLoading ? "Deactivating..." : "Confirm Deactivate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, strong }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <div className="text-slate-400">{k}:</div>
      <div className={strong ? "font-semibold text-slate-100" : "text-slate-200"}>
        {v ?? "-"}
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
      ? "border-slate-700 bg-slate-900/50 text-slate-200"
      : v === "DEACTIVATED"
      ? "border-red-900/50 bg-red-950/30 text-red-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value ?? "-"}
    </span>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";

const textAreaCls =
  "w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40";
