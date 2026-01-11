import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assetsApi } from "../api/assets.api";

export default function AssetHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await assetsApi.history(id);
      setRows(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading history...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200 whitespace-pre-wrap">
        {err}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Asset #{id} — History</h2>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate("/assets")}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No history found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Assigned At</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Unassigned At</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={r.assignmentId ?? idx}
                      className="border-t border-slate-800 transition hover:bg-slate-900/50"
                    >
                      <td className="px-3 py-3 text-sm text-slate-200">
                        {r.assignedAt ? new Date(r.assignedAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-200">
                        {r.unassignedAt ? new Date(r.unassignedAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-200">
                        {r.customer?.customerId ?? r.customerId ?? "-"}{" "}
                        {r.customer?.name ? `— ${r.customer.name}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
