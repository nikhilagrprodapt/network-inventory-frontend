import { useEffect, useMemo, useState } from "react";
import { onboardingApi } from "../api/onboarding.api";
import { assetsApi } from "../api/assets.api";

const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-blue-500/40";

export default function OnboardingWizard() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    neighborhood: "",
    plan: "",
    connectionType: "WIRED",
    taskType: "",
    notes: "",
    technicianId: "",
  });

  const [fdhs, setFdhs] = useState([]);
  const [fdhId, setFdhId] = useState("");

  const [splitters, setSplitters] = useState([]);
  const [splitterId, setSplitterId] = useState("");

  const [freePorts, setFreePorts] = useState([]);
  const [splitterPort, setSplitterPort] = useState("");

  const [assets, setAssets] = useState([]);
  const [ontAssetId, setOntAssetId] = useState("");
  const [routerAssetId, setRouterAssetId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const [fdhList, assetList] = await Promise.all([
        onboardingApi.getFdhs(),
        assetsApi.getAll(),
      ]);

      const fArr = Array.isArray(fdhList) ? fdhList : [];
      setFdhs(fArr);

      const aArr = Array.isArray(assetList) ? assetList : [];
      setAssets(aArr);

      if (fArr.length) {
        const id = fArr[0]?.fdhId ?? fArr[0]?.id ?? "";
        setFdhId(String(id));
      } else {
        setFdhId("");
      }
    } catch {
      setErr("Failed to load onboarding data (FDHs / Assets).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load splitters when fdh changes
  useEffect(() => {
    const run = async () => {
      if (!fdhId) return;
      setErr("");
      try {
        const list = await onboardingApi.getSplittersByFdh(Number(fdhId));
        const arr = Array.isArray(list) ? list : [];
        setSplitters(arr);

        const firstId = arr.length ? String(arr[0]?.splitterId ?? arr[0]?.id ?? "") : "";
        setSplitterId(firstId);

        setFreePorts([]);
        setSplitterPort("");
      } catch {
        setErr("Failed to load splitters for selected FDH.");
        setSplitters([]);
        setSplitterId("");
        setFreePorts([]);
        setSplitterPort("");
      }
    };
    run();
  }, [fdhId]);

  // Load free ports when splitter changes
  useEffect(() => {
    const run = async () => {
      if (!splitterId) return;
      setErr("");
      try {
        const ports = await onboardingApi.getFreePorts(Number(splitterId));
        const arr = Array.isArray(ports) ? ports : [];
        setFreePorts(arr);
        setSplitterPort(arr.length ? String(arr[0]) : "");
      } catch {
        setErr("Failed to load free ports for selected splitter.");
        setFreePorts([]);
        setSplitterPort("");
      }
    };
    run();
  }, [splitterId]);

  // Filter assets
  const availableOnts = useMemo(() => {
    return assets.filter(
      (a) =>
        String(a?.type ?? "").toUpperCase() === "ONT" &&
        String(a?.status ?? "").toUpperCase() === "AVAILABLE"
    );
  }, [assets]);

  const availableRouters = useMemo(() => {
    return assets.filter(
      (a) =>
        String(a?.type ?? "").toUpperCase() === "ROUTER" &&
        String(a?.status ?? "").toUpperCase() === "AVAILABLE"
    );
  }, [assets]);

  // auto pick first available
  useEffect(() => {
    if (availableOnts.length) setOntAssetId(String(availableOnts[0].assetId));
    else setOntAssetId("");

    if (availableRouters.length) setRouterAssetId(String(availableRouters[0].assetId));
    else setRouterAssetId("");
  }, [availableOnts, availableRouters]);

  const validate = () => {
    const req = ["name", "address", "neighborhood", "plan"];
    for (const k of req) {
      if (!String(form[k] ?? "").trim()) return `Please fill: ${k}`;
    }
    if (!fdhId) return "Please select FDH.";
    if (!splitterId) return "Please select Splitter.";
    if (!splitterPort) return "Please select a free port.";
    if (!ontAssetId) return "Please select an available ONT asset.";
    if (!routerAssetId) return "Please select an available Router asset.";
    if (!String(form.taskType ?? "").trim())
      return "Please enter task type (ex: Install at House B1.2).";
    return "";
  };

  const onConfirm = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        plan: form.plan.trim(),
        connectionType: form.connectionType,
        fdhId: Number(fdhId),
        splitterId: Number(splitterId),
        splitterPort: Number(splitterPort),
        ontAssetId: Number(ontAssetId),
        routerAssetId: Number(routerAssetId),
        taskType: form.taskType.trim(),
        notes: form.notes?.trim() || null,
        technicianId: String(form.technicianId).trim()
          ? Number(form.technicianId)
          : null,
      };

      const res = await onboardingApi.confirm(payload);

      setMsg(
        `✅ Onboarding Confirmed. Customer #${res?.customer?.customerId}, Task #${res?.task?.taskId}`
      );

      // Clear form AFTER success
      setForm({
        name: "",
        address: "",
        neighborhood: "",
        plan: "",
        connectionType: "WIRED",
        taskType: "",
        notes: "",
        technicianId: "",
      });

      // refresh assets so assigned ones disappear
      const assetList = await assetsApi.getAll();
      setAssets(Array.isArray(assetList) ? assetList : []);

      // refresh free ports (the selected port got consumed)
      const ports = await onboardingApi.getFreePorts(Number(splitterId));
      const arr = Array.isArray(ports) ? ports : [];
      setFreePorts(arr);
      setSplitterPort(arr.length ? String(arr[0]) : "");
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;
      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        e2.message;

      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading onboarding wizard...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">
          New Onboarding (Planner)
        </h2>
        <button
          onClick={load}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
        >
          Refresh Data
        </button>
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

        <form onSubmit={onConfirm} className="mt-4 grid gap-4 max-w-3xl">
          <Section title="Customer Info">
            <Grid2>
              <Field label="Name *">
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Neighborhood *">
                <input
                  name="neighborhood"
                  value={form.neighborhood}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Address *">
                <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Plan *">
                <input
                  name="plan"
                  value={form.plan}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>
              <Field label="Connection Type *">
                <select
                  name="connectionType"
                  value={form.connectionType}
                  onChange={onChange}
                  className={inputCls}
                >
                  <option value="WIRED">WIRED</option>
                  <option value="WIRELESS">WIRELESS</option>
                </select>
              </Field>
            </Grid2>
          </Section>

          <Section title="Network Selection">
            <Grid2>
              <Field label="FDH *">
                <select
                  value={fdhId}
                  onChange={(e) => setFdhId(e.target.value)}
                  className={inputCls}
                >
                  {fdhs.length === 0 ? (
                    <option value="">No FDHs found</option>
                  ) : (
                    fdhs.map((f) => (
                      <option key={f.fdhId} value={f.fdhId}>
                        {f.fdhId} — {f.name} ({f.region})
                      </option>
                    ))
                  )}
                </select>
              </Field>

              <Field label="Splitter *">
                <select
                  value={splitterId}
                  onChange={(e) => setSplitterId(e.target.value)}
                  className={inputCls}
                  disabled={!splitters.length}
                >
                  {splitters.length === 0 ? (
                    <option value="">No splitters for selected FDH</option>
                  ) : (
                    splitters.map((s) => (
                      <option key={s.splitterId} value={s.splitterId}>
                        {s.splitterId} — {s.name} (ports {s.portCapacity})
                      </option>
                    ))
                  )}
                </select>
              </Field>

              <Field label="Free Port *">
                <select
                  value={splitterPort}
                  onChange={(e) => setSplitterPort(e.target.value)}
                  className={inputCls}
                  disabled={!freePorts.length}
                >
                  {freePorts.length === 0 ? (
                    <option value="">No free ports</option>
                  ) : (
                    freePorts.map((p) => (
                      <option key={p} value={p}>
                        Port {p}
                      </option>
                    ))
                  )}
                </select>
              </Field>
            </Grid2>
          </Section>

          <Section title="Assign Devices (AVAILABLE only)">
            <Grid2>
              <Field label="ONT (AVAILABLE) *">
                <select
                  value={ontAssetId}
                  onChange={(e) => setOntAssetId(e.target.value)}
                  className={inputCls}
                  disabled={!availableOnts.length}
                >
                  {availableOnts.length === 0 ? (
                    <option value="">No AVAILABLE ONT assets</option>
                  ) : (
                    availableOnts.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        #{a.assetId} — {a.model} — {a.serialNumber}
                      </option>
                    ))
                  )}
                </select>
              </Field>

              <Field label="Router (AVAILABLE) *">
                <select
                  value={routerAssetId}
                  onChange={(e) => setRouterAssetId(e.target.value)}
                  className={inputCls}
                  disabled={!availableRouters.length}
                >
                  {availableRouters.length === 0 ? (
                    <option value="">No AVAILABLE Router assets</option>
                  ) : (
                    availableRouters.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        #{a.assetId} — {a.model} — {a.serialNumber}
                      </option>
                    ))
                  )}
                </select>
              </Field>
            </Grid2>
          </Section>

          <Section title="Deployment Task">
            <Grid2>
              <Field label="Task Type * (ex: Install at House B1.2)">
                <input
                  name="taskType"
                  value={form.taskType}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>

              <Field label="Technician ID (optional)">
                <input
                  name="technicianId"
                  value={form.technicianId}
                  onChange={onChange}
                  className={inputCls}
                  placeholder="ex: 1"
                />
              </Field>

              <Field label="Notes (optional)">
                <input
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>
            </Grid2>
          </Section>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || !ontAssetId || !routerAssetId}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {saving ? "Confirming..." : "Confirm Onboarding"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          This will: create customer (PENDING) → assign splitter+port → assign
          ONT+Router → create deployment task → write audit logs.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
