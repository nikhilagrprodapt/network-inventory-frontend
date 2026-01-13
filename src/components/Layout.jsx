import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER", // ✅ ADDED
  PLANNER: "PLANNER",
  TECHNICIAN: "TECHNICIAN",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  SUPPORT_AGENT: "SUPPORT_AGENT",
};

const NAV_ADMIN = [
  { label: "Dashboard", path: "/" },
  { label: "Topology", path: "/topology" },
  { label: "Audit Logs", path: "/audit" },
  { label: "Admin Audit (UJ6)", path: "/admin/audit" },
  { label: "Manage Roles (UJ6)", path: "/admin/users" },
  { label: "Customers", path: "/customers" },
  { label: "New Onboarding", path: "/onboarding" },
  { label: "Splitters", path: "/splitters" },
  { label: "Fiber Drop Lines", path: "/fiber-drop-lines" },
  { label: "FDH", path: "/fdh" },
  { label: "Headends", path: "/headends" },
  { label: "Core Switches", path: "/core-switches" },
  { label: "Assets", path: "/assets" },
  { label: "Technicians", path: "/technicians" },
  { label: "Tasks", path: "/tasks" },
  { label: "AI Assistant", path: "/ai-assistant" },


];

const NAV_PLANNER = [
  { label: "Dashboard", path: "/" },
  { label: "Topology", path: "/topology" }, // ✅ Journey 5 requirement
  { label: "New Onboarding", path: "/onboarding" },
  { label: "Customers", path: "/customers" },
];

// ✅ NEW: Manager nav (Journey 5)
const NAV_MANAGER = [
  { label: "Dashboard", path: "/" },
  { label: "Topology", path: "/topology" }, // ✅ Journey 5 requirement
  { label: "Audit Logs", path: "/audit" }, // optional, remove if you don’t want
  { label: "Customers", path: "/customers" }, // optional, remove if you don’t want
];

const NAV_TECHNICIAN = [
  { label: "Dashboard", path: "/" },
  { label: "My Tasks", path: "/my-tasks" },
  { label: "AI Assistant", path: "/ai-assistant" },
];

const NAV_INVENTORY = [
  { label: "Dashboard", path: "/" },
  { label: "Assets", path: "/assets" },
  { label: "Bulk Upload Assets", path: "/assets/bulk-upload" },
];

// ✅ Support Portal Nav (Journey 4) — Dashboard must be "/"
const NAV_SUPPORT = [
  { label: "Dashboard", path: "/" },
  { label: "Customers", path: "/support/customers" },
];

function normalizeRoles(user) {
  // Support both arrays & strings
  const roles = user?.roles;
  if (Array.isArray(roles))
    return roles.map((r) => String(r).replace(/^ROLE_/, "").toUpperCase());
  if (typeof roles === "string")
    return roles
      .split(",")
      .map((r) => String(r).replace(/^ROLE_/, "").trim().toUpperCase())
      .filter(Boolean);
  return [];
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthed } = useAuth();

  const roles = normalizeRoles(user);
  const roleSingle = user?.role
    ? String(user.role).replace(/^ROLE_/, "").toUpperCase()
    : "";

  const hasRole = (r) => roles.includes(r) || roleSingle === r;

  const isSupport = hasRole(ROLE.SUPPORT_AGENT);
  const isTechnician = hasRole(ROLE.TECHNICIAN);
  const isInventory = hasRole(ROLE.INVENTORY_MANAGER);
  const isPlanner = hasRole(ROLE.PLANNER);
  const isManager = hasRole(ROLE.MANAGER);
  const isAdmin = hasRole(ROLE.ADMIN);

  const isActive = (basePath) => {
    if (basePath === "/") return location.pathname === "/";
    return location.pathname === basePath || location.pathname.startsWith(basePath + "/");
  };

  // ✅ Choose nav based on role
  const navItems = isSupport
    ? NAV_SUPPORT
    : isTechnician
    ? NAV_TECHNICIAN
    : isInventory
    ? NAV_INVENTORY
    : isAdmin
    ? NAV_ADMIN
    : isManager
    ? NAV_MANAGER
    : isPlanner
    ? NAV_PLANNER
    : NAV_ADMIN;

  const showLogout = isAuthed && location.pathname !== "/login";

  const panelTitle = isSupport
    ? "Support Portal"
    : isTechnician
    ? "Technician Panel"
    : isInventory
    ? "Inventory Manager Panel"
    : isAdmin
    ? "Admin Panel"
    : isManager
    ? "Manager Panel"
    : isPlanner
    ? "Planner Panel"
    : "User Panel";

  return (
    <div className="grid h-screen grid-cols-[320px_1fr] bg-slate-950">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen overflow-y-auto border-r border-slate-800 bg-slate-950 p-4 text-slate-100">
        <h2 className="mb-4 text-lg font-semibold tracking-wide">Network Inventory</h2>

        <nav className="grid gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  "no-underline hover:no-underline",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-1 text-xs text-slate-400">
          <p>Backend: Spring Boot</p>
          <p>Frontend: React (Vite)</p>
        </div>
      </aside>

      {/* Main */}
      <main className="h-screen overflow-y-auto bg-slate-950 text-slate-200">
        {/* Top bar */}
        <div className="border-b border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <div className="text-sm font-semibold tracking-wide">{panelTitle}</div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400">
                {user?.username ? (
                  <>
                    <span className="text-slate-200 font-semibold">{user.username}</span>
                    <span className="mx-2 text-slate-600">|</span>
                    <span>{(Array.isArray(user.roles) ? user.roles.join(", ") : user.role) || "-"}</span>
                  </>
                ) : (
                  "localhost"
                )}
              </div>

              {showLogout && (
                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  className="rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:bg-slate-900/50"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="mx-auto max-w-6xl px-5 py-4">{children}</div>
      </main>
    </div>
  );
}
