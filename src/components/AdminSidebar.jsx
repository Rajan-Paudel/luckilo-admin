import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Target,
  Shield,
  MessageCircle,
  LogOut,
  KeyRound,
  DollarSign,
  FlaskConical,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Award,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApiCall from "../hooks/useApiCall";
import { useSelector } from "react-redux";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const apiCall = useApiCall();
  const { auth } = useSelector((state) => state.auth);

  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-user-menu]")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasAdminCreation = auth?.privileges?.includes("admin-creation");
  const hasVideoVerification = auth?.privileges?.includes("video-verification");
  const hasFinance = auth?.privileges?.includes("finance");
  const hasSupport = auth?.privileges?.includes("support");

  const pathname = location.pathname;

  const menuItems = [
    {
      label: "Milestones",
      path: "/milestones",
      icon: Target,
      show: hasVideoVerification,
    },
    {
      label: "Users",
      path: "/users",
      icon: Users,
      show: true,
    },
    {
      label: "Admins",
      path: "/admins",
      icon: Shield,
      show: hasAdminCreation,
    },
    {
      label: "Groups",
      path: "/groups",
      icon: MessageCircle,
      show: hasSupport,
    },
    {
      label: "Payouts",
      path: "/payouts",
      icon: DollarSign,
      show: hasFinance,
    },
    {
      label: "Affiliates",
      path: "/affiliates",
      icon: Award,
      show: hasFinance || hasAdminCreation,
    },
    {
      label: "Test Mode",
      path: "/payment-test-mode",
      icon: FlaskConical,
      show: hasAdminCreation,
    },
  ].filter((item) => item.show);

  const activePath = menuItems.find((item) => item.path === pathname)?.path;

  const go = (path) => {
    navigate(path);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);
    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }
    setPwdLoading(true);
    try {
      await apiCall(
        "admin/change-password",
        "POST",
        { oldPassword: oldPwd, newPassword: newPwd },
        true
      );
      setPwdSuccess(true);
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdError(err.message || "Failed to change password");
    } finally {
      setPwdLoading(false);
    }
  };

  const closePwd = () => {
    setShowChangePwd(false);
    setPwdError("");
    setPwdSuccess(false);
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  const renderHeader = (compact) => (
    <div
      className={`flex h-16 items-center border-b border-white/8 ${
        compact ? "justify-center" : "justify-between pl-4"
      }`}
    >
      <div className="flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="h-8 w-8 shrink-0" />
        {!compact && (
          <span className="font-serif text-lg text-white">
            Luckilo<span className="text-gold">.</span>
          </span>
        )}
      </div>
    </div>
  );

  const renderNav = (compact) => (
    <nav className="mt-2 flex-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = activePath === item.path;
        return (
          <button
            key={item.path}
            onClick={() => go(item.path)}
            title={compact ? item.label : undefined}
            className={`group relative flex w-full items-center text-sm transition-all ${
              compact ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
            } ${
              active
                ? "bg-gold/10 text-gold"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
            {!compact && <span className="flex-1 text-left">{item.label}</span>}
            {active && (
              <span className="absolute right-0 top-0 h-full w-[3px] bg-gold" />
            )}
          </button>
        );
      })}
    </nav>
  );

  const DesktopSidebar = (
    <aside
      className={`relative sticky top-0 flex h-dvh shrink-0 flex-col border-r border-white/8 bg-obsidian-900 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {renderHeader(collapsed)}

      {renderNav(collapsed)}

      <div className={`relative mt-auto border-t border-white/8 ${collapsed ? "flex justify-center py-3" : "p-3"}`} data-user-menu>
        {collapsed ? (
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title="Account options"
            className="flex h-9 w-9 items-center justify-center bg-gold/10 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
          >
            {auth?.email?.[0]?.toUpperCase() || "A"}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title="Account options"
              className="flex h-9 w-9 shrink-0 items-center justify-center bg-gold/10 text-sm font-medium text-gold transition-colors hover:bg-gold/20"
            >
              {auth?.email?.[0]?.toUpperCase() || "A"}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/80">{auth?.email}</p>
              <p className="truncate text-xs text-white/30">Administrator</p>
            </div>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex shrink-0 items-center justify-center p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            >
              <MoreVertical size={18} strokeWidth={1.8} />
            </button>
          </div>
        )}

        {userMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 min-w-[200px] border border-white/8 bg-obsidian-800 shadow-xl ${
              collapsed ? "left-full ml-2" : "left-3"
            }`}
          >
            <button
              onClick={() => {
                setUserMenuOpen(false);
                setShowChangePwd(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <KeyRound size={16} strokeWidth={1.8} />
              <span>Change Password</span>
            </button>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 border-t border-white/8 px-4 py-3 text-sm text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut size={16} strokeWidth={1.8} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {DesktopSidebar}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand" : "Collapse"}
        className="fixed top-[14px] z-50 flex h-8 w-8 -translate-x-1/2 items-center justify-center text-white/50 transition-colors hover:text-white"
        style={{ left: collapsed ? 96 : 224 }}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {showChangePwd && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-obsidian-950/95 px-4">
          <div className="w-full max-w-sm border border-white/8 bg-obsidian-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-medium text-white">Change Password</h3>
              <button
                onClick={closePwd}
                className="text-white/40 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {pwdError && (
              <div className="mb-4 flex items-center gap-2 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} />
                {pwdError}
              </div>
            )}

            {pwdSuccess ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center bg-green-400/10">
                  <CheckCircle size={24} className="text-green-400" />
                </div>
                <p className="text-sm text-white/60">
                  Password changed successfully
                </p>
                <button
                  onClick={closePwd}
                  className="mt-4 w-full border border-white/10 bg-white/5 py-3 text-sm text-white/60 transition-colors hover:bg-white/10"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian-950 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian-950 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full border border-white/10 bg-obsidian-950 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex w-full items-center justify-center gap-2 bg-gold py-3 text-sm font-medium text-obsidian-950 transition-colors hover:bg-gold-hover disabled:opacity-50"
                >
                  {pwdLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
