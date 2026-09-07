import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAdmins } from "../redux/slice/dataSlice";
import useApiCall from "../hooks/useApiCall";
import {
  Shield, Loader2, Plus, X, Copy, Check, AlertTriangle
} from "lucide-react";

const PRIVILEGE_OPTIONS = [
  "admin-creation",
  "video-verification",
  "finance",
  "support",
];

const statusBadge = {
  Active: "text-green-400 bg-green-400/10",
  Blocked: "text-red-400 bg-red-400/10",
  Disabled: "text-yellow-400 bg-yellow-400/10",
};

const generatePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const STATUS_OPTIONS = ["Active", "Blocked", "Disabled"];

const AdminsPage = () => {
  const dispatch = useDispatch();
  const apiCall = useApiCall();
  const { auth } = useSelector((state) => state.auth);
  const { admins, adminsFetched, loading } = useSelector((state) => state.data);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [selectedPrivileges, setSelectedPrivileges] = useState([...PRIVILEGE_OPTIONS]);
  const [creating, setCreating] = useState(false);
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);

  const isSuperAdmin = auth?.email === "admin@luckilo.com";
  const refreshAdmins = () => dispatch(fetchAdmins());

  const handleStatusChange = async () => {
    if (!confirmStatus) return;
    const { adminId } = confirmStatus;
    setStatusUpdating(adminId);
    setConfirmStatus(null);
    try {
      await apiCall(`admin/admins/${adminId}/status`, "PATCH", { status: confirmStatus.newStatus }, true);
      refreshAdmins();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setStatusUpdating(null);
    }
  };

  useEffect(() => {
    if (!adminsFetched) dispatch(fetchAdmins());
  }, [dispatch, adminsFetched]);

  const togglePrivilege = (p) => {
    setSelectedPrivileges((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setCreating(true);
    try {
      const password = generatePassword();
      await apiCall("admin/admins", "POST", {
        email: newEmail,
        password,
        privileges: selectedPrivileges,
      }, true);
      setCreds({ email: newEmail, password });
      setShowCreate(false);
      setNewEmail("");
      setSelectedPrivileges([...PRIVILEGE_OPTIONS]);
      refreshAdmins();
    } catch (err) {
      console.error("Failed to create admin:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (creds) {
      const message = `Hi ${creds.email},

Welcome to Luckilo! Below are the credentials for your Luckilo administrative account:

Email: ${creds.email}
Password: ${creds.password}`;
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <main className="py-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gold" />
                <h1 className="text-xl text-white font-medium">Admin Accounts</h1>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-gold text-obsidian-950 px-4 py-2 text-sm font-medium hover:bg-gold-hover transition-colors"
              >
                <Plus size={16} />
                Create Admin
              </button>
            </div>

            <div className="bg-obsidian-900 border border-white/8 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Email</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Status</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Privileges</th>
                      <th className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-4 text-white">{a.email}</td>
                        <td className="px-6 py-4">
                          {isSuperAdmin && a.email !== "admin@luckilo.com" ? (
                            <select
                              value={a.status}
                              onChange={(e) => setConfirmStatus({ adminId: a.id, adminEmail: a.email, currentStatus: a.status, newStatus: e.target.value })}
                              disabled={statusUpdating === a.id}
                              className={`text-xs px-2 py-1 outline-none border cursor-pointer ${
                                statusBadge[a.status]?.split(" ")[0]
                                  ? `${statusBadge[a.status]} border-transparent`
                                  : "text-white/30 bg-white/5 border-white/10"
                              } ${statusUpdating === a.id ? "opacity-50" : ""}`}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s} className="bg-obsidian-900 text-white">
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs px-2 py-1 ${statusBadge[a.status] || "text-white/30 bg-white/5"}`}>
                              {a.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {a.privileges?.map((p) => (
                              <span key={p} className="text-xs px-2 py-0.5 bg-gold/10 text-gold/80">
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white/40">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                    {admins.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-white/30">
                          No admin accounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg text-white font-medium">Create Admin</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                  placeholder="newadmin@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-3">Privileges</label>
                <div className="space-y-3">
                  {PRIVILEGE_OPTIONS.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrivileges.includes(p)}
                        onChange={() => togglePrivilege(p)}
                        className="w-4 h-4 accent-gold"
                      />
                      <span className="text-sm text-white/60 group-hover:text-white transition-colors">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-white/30 mb-4">
                  Password will be auto-generated and shown once after creation.
                </p>
                <button
                  type="submit"
                  disabled={creating || !newEmail.trim() || selectedPrivileges.length === 0}
                  className="w-full bg-gold text-obsidian-950 py-3 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <><Loader2 size={16} className="animate-spin" /> Creating...</>
                  ) : (
                    "Create Admin"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {creds && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-gold/20 p-6 w-full max-w-md text-center">
            <div className="w-14 h-14 bg-green-400/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-400" />
            </div>
            <h2 className="text-lg text-white font-medium mb-1">Admin Created</h2>
            <p className="text-sm text-white/40 mb-6">Save these credentials — the password won't be shown again.</p>

            <div className="bg-obsidian-950 border border-white/10 p-4 mb-6 text-left space-y-3">
              <div>
                <div className="text-xs text-white/30 mb-1">Email</div>
                <div className="text-sm text-white font-mono">{creds.email}</div>
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1">Password</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gold font-mono flex-1 break-all">{creds.password}</div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    title="Copy password"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCreds(null)}
              className="w-full bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {confirmStatus && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-400/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Change Status</h3>
                <p className="text-sm text-white/40">{confirmStatus.adminEmail}</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-6">
              Change status from{" "}
              <span className={`text-xs px-1.5 py-0.5 ${statusBadge[confirmStatus.currentStatus]}`}>
                {confirmStatus.currentStatus}
              </span>{" "}
              to{" "}
              <span className={`text-xs px-1.5 py-0.5 ${statusBadge[confirmStatus.newStatus]}`}>
                {confirmStatus.newStatus}
              </span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmStatus(null)}
                className="flex-1 bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                className="flex-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 py-3 text-sm font-medium hover:bg-yellow-400/20 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminsPage;
