import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function hasRole(user, role) {
  const norm = (v) => String(v || "").replace(/^ROLE_/, "").toUpperCase();
  const target = norm(role);

  const roles = user?.roles;
  const roleSingle = user?.role;

  if (Array.isArray(roles)) return roles.map(norm).includes(target);
  if (typeof roles === "string") return norm(roles) === target;
  if (roleSingle) return norm(roleSingle) === target;

  return false;
}

export default function Login() {
  const { login, isAuthed, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ If already logged in, redirect to correct portal
  useEffect(() => {
    if (!isAuthed) return;

    const isSupportAgent = hasRole(user, "SUPPORT_AGENT");
    const target = isSupportAgent ? "/support" : "/";

    if (location.pathname === "/login") {
      navigate(target, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, user]);

  const from = location.state?.from || "";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const result = await login(username.trim(), password);

      const loggedInUser = result?.user || {};
      const isSupportAgent = hasRole(loggedInUser, "SUPPORT_AGENT");

      const safeFrom =
        from && typeof from === "string" && from !== "/login" ? from : "";

      const target = safeFrom || (isSupportAgent ? "/support" : "/");
      navigate(target, { replace: true });
    } catch (e2) {
      console.error("Login error:", e2);
      const status = e2?.response?.status;
      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        e2?.message ||
        "Login failed";
      setErr(`Login failed. HTTP ${status || "?"}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0b1220] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-100">Login</h2>
        <p className="mt-1 text-sm text-slate-400">Sign in to Network Inventory</p>

        {err && (
          <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-xs text-slate-500">Backend: http://localhost:8989</div>
        </form>
      </div>
    </div>
  );
}
