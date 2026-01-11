import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customersApi } from "../../api/customers.api";
import { api } from "../../api/axios";

export default function SupportCustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [reason, setReason] = useState("CUSTOMER_REQUEST");
  const [exitNotes, setExitNotes] = useState("");

  const showSuccess = (t) => {
    setMsg(t);
    setErr("");
    setTimeout(() => setMsg(""), 3000);
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const c = await customersApi.getOne(id);
      setCustomer(c);

      // We don't assume backend has "assigned assets" endpoint.
      // We already have /api/assets, so we filter client-side.
      const allAssets = (await api.get("/api/assets")).data?.data || [];
      const cid = Number(id);
      const assigned = Array.isArray(allAssets)
        ? allAssets.filter((a) => Number(a.assignedCustomerId) === cid)
        : [];
      setAssets(assigned);
    } catch (e) {
      setErr("Failed to load connection details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onDeactivate = async () => {
    setErr("");
    setMsg("");

    if (!confirm("Deactivate this customer and reclaim assigned assets?")) return;

    setBusy(true);
    try {
      await customersApi.deactivate(id, {
        reason,
        exitNotes: exitNotes.trim() || null,
      });

      await load();
      showSuccess("✅ Customer deactivated and reclaim triggered.");
      setExitNotes("");
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        "Deactivate failed.";
      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setBusy(false);
    }
  };

  const status = customer?.status;

  const hasAssignedOntRouter = useMemo(() => {
    const types = assets.map((a) => String(a.type || "").toUpperCase());
    return types.includes("ONT") || types.includes("ROUTER");
  }, [assets]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading connection details...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        Customer not found.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-semibold text-slate-100">
            Connection Details
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Deactivate customer and reclaim ONT/Router.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/support/customers")}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Back
          </button>
          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Refresh
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

        {/* Customer */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="grid gap-2 text-sm text-slate-200">
            <Row k="Customer ID" v={customer.customerId ?? id} />
            <Row k="Name" v={customer.name} strong />
            <Row k="Neighborhood" v={customer.neighborhood} />
            <Row k="Plan" v={customer.plan} />
            <Row k="Status" v={<StatusBadge value={status} />} />
          </div>
        </div>

        {/* Assigned Assets (ONT/Router) */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-sm font-semibold text-slate-100">
            Assigned Assets (ONT / Router)
          </div>

          {assets.length === 0 ? (
            <div className="mt-2 text-sm text-slate-300">
              No assets currently assigned to this customer.
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0b1220]">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                        Serial
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                        Model
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a, idx) => (
                      <tr
                        key={a.assetId ?? idx}
                        className="border-t border-slate-800"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {a.type ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {a.serialNumber ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {a.model ?? "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          <StatusBadge value={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Deactivate */}
        <div className="mt-4 rounded-xl border border-slate-800 bg-[#0f172a] p-4">
          <div className="text-sm font-semibold text-slate-100">
            Deactivate Connection
          </div>

          <div className="mt-3 grid gap-4 max-w-2xl">
            <label className="grid gap-2 text-sm text-slate-300">
              <span className="font-medium">Reason</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-10 rounded-xl border border-slate-700 bg-[#0b1220] px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="CUSTOMER_REQUEST">Customer Request</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              <span className="font-medium">Exit Notes</span>
              <textarea
                value={exitNotes}
                onChange={(e) => setExitNotes(e.target.value)}
                rows={4}
                placeholder="e.g. relocation / customer moved out / contract ended..."
                className="rounded-xl border border-slate-700 bg-[#0b1220] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={busy}
                onClick={onDeactivate}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-60"
              >
                {busy ? "Deactivating..." : "Deactivate"}
              </button>

              <div className="text-xs text-slate-400">
                This should: deactivate customer, unassign ONT/Router, free fiber line, close case.
              </div>
            </div>

            {!hasAssignedOntRouter && (
              <div className="text-xs text-amber-300">
                Note: This customer currently has no ONT/Router assigned (based on /api/assets response).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3">
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
      : v === "DEACTIVATED"
      ? "border-slate-700 bg-slate-900/50 text-slate-200"
      : "border-slate-700 bg-slate-900/50 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value ?? "-"}
    </span>
  );
}
