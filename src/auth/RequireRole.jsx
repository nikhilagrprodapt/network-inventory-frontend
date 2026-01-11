import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function normalizeRoles(user) {
  const rolesCandidate =
    user?.roles ??
    user?.role ??
    user?.authorities ??
    user?.authority ??
    user?.permissions;

  const clean = (r) =>
    String(r || "")
      .trim()
      .replace(/^ROLE_/, "")
      .toUpperCase();

  if (Array.isArray(rolesCandidate)) return rolesCandidate.map(clean).filter(Boolean);

  if (typeof rolesCandidate === "string") {
    return rolesCandidate
      .split(",")
      .map((s) => clean(s))
      .filter(Boolean);
  }

  return [];
}

export default function RequireRole({ allowed = [], children }) {
  const { user, isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userRoles = normalizeRoles(user);
  const allowedUpper = (allowed || []).map((r) =>
    String(r || "")
      .trim()
      .replace(/^ROLE_/, "")
      .toUpperCase()
  );

  if (allowedUpper.length === 0) return children;

  const ok = userRoles.some((r) => allowedUpper.includes(r));

  if (!ok) return <Navigate to="/" replace />;

  return children;
}
