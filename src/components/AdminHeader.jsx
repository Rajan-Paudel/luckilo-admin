import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, Target, Shield, MessageCircle, LogOut, X, MoreVertical, KeyRound, Loader2, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useApiCall from "../hooks/useApiCall";
import { useSelector } from "react-redux";

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const apiCall = useApiCall();
  const { auth } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const pathname = location.pathname;
  const isMilestones = pathname === "/milestones";
  const isUsers = pathname === "/users";
  const isAdmins = pathname === "/admins";
  const isGroups = pathname === "/groups";
  const isPayouts = pathname === "/payouts";
  const hasAdminCreation = auth?.privileges?.includes("admin-creation");

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
      await apiCall("admin/change-password", "POST", { oldPassword: oldPwd, newPassword: newPwd }, true);
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

  return (
    <><header className="w-full  backdrop-blur-xl sticky  top-0 z-40">
      <div className="flex mx-auto gap-10 w-full max-w-7xl px-6 h-16 justify-center items-center ">
        <span className="text-lg text-nowrap text-white/40">
          Admin Dashbaord
        </span>

        <div className="hidden md:flex  items-center  w-full  justify-end gap-8">
          <button
            onClick={() => {
              navigate("/milestones");
              setMenuOpen(false);
            }}
            className={`text-sm font-medium transition-colors ${
              isMilestones ? "text-gold" : "text-white/40 hover:text-white"
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => {
              navigate("/users");
              setMenuOpen(false);
            }}
            className={`text-sm font-medium transition-colors ${
              isUsers ? "text-gold" : "text-white/40 hover:text-white"
            }`}
          >
            Users
          </button>
          {hasAdminCreation && (
            <button
              onClick={() => {
                navigate("/admins");
                setMenuOpen(false);
              }}
              className={`text-sm font-medium transition-colors ${
                isAdmins ? "text-gold" : "text-white/40 hover:text-white"
              }`}
            >
              Admins
            </button>
          )}
          <button
            onClick={() => {
              navigate("/groups");
              setMenuOpen(false);
            }}
            className={`text-sm font-medium transition-colors ${
              isGroups ? "text-gold" : "text-white/40 hover:text-white"
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => {
              navigate("/payouts");
              setMenuOpen(false);
            }}
            className={`text-sm font-medium transition-colors ${
              isPayouts ? "text-gold" : "text-white/40 hover:text-white"
            }`}
          >
            Payouts
          </button>
        </div>

      
          <div className="relative mt-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Menu"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="hidden md:block absolute right-0 top-full mt-2  bg-obsidian-950 border border-white/10 shadow-xl overflow-hidden z-70">
                <div className="px-4 py-2.5 text-nowrap text-sm text-white/40 border-b border-white/10">
                  {auth?.email}
                </div>
                <button
                  onClick={() => { setShowChangePwd(true); setMenuOpen(false); }}
                  className="w-full text-nowrap flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <KeyRound size={16} />
                  Change Password
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                ref={mobileMenuRef}
                key="mobile-menu"
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 w-full h-dvh z-60 md:hidden bg-obsidian-950"
              >
                <div className="pt-6 pb-2">
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <h1 className="text-md font-medium text-white/30">{auth?.email} </h1>
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/milestones");
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isMilestones
                        ? "text-gold bg-gold/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Target size={16} />
                    <span className="flex-1 text-left">Milestones</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/users");
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isUsers
                        ? "text-gold bg-gold/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Users size={16} />
                    <span className="flex-1 text-left">Users</span>
                  </button>
                  {hasAdminCreation && (
                    <button
                      onClick={() => {
                        navigate("/admins");
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isAdmins
                          ? "text-gold bg-gold/5"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Shield size={16} />
                      <span className="flex-1 text-left">Admins</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigate("/groups");
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isGroups
                        ? "text-gold bg-gold/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <MessageCircle size={16} />
                    <span className="flex-1 text-left">Groups</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate("/payouts");
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isPayouts
                        ? "text-gold bg-gold/5"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <DollarSign size={16} />
                    <span className="flex-1 text-left">Payouts</span>
                  </button>
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => { setShowChangePwd(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <KeyRound size={16} />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                 
                </div>
              </motion.div>
            )}
          </AnimatePresence>
       
    
      </div>
    </header>
      {showChangePwd && (
        <div className="fixed inset-0 z-[70] bg-obsidian-950/95 flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-medium">Change Password</h3>
              <button
                onClick={() => { setShowChangePwd(false); setPwdError(""); setPwdSuccess(false); setOldPwd(""); setNewPwd(""); setConfirmPwd(""); }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {pwdError && (
              <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} />
                {pwdError}
              </div>
            )}

            {pwdSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-green-400" />
                </div>
                <p className="text-sm text-white/60">Password changed successfully</p>
                <button
                  onClick={() => { setShowChangePwd(false); setPwdSuccess(false); }}
                  className="mt-4 w-full bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Current Password</label>
                  <input
                    type="password"
                    value={oldPwd}
                    onChange={(e) => setOldPwd(e.target.value)}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full bg-gold text-obsidian-950 py-3 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {pwdLoading ? <><Loader2 size={16} className="animate-spin" /> Updating...</> : "Change Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHeader;
