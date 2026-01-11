import { useAuth } from "../auth/AuthContext";
import CustomersList from "./CustomersList";
import PlannerCustomersList from "./PlannerCustomersList";

function hasRole(user, role) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const norm = roles.map((r) => String(r).replace(/^ROLE_/, "").toUpperCase());
  const single = user?.role ? String(user.role).replace(/^ROLE_/, "").toUpperCase() : "";
  return norm.includes(role) || single === role;
}

export default function CustomersRoute() {
  const { user } = useAuth();

  const isAdmin = hasRole(user, "ADMIN");
  const isPlanner = hasRole(user, "PLANNER");

  if (isAdmin) return <CustomersList />;
  if (isPlanner) return <PlannerCustomersList />;

  // fallback (safe)
  return <PlannerCustomersList />;
}
