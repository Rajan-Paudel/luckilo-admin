import AdminSidebar from "./components/AdminSidebar";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-obsidian-950">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="w-full max-w-7xl mx-auto px-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;