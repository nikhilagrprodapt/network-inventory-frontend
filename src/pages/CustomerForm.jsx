import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customersApi } from "../api/customers.api";

export default function CustomerForm({ mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isCreate = mode === "create";

  const [form, setForm] = useState({
    name: "",
    address: "",
    neighborhood: "",
    plan: "",
    status: "ACTIVE",
    connectionType: "WIRED",
    splitterId: "",
    splitterPort: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const showSuccess = (text) => {
    setMsg(text);
    setErr("");
    setTimeout(() => setMsg(""), 2500);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  useEffect(() => {
    const loadCustomer = async () => {
      if (isCreate) return;

      setLoading(true);
      setErr("");
      try {
        const data = await customersApi.getOne(id);
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          neighborhood: data.neighborhood ?? "",
          plan: data.plan ?? "",
          status: data.status ?? "ACTIVE",
          connectionType: data.connectionType ?? "WIRED",
          splitterId: data.splitterId ?? "",
          splitterPort: data.splitterPort ?? "",
        });
      } catch (e) {
        setErr("Failed to load customer for edit.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [isCreate, id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      setLoading(true);

      if (isCreate) {
        const required = [
          "name",
          "address",
          "neighborhood",
          "plan",
          "status",
          "connectionType",
        ];
        for (const key of required) {
          if (!String(form[key] ?? "").trim()) {
            setErr(`Please fill: ${key}`);
            setLoading(false);
            return;
          }
        }

        const payload = {
          name: form.name.trim(),
          address: form.address.trim(),
          neighborhood: form.neighborhood.trim(),
          plan: form.plan.trim(),
          status: form.status,
          connectionType: form.connectionType,
        };

        if (String(form.splitterId).trim()) payload.splitterId = Number(form.splitterId);
        if (String(form.splitterPort).trim()) payload.splitterPort = Number(form.splitterPort);

        await customersApi.create(payload);

        alert("Customer created!");
        navigate("/");
        return;
      }

      const payload = {
        plan: form.plan.trim(),
        status: form.status,
        connectionType: form.connectionType,
      };

      await customersApi.update(id, payload);
      showSuccess("✅ Customer updated!");
      setTimeout(() => navigate(`/customers/${id}`), 600);
    } catch (e2) {
      const status = e2?.response?.status;
      const data = e2?.response?.data;

      const serverMsg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : JSON.stringify(data, null, 2)) ||
        "Save failed.";

      setErr(`HTTP ${status || "?"}: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">
          {isCreate ? "Add Customer" : `Edit Customer #${id}`}
        </h2>
      </div>

      {/* ✅ theme bg */}
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

        <form onSubmit={onSubmit} className="mt-4 grid gap-4 max-w-xl">
          <Field label={`Name ${isCreate ? "*" : ""}`}>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              disabled={!isCreate}
              className={inputCls}
            />
          </Field>

          <Field label={`Address ${isCreate ? "*" : ""}`}>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              disabled={!isCreate}
              className={inputCls}
            />
          </Field>

          <Field label={`Neighborhood ${isCreate ? "*" : ""}`}>
            <input
              name="neighborhood"
              value={form.neighborhood}
              onChange={onChange}
              disabled={!isCreate}
              className={inputCls}
            />
          </Field>

          <Field label={`Plan ${isCreate ? "*" : ""}`}>
            <input name="plan" value={form.plan} onChange={onChange} className={inputCls} />
          </Field>

          <Field label={`Status ${isCreate ? "*" : ""}`}>
            <select name="status" value={form.status} onChange={onChange} className={inputCls}>
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </Field>

          <Field label={`Connection Type ${isCreate ? "*" : ""}`}>
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

          {isCreate && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Splitter ID (optional)">
                <input
                  name="splitterId"
                  value={form.splitterId}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>

              <Field label="Splitter Port (optional)">
                <input
                  name="splitterPort"
                  value={form.splitterPort}
                  onChange={onChange}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? "Saving..." : isCreate ? "Create" : "Update"}
            </button>

            {/* ✅ theme bg */}
            <button
              type="button"
              onClick={() => (isCreate ? navigate("/") : navigate(`/customers/${id}`))}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
            >
              Cancel
            </button>
          </div>
        </form>

        {!isCreate && (
          <p className="mt-4 text-sm text-slate-400">
            Note: Name, address, and neighborhood are fixed after onboarding. Update
            plan/status/connectionType here.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

/* ✅ theme input bg */
const inputCls =
  "h-10 w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 disabled:opacity-70";
