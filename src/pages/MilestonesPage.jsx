import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMilestones } from "../redux/slice/dataSlice";
import useApiCall from "../hooks/useApiCall";
import {
  Target, Loader2, CheckCircle, XCircle, AlertTriangle,
  Play, TrendingDown, Calendar, ArrowDown,
  RefreshCw, Maximize2, X
} from "lucide-react";

const statusColors = {
  CREATED: "text-blue-400 bg-blue-400/10",
  RUNNING: "text-green-400 bg-green-400/10",
  START_VERIFICATION_SUBMITTED: "text-purple-400 bg-purple-400/10",
  START_VERIFICATION_REJECTED: "text-orange-400 bg-orange-400/10",
  END_VERIFICATION_SUBMITTED: "text-yellow-400 bg-yellow-400/10",
  END_VERIFICATION_REJECTED: "text-orange-400 bg-orange-400/10",
  SUCCESS: "text-green-400 bg-green-400/10",
  FAILED: "text-red-500 bg-red-500/10",
  TERMINATED: "text-red-600 bg-red-600/10",
};

const MilestonesPage = () => {
  const dispatch = useDispatch();
  const apiCall = useApiCall();
  const { milestones, milestonesFetched, loading } = useSelector((state) => state.data);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);

  useEffect(() => {
    if (!milestonesFetched) dispatch(fetchMilestones());
  }, [dispatch, milestonesFetched]);

  const refreshMilestones = () => dispatch(fetchMilestones());

  const handleApprove = async (milestoneId) => {
    setActionLoading(true);
    try {
      await apiCall(`admin/milestones/${milestoneId}/approve`, "POST", null, true);
      refreshMilestones();
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await apiCall(
        `admin/milestones/${rejectModal}/reject`,
        "POST",
        { reason: rejectReason, notes: rejectNotes },
        true
      );
      setRejectModal(null);
      setRejectReason("");
      setRejectNotes("");
      refreshMilestones();
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = {
    total: milestones.length,
    activeCount: milestones.filter(
      (m) => ["CREATED", "RUNNING", "START_VERIFICATION_SUBMITTED", "END_VERIFICATION_SUBMITTED", "END_VERIFICATION_REJECTED"].includes(m.status)
    ).length,
    pendingReview: milestones.filter(
      (m) => m.status === "START_VERIFICATION_SUBMITTED" || m.status === "END_VERIFICATION_SUBMITTED"
    ).length,
    successCount: milestones.filter((m) => m.status === "SUCCESS").length,
    failedCount: milestones.filter((m) => m.status === "FAILED").length,
    totalBetAmount: milestones.reduce((sum, m) => sum + m.betAmount, 0),
    totalPayout: milestones
      .filter((m) => m.status === "SUCCESS")
      .reduce((sum, m) => sum + m.potentialPayout, 0),
  };

  const pendingReview = milestones.filter(
    (m) => m.status === "START_VERIFICATION_SUBMITTED" || m.status === "END_VERIFICATION_SUBMITTED"
  );

  const activeMilestones = milestones.filter(
    (m) => ["CREATED", "RUNNING", "START_VERIFICATION_REJECTED", "END_VERIFICATION_REJECTED"].includes(m.status)
  );

  const history = milestones.filter(
    (m) => !["CREATED", "RUNNING", "START_VERIFICATION_SUBMITTED", "START_VERIFICATION_REJECTED", "END_VERIFICATION_SUBMITTED", "END_VERIFICATION_REJECTED"].includes(m.status)
  );

  return (
    <>
      <main className="px-6 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/8">
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
                    <div className="flex items-center gap-2">
                      <Target size={14} />
                      Total Milestones
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-white">{stats.total}</div>
                </div>
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
                    <div className="flex items-center gap-2">
                      <Play size={14} />
                      Active
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-white">{stats.activeCount}</div>
                </div>
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-gold/80 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} />
                      Pending Review
                    </div>
                  </div>
                  <div className="font-mono text-2xl text-gold">{stats.pendingReview}</div>
                </div>
                <div className="bg-obsidian-900 p-6">
                  <div className="text-xs uppercase tracking-[0.25em] text-white/40 mb-2">
                    <div className="flex items-center gap-2">
                      Success / Failed
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl text-green-400">{stats.successCount}</span>
                    <span className="text-white/30">/</span>
                    <span className="font-mono text-2xl text-red-400">{stats.failedCount}</span>
                  </div>
                </div>
              </div>
            </section>

            {pendingReview.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={18} className="text-gold" />
                  <h2 className="text-lg text-white font-medium">Pending Review</h2>
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-1">{pendingReview.length}</span>
                  <button
                    onClick={refreshMilestones}
                    className="ml-auto p-1 text-white/40 hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingReview.map((m) => (
                    <div key={m.id} className="bg-obsidian-900 border border-gold/20 p-6">
                      <div className="flex items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-4">
                            <Target size={18} className="text-gold" />
                            <span className="text-white font-medium">{m.userName}</span>
                            <span className={`text-xs px-2 py-1 ml-auto ${statusColors[m.status]}`}>
                              {m.status.replace(/_/g, " ")}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-obsidian-950 border border-white/5 p-3">
                              <div className="text-xs text-white/40 mb-1">Target Loss</div>
                              <div className="text-white font-mono">{m.targetLossKg}kg</div>
                            </div>
                            <div className="bg-obsidian-950 border border-white/5 p-3">
                              <div className="text-xs text-white/40 mb-1">Bet Amount</div>
                              <div className="text-gold font-mono">Rs. {m.betAmount.toLocaleString()}</div>
                            </div>
                            <div className="bg-obsidian-950 border border-white/5 p-3">
                              <div className="text-xs text-white/40 mb-1">Potential Payout</div>
                              <div className="text-green-400 font-mono">Rs. {m.potentialPayout.toLocaleString()}</div>
                            </div>
                            <div className="bg-obsidian-950 border border-white/5 p-3">
                              <div className="text-xs text-white/40 mb-1">Start → Target</div>
                              <div className="text-white font-mono text-sm">{m.startingWeightKg}kg → {m.targetWeightKg}kg</div>
                            </div>
                          </div>

                          {m.status === "START_VERIFICATION_SUBMITTED" && (
                            <div className="space-y-3 mb-4">
                              <div className="bg-obsidian-950 border border-white/5 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/30">Attempt #{m.startVideoAttemptCount}</span>
                                    <span className="text-xs px-2 py-0.5 bg-white/5 text-white/60">{m.startVideoStatus}</span>
                                  </div>
                                  <span className="text-xs text-white/30">
                                    {m.startVideoSubmittedAt ? new Date(m.startVideoSubmittedAt).toLocaleString() : "N/A"}
                                  </span>
                                </div>
                                {m.startVideoRejectionReason && (
                                  <div className="flex items-start gap-2 text-sm bg-red-500/10 p-3 border border-red-500/20">
                                    <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                      <div className="text-red-400 font-medium">Rejection Reason</div>
                                      <div className="text-white/60">{m.startVideoRejectionReason}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {m.status === "END_VERIFICATION_SUBMITTED" && (
                            <div className="space-y-3 mb-4">
                              <div className="bg-obsidian-950 border border-white/5 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/30">Attempt #{m.endVideoAttemptCount}</span>
                                    <span className="text-xs px-2 py-0.5 bg-white/5 text-white/60">{m.endVideoStatus}</span>
                                  </div>
                                  <span className="text-xs text-white/30">
                                    {m.endVideoSubmittedAt ? new Date(m.endVideoSubmittedAt).toLocaleString() : "N/A"}
                                  </span>
                                </div>
                                {m.endVideoRejectionReason && (
                                  <div className="flex items-start gap-2 text-sm bg-red-500/10 p-3 border border-red-500/20">
                                    <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                      <div className="text-red-400 font-medium">Rejection Reason</div>
                                      <div className="text-white/60">{m.endVideoRejectionReason}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {m.status === "END_VERIFICATION_SUBMITTED" && !m.hasPayoutAccount && (
                            <div className="flex items-center gap-2 mb-4 text-sm bg-orange-500/10 p-3 border border-orange-500/20">
                              <AlertTriangle size={16} className="text-orange-400 shrink-0" />
                              <span className="text-orange-300">
                                User has no linked payout account — a pending payout will be recorded; send it from the Payouts page once they link an account.
                              </span>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApprove(m.id)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 bg-gold text-obsidian-950 px-4 py-2 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-50"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(m.id)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        </div>

                        {(m.status === "START_VERIFICATION_SUBMITTED" && m.startVideoUrl) || (m.status === "END_VERIFICATION_SUBMITTED" && m.endVideoUrl) ? (
                          <div
                            className="shrink-0 cursor-pointer group"
                            onClick={() => setFullscreenVideo({
                              url: m.status === "START_VERIFICATION_SUBMITTED" ? m.startVideoUrl : m.endVideoUrl,
                              name: m.userName,
                              type: m.status.includes("START") ? "Start" : "End"
                            })}
                          >
                            <div className="w-40 h-24 bg-obsidian-950 border border-white/10 overflow-hidden flex items-center justify-center group-hover:border-gold/40 transition-colors relative">
                              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/60 to-transparent" />
                              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors z-10">
                                <Maximize2 size={18} className="text-gold" />
                              </div>
                              <div className="absolute bottom-2 left-2 text-xs text-white/40 z-10">
                                {m.status.includes("START") ? "Start" : "End"} Video
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeMilestones.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Play size={18} className="text-blue-400" />
                  <h2 className="text-lg text-white font-medium">Active Milestones ({activeMilestones.length})</h2>
                </div>
                <div className="space-y-3">
                  {activeMilestones.map((m) => (
                    <div key={m.id} className="bg-obsidian-900 border border-white/8 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target size={18} className="text-blue-400" />
                        <span className="text-white font-medium">{m.userName}</span>
                        <span className={`text-xs px-2 py-1 ml-auto ${statusColors[m.status]}`}>
                          {m.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Target Loss</div>
                          <div className="text-white font-mono">{m.targetLossKg}kg</div>
                        </div>
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Bet Amount</div>
                          <div className="text-gold font-mono">Rs. {m.betAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Potential Payout</div>
                          <div className="text-green-400 font-mono">Rs. {m.potentialPayout.toLocaleString()}</div>
                        </div>
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Timeline</div>
                          <div className="text-white font-mono text-sm">
                            {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingDown size={16} className="text-gold" />
                          <span className="text-white/40">Start:</span>
                          <span className="text-white">{m.startingWeightKg}kg</span>
                          <span className="text-white/30">→</span>
                          <span className="text-green-400">{m.targetWeightKg}kg</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-gold" />
                          <span className="text-white/40">Timeline:</span>
                          <span className="text-white">
                            {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Target size={16} className="text-gold" />
                          <span className="text-white/40">Attempts:</span>
                          <span className="text-white font-mono">{m.startVideoAttemptCount + m.endVideoAttemptCount} / 5</span>
                        </div>
                        {(m.startVideoAttemptCount > 0 || m.endVideoAttemptCount > 0) && (
                          <div className="flex items-start gap-2 text-sm bg-orange-500/10 p-3 border border-orange-500/20">
                            <AlertTriangle size={16} className="text-orange-400 mt-0.5" />
                            <div>
                              <div className="text-orange-400 font-medium">
                                {m.startVideoAttemptCount + m.endVideoAttemptCount} submission(s)
                              </div>
                              {(m.startVideoRejectionReason || m.endVideoRejectionReason) && (
                                <div className="text-white/60">
                                  {m.startVideoRejectionReason || m.endVideoRejectionReason}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {history.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowDown size={18} className="text-gold" />
                  <h2 className="text-lg text-white font-medium">Milestone History ({history.length})</h2>
                </div>
                <div className="space-y-3">
                  {history.map((m) => (
                    <div key={m.id} className="bg-obsidian-900 border border-white/8 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-white font-medium">{m.userName}</span>
                          <span className={`text-xs px-2 py-1 ${statusColors[m.status]}`}>
                            {m.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-xs text-white/30">
                          {new Date(m.startDate).toLocaleDateString()} - {new Date(m.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Target Loss</div>
                          <div className="text-white font-mono">{m.targetLossKg}kg</div>
                        </div>
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Bet Amount</div>
                          <div className="text-gold font-mono">Rs. {m.betAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Potential Payout</div>
                          <div className="text-green-400 font-mono">Rs. {m.potentialPayout.toLocaleString()}</div>
                        </div>
                        <div className="bg-obsidian-950 border border-white/5 p-3">
                          <div className="text-xs text-white/40 mb-1">Start → Target</div>
                          <div className="text-white font-mono text-sm">{m.startingWeightKg}kg → {m.targetWeightKg}kg</div>
                        </div>
                      </div>
                      {m.status === "SUCCESS" && (
                        <div className="mt-3 flex items-center gap-2 text-sm bg-green-500/10 p-3 border border-green-500/20">
                          <CheckCircle size={16} className="text-green-400" />
                          <span className="text-green-400 font-medium">Success!</span>
                          {m.payoutStatus ? (
                            <span className="text-white/60">
                              Payout of Rs. {m.potentialPayout.toLocaleString()} —{" "}
                              <span className={
                                m.payoutStatus === "PROCESSED" ? "text-green-400 font-medium" :
                                m.payoutStatus === "PENDING" ? "text-yellow-300 font-medium" :
                                m.payoutStatus === "QUEUED" || m.payoutStatus === "PROCESSING" ? "text-blue-300 font-medium" :
                                "text-white/80"
                              }>
                                {m.payoutStatus}
                              </span>
                            </span>
                          ) : (
                            <span className="text-orange-300">No payout entry found — use Payouts page to check.</span>
                          )}
                        </div>
                      )}
                      {m.status === "FAILED" && (
                        <div className="mt-3 flex items-center gap-2 text-sm bg-red-500/10 p-3 border border-red-500/20">
                          <XCircle size={16} className="text-red-400" />
                          <span className="text-red-400 font-medium">Failed</span>
                          <span className="text-white/60">Better luck next time!</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {milestones.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <div className="w-24 h-24 bg-obsidian-900 border border-white/10 flex items-center justify-center mb-6">
                  <Target size={48} className="text-white/20" />
                </div>
                <h2 className="text-2xl text-white/60 font-medium mb-3">No Milestones</h2>
                <p className="text-white/40 max-w-md">
                  Milestones will appear here once users start creating them.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {fullscreenVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center" onClick={() => setFullscreenVideo(null)}>
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10"
            onClick={() => setFullscreenVideo(null)}
          >
            <X size={32} />
          </button>
          <div className="w-full h-full flex flex-col items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-xl text-white font-medium mb-1">{fullscreenVideo.name}</h3>
              <span className="text-sm text-white/40">{fullscreenVideo.type} verification video</span>
            </div>
            <div className="w-full max-w-5xl">
              <video src={fullscreenVideo.url} controls autoPlay className="w-full max-h-[70vh]">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-xl flex items-center justify-center">
          <div className="bg-obsidian-900 border border-white/8 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-medium">Reject Milestone</h3>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); setRejectNotes(""); }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Reason *</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                  placeholder="Reason for rejection"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">Notes (optional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50 h-24 resize-none"
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(""); setRejectNotes(""); }}
                  className="flex-1 bg-white/5 text-white/60 py-3 text-sm hover:bg-white/10 transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-3 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MilestonesPage;
