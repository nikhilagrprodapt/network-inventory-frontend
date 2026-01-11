import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.api";

const AuthCtx = createContext(null);

function safeJsonParse(v, fallback = null) {
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function normalizeRoles(user) {
  // supports:
  // - user.roles: ["ADMIN"] or ["ROLE_ADMIN"]
  // - user.role: "ADMIN"
  const raw =
    user?.roles ??
    (user?.role ? [user.role] : []);

  const arr = Array.isArray(raw) ? raw : [raw];

  return arr
    .map((r) => String(r).trim())
    .filter(Boolean)
    .map((r) => r.replace(/^ROLE_/, "").toUpperCase());
}

function normalizeUser(u) {
  const username = u?.username ?? "";
  const roles = normalizeRoles(u);
  const role = roles[0] || (u?.role ? String(u.role).toUpperCase() : null);

  return {
    ...u,
    username,
    role,
    roles,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => normalizeUser(safeJsonParse(localStorage.getItem("user") || "null", {}) || {}));

  const setSession = (t, u) => {
    const nu = normalizeUser(u || {});
    localStorage.setItem("token", t || "");
    localStorage.setItem("user", JSON.stringify(nu));
    setToken(t || "");
    setUser(nu);
  };

  const login = async (username, password) => {
    const { token: t, user: u } = await authApi.login(username, password);
    if (!t) throw new Error("Token missing in login response");

    // store role immediately
    setSession(t, u);

    // then refresh from /me (authorities) if possible
    try {
      const me = await authApi.me(); // returns { username, roles: ["ROLE_ADMIN"] }
      if (me) {
        setSession(t, { ...u, ...me });
      }
    } catch {
      // ignore
    }

    return { token: t, user: normalizeUser(u) };
  };

  const logout = () => {
    authApi.logout();
    setToken("");
    setUser({});
  };

  // On refresh, if token exists, try load /me once
  useEffect(() => {
    const run = async () => {
      if (!token) return;
      try {
        const me = await authApi.me();
        if (me) setSession(token, { ...(user || {}), ...me });
      } catch {
        // ignore
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed: !!token,
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
