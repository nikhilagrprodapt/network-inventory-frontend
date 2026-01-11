import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assetsApi } from "../api/assets.api";

export default function AssetsBulkUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);

    if (!file) {
      setErr("Please select a CSV file.");
      return;
    }

    try {
      setLoading(true);
      const res = await assetsApi.bulkUpload(file);
      setResult(res || null);
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
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Bulk Upload Assets (CSV)</h2>

        <button
          onClick={() => navigate("/assets")}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
        >
          Back to Assets
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300 text-sm">
          <div className="font-semibold text-slate-100 mb-2">CSV Format</div>
          <pre className="whitespace-pre-wrap text-xs text-slate-300">
type,serialNumber,model,status
ONT,ONT-SN5001,Nokia G-240W-F,AVAILABLE
ROUTER,RTR-SN9001,TP-Link AX10,AVAILABLE
          </pre>
          <div className="mt-2 text-xs text-slate-400">
            Columns required: <span className="text-slate-200">type, serialNumber, model, status</span> <br />
            Type must match backend enum (ONT/ROUTER/...) and status must match (AVAILABLE/ASSIGNED/FAULTY/RETIRED).
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
            {err}
          </div>
        )}

        {result && (
          <div className="mt-3 rounded-xl border border-emerald-700/40 bg-emerald-950/40 p-4 text-emerald-200 whitespace-pre-wrap">
            <div className="font-semibold">✅ Upload Finished</div>
            <div className="mt-1 text-sm">
              Created: <b>{result.createdCount}</b> | Failed: <b>{result.failedCount}</b>
            </div>

            {Array.isArray(result.failures) && result.failures.length > 0 && (
              <div className="mt-3 rounded-lg border border-slate-800 bg-[#0f172a] p-3 text-slate-200">
                <div className="font-semibold text-slate-100">Failures</div>
                <ul className="mt-2 list-disc pl-5 text-xs text-slate-300 space-y-1">
                  {result.failures.map((f, idx) => (
                    <li key={idx}>
                      Row {f.rowNumber}: {f.serialNumber ? `[${f.serialNumber}] ` : ""}{f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 max-w-xl">
          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-medium">Choose CSV File *</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-70"
            >
              {loading ? "Uploading..." : "Upload CSV"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setErr("");
                setResult(null);
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99]"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
