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
        <AdminLayout>
          <Routes>
            <Route
              path="/login"
              element={auth ? <Navigate to="/milestones" replace /> : <Login />}
            />
            <Route
              path="/"
              element={<Navigate to="/milestones" replace />}
            />
            <Route
              path="/milestones"
              element={auth ? <MilestonesPage /> : <Navigate to="/login" replace />}
            />
          <Route
            path="/users"
            element={auth ? <UsersPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admins"
            element={auth ? <AdminsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/groups"
            element={auth ? <GroupsPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/payouts"
            element={auth ? <PayoutsPage /> : <Navigate to="/login" replace />}
          />
          </Routes>
        </AdminLayout>
      </BrowserRouter>
    );
  }
}

export default App;
