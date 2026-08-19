import { QueryClientProvider } from "@tanstack/react-query";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { queryClient } from "./lib/queryClient";

import { AuthProvider, useAuth } from "./features/auth/AuthProvider";

import AppLayout from "./components/layout/AppLayout";

import GlobalToaster from "./components/GlobalToaster";

import LoginPage from "./features/auth/LoginPage";

import SelectOrganizationPage from "./features/auth/SelectOrganizationPage";

import ResetPasswordPage from "./features/auth/ResetPasswordPage";

import RoutesIndex from "./routes";

import MaintenancePage from "./pages/MaintenancePage";

import MaintenanceControlPage from "./pages/MaintenanceControlPage";

import { usePublicMaintenance } from "./features/system-settings/hooks";

import PricingPlans from "./features/plans/PricingPlans";

import BillingPage from "./features/plans/BillingPage";

import SubscriptionSuccessPage from "./features/plans/SubscriptionSuccessPage";
import SuperAdminLoginPage from "./features/auth/SuperAdminLogin";
import RenewSubscriptionPage from "./features/plans/RenewSubscriptionPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import RecoveryPasswordPage from "./features/auth/RecoveryPasswordPage";

// ======================================================
// ✅ PRIVATE ROUTE
// ======================================================

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();

  if (token) {
    return children;
  }

  return <Navigate to="/login" replace />;
}

// ======================================================
// ✅ MAINTENANCE GUARD
// ======================================================

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const { data, isLoading } = usePublicMaintenance();

  if (isLoading) {
    return null;
  }

  const normalizedPath = location.pathname.replace(/\/$/, "");

  // ✅ MAINTENANCE ENABLED
  // ======================================================
  // ✅ ROUTES ALLOWED DURING MAINTENANCE
  // ======================================================

  const bypassRoutes = ["//login", "/maintenance", "/mcp","/settings/system/maintenance"];

  // ======================================================
  // ✅ MAINTENANCE ENABLED
  // ======================================================

  if (data?.maintenance_mode === true) {
    const isBypassed = bypassRoutes.includes(normalizedPath);

    if (!isBypassed) {
      return <Navigate to="/maintenance" replace />;
    }
  }

  // ✅ MAINTENANCE DISABLED
  if (data?.maintenance_mode === false && normalizedPath === "/maintenance") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ======================================================
// ✅ MAIN APP ROUTES
// ======================================================

function MainApp() {
  return (
    <AuthProvider>
      <MaintenanceGuard>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/recovery-password" element={<RecoveryPasswordPage />}/>


          <Route path="/maintenance" element={<MaintenancePage />} />

          <Route
            path="/select-organization"
            element={
              <PrivateRoute>
                <SelectOrganizationPage />
              </PrivateRoute>
            }
          />

          <Route path="/pricing" element={<PricingPlans />} />
          <Route path="/renew-subscription" element={<RenewSubscriptionPage />} />

          <Route path="/billing" element={<BillingPage />} />

          <Route path="/register" element={<BillingPage />} />

          <Route
            path="/subscription/success"
            element={<SubscriptionSuccessPage />}
          />

          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout>
                  <RoutesIndex />
                </AppLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </MaintenanceGuard>
    </AuthProvider>
  );
}

// ======================================================
// ✅ APP
// ======================================================

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainApp />

        <GlobalToaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
