import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fiberDropLinesApi } from "../api/fiberDropLines.api";
import { splittersApi } from "../api/splitters.api";
import { customersApi } from "../api/customers.api";

export default function FiberDropLineForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fromSplitterId: "",
    toCustomerId: "",
    lengthMeters: "",
    status: "ACTIVE",
  });

  const [splitters, setSplitters] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lines, setLines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setErr("");
      try {
        const [s, c, l] = await Promise.all([
          splittersApi.getAll(),
          customersApi.getAll(),
          fiberDropLinesApi.getAll(),
        ]);

        setSplitters(Array.isArray(s) ? s : []);
        setCustomers(Array.isArray(c) ? c : []);
        setLines(Array.isArray(l) ? l : []);
      } catch {
        setErr("Failed to load dropdown data (splitters/customers/fiber lines).");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const usedCustomerIds = useMemo(() => {
    const set = new Set();
    lines.forEach((l) => {
      const cid = l.toCustomerId ?? l.toCustomer?.customerId;
      if (cid != null) set.add(Number(cid));
    });
    return set;
  }, [lines]);

  const usedPortsBySplitterId = useMemo(() => {
    const map = new Map();

    customers.forEach((c) => {
      const sid = c?.splitter?.splitterId;
      const port = c?.splitterPort;

      if (sid != null && port != null) {
        const key = Number(sid);
        if (!map.has(key)) map.set(key, new Set());
        map.get(key).add(Number(port));
      }
    });

    const counts = new Map();
    for (const [sid, setPorts] of map.entries()) {
      counts.set(sid, setPorts.size);
    }
    return counts;
  }, [customers]);

  const splitterOptions = useMemo(() => {
    return (splitters || [])
      .map((s) => {
        const sid = s.splitterId ?? s.id;
        const cap = Number(s.portCapacity ?? 0);
        const used = usedPortsBySplitterId.get(Number(sid)) || 0;
        const remaining = cap - used;

        return {
          ...s,
          _sid: sid,
          _cap: cap,
          _used: used,
          _remaining: remaining,
        };
      })
      .filter((s) => s._sid != null && s._remaining > 0);
  }, [splitters, usedPortsBySplitterId]);

  const customerOptions = useMemo(() => {
    return (customers || []).filter((c) => {
      const cid = c.customerId ?? c.id;
      if (cid == null) return false;
      return !usedCustomerIds.has(Number(cid));
    });
  }, [customers, usedCustomerIds]);

  useEffect(() => {
    if (form.toCustomerId) {
      const cid = Number(form.toCustomerId);
      if (usedCustomerIds.has(cid)) {
        setForm((p) => ({ ...p, toCustomerId: "" }));
      }
    }

    if (form.fromSplitterId) {
      const sid = Number(form.fromSplitterId);
      const stillExists = splitterOptions.some((s) => Number(s._sid) === sid);
      if (!stillExists) {
        setForm((p) => ({ ...p, fromSplitterId: "" }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedCustomerIds, splitterOptions]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!String(form.fromSplitterId).trim() || !String(form.toCustomerId).trim()) {
      return setErr("Splitter and Customer are required.");
    }

    const payload = {
      fromSplitterId: Number(form.fromSplitterId),
      toCustomerId: Number(form.toCustomerId),
      lengthMeters: form.lengthMeters ? Number(form.lengthMeters) : null,
      status: form.status,
    };

    if (Number.isNaN(payload.fromSplitterId) || Number.isNaN(payload.toCustomerId)) {
      return setErr("IDs must be valid numbers.");
    }

    if (payload.lengthMeters !== null && Number.isNaN(payload.lengthMeters)) {
      return setErr("Length must be a valid number (or empty).");
    }

    try {
      await fiberDropLinesApi.create(payload);
      alert("Fiber Drop Line created!");
      navigate("/fiber-drop-lines");
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const msg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2));
      setErr(`HTTP ${status || "?"}: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading dropdowns...
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h2 className="m-0 text-xl font-semibold text-slate-100">Add Fiber Drop Line</h2>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 p-3 text-red-200 whitespace-pre-wrap">
          {err}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">From Splitter *</span>
            <select
              name="fromSplitterId"
              value={form.fromSplitterId}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select splitter...</option>
              {splitterOptions.map((s) => (
                <option key={s._sid} value={s._sid}>
                  {s._sid} — {s.name} ({s.model ?? "no model"}) | ports: {s._used}/{s._cap} (left{" "}
                  {s._remaining})
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-400">
              Only splitters with at least 1 available port are shown.
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">To Customer *</span>
            <select
              name="toCustomerId"
              value={form.toCustomerId}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Select customer...</option>
              {customerOptions.map((c) => {
                const cid = c.customerId ?? c.id;
                const csid = c?.splitter?.splitterId;
                const port = c?.splitterPort;

                const suffix =
                  csid != null
                    ? ` | splitter=${csid}${port != null ? `, port=${port}` : ""}`
                    : " | splitter=—";

                return (
                  <option key={cid} value={cid}>
                    {cid} — {c.name} ({c.status}){suffix}
                  </option>
                );
              })}
            </select>

            <div className="text-xs text-slate-400">
              Customers already connected to a fiber drop line are hidden (to_customer_id is UNIQUE).
            </div>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Length (meters)</span>
            <input
              name="lengthMeters"
              placeholder="e.g. 120.5"
              value={form.lengthMeters}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-medium text-slate-300">Status</span>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="h-10 rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISCONNECTED">DISCONNECTED</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Create
            </button>

            <button
              type="button"
              onClick={() => navigate("/fiber-drop-lines")}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
