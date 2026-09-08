import { useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import Login from "./pages/Login";
import AdminLayout from "./AdminLayout";
import MilestonesPage from "./pages/MilestonesPage";
import UsersPage from "./pages/UsersPage";
import AdminsPage from "./pages/AdminsPage";
import GroupsPage from "./pages/GroupsPage";
import PayoutsPage from "./pages/PayoutsPage";
import AffiliatesPage from "./pages/AffiliatesPage";
import PaymentTestModePage from "./pages/PaymentTestModePage";

const hasPrivilege = (auth, privilege) =>
  (auth?.privileges ?? "").includes(privilege);

function App() {
  const { auth } = useSelector((state) => state.auth);
  const { initializeAuth, hasInitialized } = useAuth();

  useEffect(() => {
    if (!hasInitialized) {
      initializeAuth();
    }
  }, [hasInitialized, initializeAuth]);

  if (hasInitialized) {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={auth ? <Navigate to="/users" replace /> : <Login />}
          />
          <Route
            path="/"
            element={
              <AdminLayout>
                <Navigate to="/users" replace />
              </AdminLayout>
            }
          />
          <Route
            path="/milestones"
            element={
              <AdminLayout>
                {auth && hasPrivilege(auth, "video-verification") ? <MilestonesPage /> : auth ? <Navigate to="/users" replace /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
          <Route
            path="/users"
            element={
              <AdminLayout>
                {auth ? <UsersPage /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
          <Route
            path="/admins"
            element={
              <AdminLayout>
                {auth && hasPrivilege(auth, "admin-creation") ? <AdminsPage /> : auth ? <Navigate to="/users" replace /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
          <Route
            path="/groups"
            element={
              <AdminLayout>
                {auth && hasPrivilege(auth, "support") ? <GroupsPage /> : auth ? <Navigate to="/users" replace /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
          <Route
            path="/payouts"
            element={
              <AdminLayout>
                {auth && hasPrivilege(auth, "finance") ? <PayoutsPage /> : auth ? <Navigate to="/users" replace /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
          <Route
            path="/affiliates"
            element={
              <AdminLayout>
                {auth && (hasPrivilege(auth, "finance") || hasPrivilege(auth, "admin-creation")) ? <AffiliatesPage /> : auth ? <Navigate to="/users" replace /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
          <Route
            path="/payment-test-mode"
            element={
              <AdminLayout>
                {auth && hasPrivilege(auth, "admin-creation") ? <PaymentTestModePage /> : auth ? <Navigate to="/users" replace /> : <Navigate to="/login" replace />}
              </AdminLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }
}

export default App;
