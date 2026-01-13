import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./auth/RequireAuth";
import RequireRole from "./auth/RequireRole";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

import CustomersRoute from "./pages/CustomersRoute";
import CustomerForm from "./pages/CustomerForm";
import CustomerDetails from "./pages/CustomerDetails";

import SplittersList from "./pages/SplittersList";
import SplitterForm from "./pages/SplitterForm";

import FDHList from "./pages/FDHList";
import FDHForm from "./pages/FDHForm";

import FiberDropLinesList from "./pages/FiberDropLinesList";
import FiberDropLineForm from "./pages/FiberDropLineForm";

import AuditLogs from "./pages/AuditLogs";

import AssetsList from "./pages/AssetsList";
import AssetForm from "./pages/AssetForm";
import AssetAssign from "./pages/AssetAssign";
import AssetHistory from "./pages/AssetHistory";
import AssetsBulkUpload from "./pages/AssetsBulkUpload";

import HeadendsList from "./pages/HeadendsList";
import HeadendForm from "./pages/HeadendForm";

import CoreSwitchesList from "./pages/CoreSwitchesList";
import CoreSwitchForm from "./pages/CoreSwitchForm";

import TechniciansList from "./pages/TechniciansList";
import TechnicianForm from "./pages/TechnicianForm";

import TasksList from "./pages/TasksList";
import TaskForm from "./pages/TaskForm";
import TaskDetail from "./pages/TaskDetail";

import TopologyPage from "./pages/Topology/TopologyPage";
import OnboardingWizard from "./pages/OnboardingWizard";

// Support
import SupportCustomers from "./pages/Support/SupportCustomers";
import SupportCustomerDetails from "./pages/Support/SupportCustomerDetails";

// Technician
import MyTasks from "./pages/MyTasks";

import AdminAuditLogs from "./pages/Admin/AdminAuditLogs";
import AdminUsers from "./pages/Admin/AdminUsers";

import AiAssistant from "./pages/AiAssistant";


const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER", // ✅ ADDED
  TECHNICIAN: "TECHNICIAN",
  PLANNER: "PLANNER",
  INVENTORY_MANAGER: "INVENTORY_MANAGER",
  SUPPORT_AGENT: "SUPPORT_AGENT",
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected App */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout>
                <Routes>
                  {/* ✅ ONE Dashboard for ALL roles */}
                  <Route path="/" element={<Dashboard />} />

                  {/* Technician-only */}
                  <Route
                    path="/my-tasks"
                    element={
                      <RequireRole allowed={[ROLE.TECHNICIAN]}>
                        <MyTasks />
                      </RequireRole>
                    }
                  />

                  {/* ✅ Journey 5: Topology allowed for ADMIN + PLANNER + MANAGER */}
                  <Route
                    path="/topology"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.MANAGER]}>
                        <TopologyPage />
                      </RequireRole>
                    }
                  />

                  {/* Planner + Admin */}
                  <Route
                    path="/onboarding"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER]}>
                        <OnboardingWizard />
                      </RequireRole>
                    }
                  />

                 <Route
                   path="/customers"
                   element={
                    <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.MANAGER]}>
                     <CustomersRoute />
                    </RequireRole>
                   }
                  />


                  <Route
                    path="/customers/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <CustomerForm mode="create" />
                      </RequireRole>
                    }
                  />

                 <Route
  path="/customers/:id"
  element={
    <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.MANAGER]}>
      <CustomerDetails />
    </RequireRole>
  }
/>


                  <Route
                    path="/customers/:id/edit"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <CustomerForm mode="edit" />
                      </RequireRole>
                    }
                  />

                  {/* ✅ Support Portal */}
                  <Route path="/support" element={<Navigate to="/" replace />} />

                  <Route
                    path="/support/customers"
                    element={
                      <RequireRole allowed={[ROLE.SUPPORT_AGENT]}>
                        <SupportCustomers />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/support/customers/:id"
                    element={
                      <RequireRole allowed={[ROLE.SUPPORT_AGENT]}>
                        <SupportCustomerDetails />
                      </RequireRole>
                    }
                  />

                  {/* Audit */}
                <Route
  path="/audit"
  element={
    <RequireRole allowed={[ROLE.ADMIN, ROLE.MANAGER]}>
      <AuditLogs />
    </RequireRole>
  }
/>


                    {/* ✅ UJ6 Admin pages */}
<Route
  path="/admin/audit"
  element={
    <RequireRole allowed={[ROLE.ADMIN]}>
      <AdminAuditLogs />
    </RequireRole>
  }
/>

<Route
  path="/admin/users"
  element={
    <RequireRole allowed={[ROLE.ADMIN]}>
      <AdminUsers />
    </RequireRole>
  }
/>



                  {/* Assets */}
                  <Route
                    path="/assets"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.INVENTORY_MANAGER]}>
                        <AssetsList />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/assets/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.INVENTORY_MANAGER]}>
                        <AssetForm />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/assets/:id/assign"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.INVENTORY_MANAGER]}>
                        <AssetAssign />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/assets/:id/history"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.INVENTORY_MANAGER]}>
                        <AssetHistory />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/assets/bulk-upload"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.INVENTORY_MANAGER]}>
                        <AssetsBulkUpload />
                      </RequireRole>
                    }
                  />

                  {/* Admin-only infra CRUD */}
                  <Route
                    path="/splitters"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <SplittersList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/splitters/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <SplitterForm />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/fiber-drop-lines"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <FiberDropLinesList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/fiber-drop-lines/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <FiberDropLineForm />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/fdh"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <FDHList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/fdh/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <FDHForm />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/headends"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <HeadendsList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/headends/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <HeadendForm mode="create" />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/headends/:id/edit"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <HeadendForm mode="edit" />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/core-switches"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <CoreSwitchesList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/core-switches/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <CoreSwitchForm />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/technicians"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <TechniciansList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/technicians/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <TechnicianForm mode="create" />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/technicians/:id/edit"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <TechnicianForm mode="edit" />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/tasks"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER]}>
                        <TasksList />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/tasks/new"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN]}>
                        <TaskForm />
                      </RequireRole>
                    }
                  />

                  <Route
                    path="/tasks/:taskId"
                    element={
                      <RequireRole allowed={[ROLE.ADMIN, ROLE.PLANNER, ROLE.TECHNICIAN]}>
                        <TaskDetail />
                      </RequireRole>
                    }
                  />

                  <Route
  path="/ai-assistant"
  element={
    <RequireRole allowed={[ROLE.ADMIN, ROLE.TECHNICIAN]}>
      <AiAssistant />
    </RequireRole>
  }
/>


                  {/* Catch-all */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
