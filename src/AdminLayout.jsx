import { useLocation } from "react-router-dom";
import AdminHeader from "./components/AdminHeader";
import AdminFooter from "./components/AdminFooter";

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-obsidian-950">
      {!isLoginPage && <AdminHeader />}
      <div className="min-h-[90vh] max-w-7xl w-full mx-auto">
      {children}
      </div>
      {!isLoginPage && <AdminFooter />}
    </div>
  );
};

export default AdminLayout;
