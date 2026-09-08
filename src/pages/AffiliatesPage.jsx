import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchReferrals } from "../redux/slice/dataSlice";
import useApiCall from "../hooks/useApiCall";
import {
  Award,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
  Info,
  ShieldCheck,
  Filter,
  UserCheck,
  SendHorizontal,
  Check
} from "lucide-react";
import UserSearchSelect from "../components/UserSearchSelect";

const STATUS_STYLES = {
  PENDING: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  RELEASED: "bg-green-400/10 text-green-400 border-green-400/30",
  CANCELLED: "bg-white/5 text-white/40 border-white/10",
};

const formatAmount = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const AffiliatesPage = () => {
  const dispatch = useDispatch();
  const apiCall = useApiCall();
  const { referrals, referralsFetched, loading } = useSelector((state) => state.data);

  const [activeTab, setActiveTab] = useState("referrals"); // "referrals" | "whitelist"

  // Whitelist State
  const [affiliateEmails, setAffiliateEmails] = useState([]);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [whitelistSaving, setWhitelistSaving] = useState(false);
  const [whitelistError, setWhitelistError] = useState("");
  const [whitelistSuccess, setWhitelistSuccess] = useState("");
  const [whitelistDirty, setWhitelistDirty] = useState(false);

  // Referrals Filtering & Selection State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [affiliateOnly, setAffiliateOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!referralsFetched) {
      dispatch(fetchReferrals());
    }
  }, [dispatch, referralsFetched]);

  const loadWhitelist = async (showLoading = false) => {
    if (showLoading) setWhitelistLoading(true);
    setWhitelistError("");
    try {
      const res = await apiCall("admin/affiliates/emails", "GET", null, true);
      setAffiliateEmails(res?.emails || []);
    } catch (err) {
      setWhitelistError(err.message || "Failed to load affiliate emails");
    } finally {
      setWhitelistLoading(false);
    }
  };

  useEffect(() => {
    loadWhitelist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize email helper
  const normalize = (email) => (email || "").trim().toLowerCase();

  // Check pending claims count for an affiliate email
  const getPendingClaimsForEmail = (email) => {
    const norm = normalize(email);
    const list = (referrals || []).filter(
      (r) => (r.referrerEmail || "").toLowerCase() === norm && r.status === "PENDING"
    );
    const totalAmount = list.reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    return {
      count: list.length,
      totalAmount,
    };
  };

  // Whitelist Handlers
  const handleAddAffiliateUser = (user) => {
    const email = normalize(user.email);
    if (!email) return;
    if (affiliateEmails.includes(email)) {
      setWhitelistError("Email is already in the affiliate whitelist");
      return;
    }
    setAffiliateEmails((prev) => [...prev, email]);
    setWhitelistError("");
    setWhitelistDirty(true);
  };

  const handleRemoveEmail = (email) => {
    const pending = getPendingClaimsForEmail(email);
    if (pending.count > 0) {
      setWhitelistError(
        `Cannot remove '${email}' from affiliate whitelist: this affiliate has ${pending.count} unsettled pending claim(s) totaling ${formatAmount(pending.totalAmount)}. All pending claims must be settled (marked Released or Cancelled) before removing an affiliate.`
      );
      return;
    }
    setWhitelistError("");
    setAffiliateEmails((prev) => prev.filter((x) => x !== email));
    setWhitelistDirty(true);
  };

  const handleSaveWhitelist = async () => {
    if (whitelistSaving) return;
    setWhitelistSaving(true);
    setWhitelistError("");
    setWhitelistSuccess("");
    try {
      const res = await apiCall("admin/affiliates/emails", "POST", { emails: affiliateEmails }, true);
      setAffiliateEmails(res?.emails || []);
      setWhitelistSuccess("Affiliate emails updated successfully in Blob Storage & Cache");
      setWhitelistDirty(false);
      // Also refresh referrals list as affiliate flags might change
      dispatch(fetchReferrals());
    } catch (err) {
      setWhitelistError(err.message || "Failed to save affiliate emails");
    } finally {
      setWhitelistSaving(false);
    }
  };

  // Referral Stats Calculation
  const stats = useMemo(() => {
    const list = referrals || [];
    const pendingTotal = list
      .filter((r) => r.status === "PENDING")
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    const releasedTotal = list
      .filter((r) => r.status === "RELEASED")
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    const totalCommission = list
      .filter((r) => r.status !== "CANCELLED")
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
    const pendingCount = list.filter((r) => r.status === "PENDING").length;
    const affiliateReferrers = new Set(
      list.filter((r) => r.isReferrerAffiliate).map((r) => r.referrerUserId)
    );

    return {
      pendingTotal,
      releasedTotal,
      totalCommission,
      pendingCount,
      totalCount: list.length,
      affiliatesCount: affiliateReferrers.size,
    };
  }, [referrals]);

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return (referrals || []).filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (affiliateOnly && !r.isReferrerAffiliate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refEmail = (r.referrerEmail || "").toLowerCase();
        const refName = (r.referrerName || "").toLowerCase();
        const refeeEmail = (r.refereeEmail || "").toLowerCase();
        const refeeName = (r.refereeName || "").toLowerCase();
        return (
          refEmail.includes(q) ||
          refName.includes(q) ||
          refeeEmail.includes(q) ||
          refeeName.includes(q)
        );
      }
      return true;
    });
  }, [referrals, statusFilter, affiliateOnly, searchQuery]);

  // Bulk / Single Status Update
  const updateSingleStatus = async (id, newStatus) => {
    setActionLoading(`single:${id}`);
    setActionMessage({ type: "", text: "" });
    try {
      await apiCall(`admin/referrals/${id}/status`, "PATCH", { status: newStatus }, true);
      setActionMessage({
        type: "success",
        text: `Transaction status updated to ${newStatus}`,
      });
      dispatch(fetchReferrals());
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to update transaction status",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkUpdate = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setActionLoading(`bulk:${newStatus}`);
    setActionMessage({ type: "", text: "" });
    try {
      await apiCall(
        "admin/referrals/bulk-status",
        "POST",
        {
          transactionIds: selectedIds,
          newStatus: newStatus,
        },
        true
      );
      setActionMessage({
        type: "success",
        text: `Successfully updated ${selectedIds.length} transaction(s) to ${newStatus}`,
      });
      setSelectedIds([]);
      dispatch(fetchReferrals());
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.message || "Bulk update failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleaseAllForReferrer = async (referrerUserId, referrerEmail) => {
    if (!window.confirm(`Release all pending commissions for ${referrerEmail}?`)) return;
    setActionLoading(`user:${referrerUserId}`);
    setActionMessage({ type: "", text: "" });
    try {
      const res = await apiCall(
        "admin/referrals/bulk-status",
        "POST",
        {
          referrerUserId: referrerUserId,
          currentStatus: "PENDING",
          newStatus: "RELEASED",
        },
        true
      );
      setActionMessage({
        type: "success",
        text: `Released ${res.count || 0} transaction(s) for ${referrerEmail}`,
      });
      dispatch(fetchReferrals());
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.message || "Failed to release commissions for referrer",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReferrals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReferrals.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <main className="py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Award size={22} className="text-gold" />
          <div>
            <h1 className="text-xl text-white font-medium">Affiliates & Referrals</h1>
            <p className="text-xs text-white/40">
              Manage unlimited affiliate referral whitelists & offline manual commission payouts
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-obsidian-900 border border-white/8 p-1">
          <button
            onClick={() => setActiveTab("referrals")}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
              activeTab === "referrals"
                ? "bg-gold text-obsidian-950 font-medium"
                : "text-white/60 hover:text-white"
            }`}
          >
            <DollarSign size={16} />
            <span>Referrals & Payouts</span>
            {stats.pendingCount > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === "referrals"
                    ? "bg-obsidian-950 text-gold font-bold"
                    : "bg-yellow-400/20 text-yellow-300"
                }`}
              >
                {stats.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
              activeTab === "whitelist"
                ? "bg-gold text-obsidian-950 font-medium"
                : "text-white/60 hover:text-white"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Affiliate Whitelist</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                activeTab === "whitelist"
                  ? "bg-obsidian-950 text-gold font-bold"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {affiliateEmails.length}
            </span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage.text && (
        <div
          className={`mb-6 flex items-center justify-between gap-2 border px-4 py-3 text-sm ${
            actionMessage.type === "success"
              ? "bg-green-400/10 border-green-400/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ type: "", text: "" })}
            className="text-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TAB 1: Referrals & Manual Payouts */}
      {activeTab === "referrals" && (
        <div>
          {/* Stats Bar */}
          <section className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-px bg-white/5 border border-white/8">
            <div className="bg-obsidian-900 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-yellow-400/80 mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} /> Pending Payout
                </div>
              </div>
              <div className="font-mono text-2xl text-yellow-300">
                {formatAmount(stats.pendingTotal)}
              </div>
              <div className="text-xs text-white/30 mt-1">
                {stats.pendingCount} transactions awaiting settlement
              </div>
            </div>

            <div className="bg-obsidian-900 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-green-400/80 mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} /> Settled Payout
                </div>
              </div>
              <div className="font-mono text-2xl text-green-400">
                {formatAmount(stats.releasedTotal)}
              </div>
              <div className="text-xs text-white/30 mt-1">
                Manually released offline
              </div>
            </div>

            <div className="bg-obsidian-900 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-gold/80 mb-2">
                <div className="flex items-center gap-2">
                  <Award size={14} /> Total Commission
                </div>
              </div>
              <div className="font-mono text-2xl text-gold">
                {formatAmount(stats.totalCommission)}
              </div>
              <div className="text-xs text-white/30 mt-1">
                10% of referee milestone bets
              </div>
            </div>

            <div className="bg-obsidian-900 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} /> Active Affiliates
                </div>
              </div>
              <div className="font-mono text-2xl text-white">
                {stats.affiliatesCount}
              </div>
              <div className="text-xs text-white/30 mt-1">
                Generated referral bets
              </div>
            </div>

            <div className="bg-obsidian-900 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign size={14} /> Total Referrals
                </div>
              </div>
              <div className="font-mono text-2xl text-white">
                {stats.totalCount}
              </div>
              <div className="text-xs text-white/30 mt-1">
                Paid milestone referees
              </div>
            </div>
          </section>

          {/* Controls & Search */}
          <div className="bg-obsidian-900 border border-white/8 p-4 mb-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by referrer or referee email / name..."
                className="w-full bg-obsidian-950 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-obsidian-950 border border-white/10 px-3 py-1.5 text-sm">
                <Filter size={14} className="text-white/40" />
                <span className="text-xs uppercase tracking-wider text-white/40">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-obsidian-900">All Statuses</option>
                  <option value="PENDING" className="bg-obsidian-900">Pending</option>
                  <option value="RELEASED" className="bg-obsidian-900">Released</option>
                  <option value="CANCELLED" className="bg-obsidian-900">Cancelled</option>
                </select>
              </div>

              <label className="flex items-center gap-2 bg-obsidian-950 border border-white/10 px-3 py-2 text-sm text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={affiliateOnly}
                  onChange={(e) => setAffiliateOnly(e.target.checked)}
                  className="accent-gold h-4 w-4 rounded"
                />
                <span className="text-xs uppercase tracking-wider text-gold">Affiliates Only</span>
              </label>

              <button
                onClick={() => dispatch(fetchReferrals())}
                className="flex items-center gap-2 bg-obsidian-950 border border-white/10 px-3 py-2 text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors"
                title="Refresh Referrals"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="mb-4 bg-gold/10 border border-gold/30 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gold font-medium">
                <CheckCircle2 size={16} />
                <span>{selectedIds.length} transaction(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkUpdate("RELEASED")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 bg-green-500 text-obsidian-950 px-3 py-1.5 text-xs font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "bulk:RELEASED" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Mark as Released
                </button>
                <button
                  onClick={() => handleBulkUpdate("CANCELLED")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 bg-white/10 text-white/80 border border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "bulk:CANCELLED" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                  Mark as Cancelled
                </button>
                <button
                  onClick={() => handleBulkUpdate("PENDING")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1.5 text-xs font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                >
                  {actionLoading === "bulk:PENDING" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Clock size={13} />
                  )}
                  Revert to Pending
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-white/40 hover:text-white text-xs ml-2"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-obsidian-900 border border-white/8 overflow-x-auto">
            {loading && !referralsFetched ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-gold" />
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="px-6 py-16 text-center text-white/30 text-sm">
                No referral transactions found matching your criteria.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.2em] text-white/40 bg-white/[0.01]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredReferrals.length > 0 &&
                          selectedIds.length === filteredReferrals.length
                        }
                        onChange={toggleSelectAll}
                        className="accent-gold h-4 w-4 rounded"
                      />
                    </th>
                    <th className="py-3 px-4">Referrer (Partner)</th>
                    <th className="py-3 px-4">Referee (User)</th>
                    <th className="py-3 px-4 text-right">Bet Amount</th>
                    <th className="py-3 px-4 text-right">Commission (10%)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Released Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReferrals.map((r) => {
                    const isSelected = selectedIds.includes(r.id);
                    const isRowLoading =
                      actionLoading === `single:${r.id}` ||
                      actionLoading === `user:${r.referrerUserId}`;

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          isSelected ? "bg-gold/[0.04]" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(r.id)}
                            className="accent-gold h-4 w-4 rounded"
                          />
                        </td>

                        {/* Referrer */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-medium truncate max-w-[200px]">
                                  {r.referrerEmail}
                                </span>
                                {r.isReferrerAffiliate && (
                                  <span className="inline-flex items-center gap-1 bg-gold/15 text-gold border border-gold/30 text-[10px] uppercase font-bold px-1.5 py-0.5 tracking-wider shrink-0">
                                    <Award size={10} />
                                    Affiliate
                                  </span>
                                )}
                              </div>
                              {r.referrerName && (
                                <div className="text-xs text-white/40 truncate">
                                  {r.referrerName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Referee */}
                        <td className="py-3 px-4">
                          <div className="min-w-0">
                            <div className="text-white/80 truncate max-w-[180px]">
                              {r.refereeEmail}
                            </div>
                            {r.refereeName && (
                              <div className="text-xs text-white/30 truncate">
                                {r.refereeName}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Bet Amount */}
                        <td className="py-3 px-4 text-right font-mono text-white/70">
                          {formatAmount(r.betAmount)}
                        </td>

                        {/* Commission Amount */}
                        <td className="py-3 px-4 text-right font-mono text-gold font-medium">
                          {formatAmount(r.commissionAmount)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs border font-medium uppercase tracking-wider ${
                              STATUS_STYLES[r.status] || "text-white/40 border-white/10"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-4 text-xs text-white/50 whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </td>

                        {/* Released Date */}
                        <td className="py-3 px-4 text-xs text-white/50 whitespace-nowrap">
                          {formatDate(r.releasedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isRowLoading ? (
                              <Loader2 size={16} className="animate-spin text-gold" />
                            ) : (
                              <>
                                {r.status === "PENDING" && (
                                  <button
                                    onClick={() => updateSingleStatus(r.id, "RELEASED")}
                                    className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 px-2.5 py-1 text-xs transition-colors"
                                    title="Mark this offline payout as Released"
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>Release</span>
                                  </button>
                                )}

                                {r.status === "RELEASED" && (
                                  <button
                                    onClick={() => updateSingleStatus(r.id, "PENDING")}
                                    className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 px-2 py-1 text-xs transition-colors"
                                    title="Revert back to Pending"
                                  >
                                    <Clock size={12} />
                                    <span>Pending</span>
                                  </button>
                                )}

                                {r.status !== "CANCELLED" && (
                                  <button
                                    onClick={() => updateSingleStatus(r.id, "CANCELLED")}
                                    className="text-white/30 hover:text-red-400 p-1 transition-colors"
                                    title="Cancel Commission"
                                  >
                                    <X size={14} />
                                  </button>
                                )}

                                {r.status === "CANCELLED" && (
                                  <button
                                    onClick={() => updateSingleStatus(r.id, "PENDING")}
                                    className="text-xs text-white/50 hover:text-white underline p-1"
                                  >
                                    Restore
                                  </button>
                                )}

                                {/* Quick button to release all for this referrer if affiliate and has pending */}
                                {r.status === "PENDING" && (
                                  <button
                                    onClick={() =>
                                      handleReleaseAllForReferrer(
                                        r.referrerUserId,
                                        r.referrerEmail
                                      )
                                    }
                                    className="text-white/30 hover:text-gold p-1 transition-colors"
                                    title="Release ALL pending for this referrer"
                                  >
                                    <SendHorizontal size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Affiliate Whitelist */}
      {activeTab === "whitelist" && (
        <div className="max-w-4xl">
          <div className="bg-obsidian-900 border border-white/8 p-6 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-gold/10 border border-gold/20 text-gold shrink-0">
                <Info size={20} />
              </div>
              <div className="text-sm text-white/70 space-y-2">
                <p className="text-white font-medium">
                  Dynamic Affiliate Email Whitelist (Azure Blob Storage)
                </p>
                <p className="text-xs leading-relaxed text-white/50">
                  Emails whitelisted here are persisted directly to{" "}
                  <span className="text-gold font-mono">affiliate-emails.json</span> in the{" "}
                  <span className="text-white font-mono">luckilo-data</span> Azure Blob container and cached in-memory.
                </p>
                <ul className="text-xs list-disc list-inside text-white/60 space-y-1 mt-2">
                  <li>
                    <strong className="text-gold">Unlimited Referrals:</strong> Bypasses the standard 3-claim limit.
                  </li>
                  <li>
                    <strong className="text-gold">Immediate 10% Commission:</strong> Triggered whenever any referee completes payment for their milestone.
                  </li>
                  <li>
                    <strong className="text-gold">Manual Offline Payouts:</strong> Recorded as <span className="text-yellow-400 font-mono">PENDING</span> for offline settlement by admins without automated gateway transfers.
                  </li>
                </ul>
              </div>
            </div>

            {whitelistError && (
              <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} />
                {whitelistError}
              </div>
            )}

            {whitelistSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-green-400/10 border border-green-400/20 px-4 py-3 text-sm text-green-400">
                <CheckCircle size={16} />
                {whitelistSuccess}
              </div>
            )}

            {/* Add Affiliate Search & Validation Input */}
            <UserSearchSelect
              onAddUser={handleAddAffiliateUser}
              existingEmails={affiliateEmails}
              placeholder="Search registered user by name or email for affiliate whitelist..."
              buttonLabel="Add Affiliate"
            />

            {/* Whitelist Table / List */}
            <div className="bg-obsidian-950 border border-white/8 overflow-hidden">
              {whitelistLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-gold" />
                </div>
              ) : affiliateEmails.length === 0 ? (
                <div className="px-6 py-12 text-center text-white/30 text-sm">
                  No affiliate emails whitelisted yet. Search and select a registered user above.
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {affiliateEmails.map((email) => {
                    const pending = getPendingClaimsForEmail(email);
                    const hasPending = pending.count > 0;

                    return (
                      <li
                        key={email}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Award size={18} className="text-gold shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm text-white font-mono">{email}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {hasPending ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5">
                                  <Clock size={11} />
                                  {pending.count} unsettled claim{pending.count > 1 ? "s" : ""} ({formatAmount(pending.totalAmount)})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5">
                                  <CheckCircle2 size={11} />
                                  All claims settled
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {hasPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("referrals");
                                setSearchQuery(email);
                                setStatusFilter("PENDING");
                              }}
                              className="text-xs text-gold/80 hover:text-gold underline transition-colors"
                              title="Go to referral claims to settle"
                            >
                              View Pending Claims
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className={`p-1.5 transition-colors ${
                              hasPending
                                ? "text-white/20 hover:text-yellow-400 cursor-pointer"
                                : "text-white/40 hover:text-red-400"
                            }`}
                            aria-label={`Remove ${email}`}
                            title={
                              hasPending
                                ? `Cannot remove: ${pending.count} unsettled claim(s) exist`
                                : "Remove from affiliate whitelist"
                            }
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-xs text-white/40">
                {whitelistDirty ? (
                  <span className="text-yellow-400">● Unsaved changes</span>
                ) : (
                  <span>All changes saved to Azure Blob</span>
                )}
              </div>
              <button
                onClick={handleSaveWhitelist}
                disabled={whitelistSaving || whitelistLoading || !whitelistDirty}
                className="flex items-center justify-center gap-2 bg-gold text-obsidian-950 px-6 py-3 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-50"
              >
                {whitelistSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Whitelist Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AffiliatesPage;
