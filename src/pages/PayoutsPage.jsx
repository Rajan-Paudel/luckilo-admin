import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchPayouts } from "../redux/slice/dataSlice";
import useApiCall from "../hooks/useApiCall";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

const STATUS_STYLES = {
  PROCESSED: "bg-green-400/10 text-green-400 border-green-400/30",
  QUEUED: "bg-blue-400/10 text-blue-300 border-blue-400/30",
  PENDING: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
  PROCESSING: "bg-purple-400/10 text-purple-300 border-purple-400/30",
  FAILED: "bg-red-400/10 text-red-400 border-red-400/30",
  REVERSED: "bg-orange-400/10 text-orange-300 border-orange-400/30",
  CANCELLED: "bg-white/5 text-white/40 border-white/10",
};

const formatAmount = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const PayoutsPage = () => {
  const dispatch = useDispatch();
  const apiCall = useApiCall();
  const { payouts, payoutsFetched, loading } = useSelector((state) => state.data);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!payoutsFetched) dispatch(fetchPayouts());
  }, [dispatch, payoutsFetched]);

  const stats = {
    totalPaid: payouts.filter((p) => p.status === "PROCESSED").reduce((sum, p) => sum + p.amount, 0),
    awaitingInitiation: payouts.filter((p) => p.status === "PENDING" && !p.razorpayPayoutId).length,
    inFlight: payouts.filter((p) => ["QUEUED", "PENDING", "PROCESSING"].includes(p.status) && (p.razorpayPayoutId || p.status !== "PENDING")).length,
    failed: payouts.filter((p) => ["FAILED", "REVERSED", "CANCELLED"].includes(p.status)).length,
    count: payouts.length,
  };

  const runAction = async (payoutId, action) => {
    setActionLoading(`${action}:${payoutId}`);
    setActionError(null);
    try {
      await apiCall(`admin/payouts/${payoutId}/${action}`, "POST", null, true);
      dispatch(fetchPayouts());
    } catch (err) {
      setActionError(err.message || `Failed to ${action} payout`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="py-4">
      <section className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-px bg-white/5 border border-white/8">
        <div className="bg-obsidian-900 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-green-400/80 mb-2">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Total Paid Out</div>
          </div>
          <div className="font-mono text-2xl text-green-400">{formatAmount(stats.totalPaid)}</div>
        </div>
        <div className="bg-obsidian-900 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-blue-300/80 mb-2">
            <div className="flex items-center gap-2"><Clock size={14} /> In Flight</div>
          </div>
          <div className="font-mono text-2xl text-blue-300">{stats.inFlight}</div>
        </div>
        <div className="bg-obsidian-900 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-red-400/80 mb-2">
            <div className="flex items-center gap-2"><AlertTriangle size={14} /> Failed</div>
          </div>
          <div className="font-mono text-2xl text-red-400">{stats.failed}</div>
        </div>
        <div className="bg-obsidian-900 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
            <div className="flex items-center gap-2"><DollarSign size={14} /> Total Payouts</div>
          </div>
          <div className="font-mono text-2xl text-white">{stats.count}</div>
        </div>
        <div className="bg-obsidian-900 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-yellow-400/80 mb-2">
            <div className="flex items-center gap-2"><AlertTriangle size={14} /> Awaiting Initiation</div>
          </div>
          <div className="font-mono text-2xl text-yellow-300">{stats.awaitingInitiation}</div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        <>
          {actionError && (
            <div className="mb-4 px-4 py-3 bg-red-400/10 border border-red-400/30 text-red-400 text-sm">
              {actionError}
            </div>
          )}
          <div className="bg-obsidian-900 border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-sm uppercase tracking-[0.25em] text-white/50">All Payouts</h2>
              <button
                onClick={() => dispatch(fetchPayouts())}
                className="flex items-center gap-2 text-xs text-gold hover:text-gold-hover"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {["User", "Bet / Payout", "Account", "Status", "UTR", "Failure Reason", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs uppercase tracking-[0.25em] text-white/30 px-4 py-4 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] align-top">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-white">{p.userName || "-"}</div>
                        <div className="text-white/40 text-xs mt-0.5">{p.userEmail}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-white/60 text-xs">Bet {formatAmount(p.betAmount)}</div>
                        <div className="text-gold font-mono mt-0.5">{formatAmount(p.amount)}</div>
                      </td>
                      <td className="px-4 py-4 text-white/60 text-xs max-w-[180px] truncate" title={p.payoutAccountSummary || ""}>
                        {p.payoutAccountSummary || <span className="text-red-400/80">None linked</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 border ${STATUS_STYLES[p.status] || STATUS_STYLES.CANCELLED}`}>
                          {p.status}
                        </span>
                        {p.retryCount > 0 && (
                          <div className="text-white/30 text-[10px] mt-1">retries: {p.retryCount}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-white/60 text-xs">{p.utr || "-"}</td>
                      <td className="px-4 py-4 text-red-400/80 text-xs max-w-[200px]" title={p.failureReason || ""}>
                        {p.failureReason ? (p.failureReason.length > 60 ? `${p.failureReason.slice(0, 60)}...` : p.failureReason) : "-"}
                      </td>
                      <td className="px-4 py-4 text-white/40 text-xs whitespace-nowrap">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {p.status === "FAILED" && (
                            <button
                              onClick={() => runAction(p.id, "retry")}
                              disabled={actionLoading !== null}
                              title="Retry payout via RazorpayX"
                              className="flex items-center gap-1 text-xs text-gold hover:text-gold-hover disabled:opacity-40"
                            >
                              {actionLoading === `retry:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                              Retry
                            </button>
                          )}
                          {p.razorpayPayoutId && p.status !== "PROCESSED" && (
                            <button
                              onClick={() => runAction(p.id, "resync")}
                              disabled={actionLoading !== null}
                              title="Re-sync status from RazorpayX"
                              className="flex items-center gap-1 text-xs text-white/50 hover:text-white disabled:opacity-40"
                            >
                              {actionLoading === `resync:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                              Re-sync
                            </button>
                          )}
                          {p.status === "PENDING" && !p.razorpayPayoutId && (
                            <button
                              onClick={() => runAction(p.id, "initiate")}
                              disabled={actionLoading !== null || !p.hasActivePayoutAccount}
                              title="Initiate payout via RazorpayX"
                              className="flex items-center gap-1 text-xs text-gold hover:text-gold-hover disabled:opacity-40"
                            >
                              {actionLoading === `initiate:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                              Initiate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-white/30">No payouts yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default PayoutsPage;
