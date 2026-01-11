import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { coreSwitchesApi } from "../api/coreSwitches.api";
import { headendsApi } from "../api/headends.api";

export default function CoreSwitchesList() {
  const [items, setItems] = useState([]);
  const [headends, setHeadends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const headendMap = useMemo(() => {
    const m = new Map();
    headends.forEach((h) => m.set(String(h.headendId), h));
    return m;
  }, [headends]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [cs, h] = await Promise.all([coreSwitchesApi.getAll(), headendsApi.getAll()]);
      setItems(Array.isArray(cs) ? cs : []);
      setHeadends(Array.isArray(h) ? h : []);
    } catch {
      setErr("Failed to load core switches / headends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-4 text-slate-200">
        Loading Core Switches...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-red-200">
        {err}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold text-slate-100">Core Switches</h2>

        <div className="flex items-center gap-2">
          <Link
            to="/core-switches/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            + Add Core Switch
          </Link>

          <button
            onClick={load}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0f172a] px-4 text-sm font-medium text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-900/50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0b1220] p-4 shadow-sm">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 text-slate-300">
            No core switches found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Location</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-300">Headend</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((cs, idx) => {
                    const hid = cs.headendId ?? cs.headend?.headendId ?? null;
                    const head = hid != null ? headendMap.get(String(hid)) : null;

                    return (
                      <tr
                        key={cs.coreSwitchId ?? idx}
                        className="border-t border-slate-800 transition hover:bg-slate-900/50"
                      >
                        <td className="px-3 py-3 text-sm text-slate-200">{cs.coreSwitchId}</td>
                        <td className="px-3 py-3 text-sm font-medium text-slate-100">{cs.name}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">{cs.location ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-slate-200">
                          {hid ? (head ? `${hid} — ${head.name}` : `${hid}`) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
