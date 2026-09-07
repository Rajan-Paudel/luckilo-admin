import { useState, useEffect } from "react";
import useApiCall from "../hooks/useApiCall";
import {
  FlaskConical, Loader2, Plus, X, AlertCircle, CheckCircle, Info
} from "lucide-react";

const PaymentTestModePage = () => {
  const apiCall = useApiCall();

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);

  const loadEmails = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const res = await apiCall("admin/payment/test-mode-emails", "GET", null, true);
      setEmails(res?.emails || []);
    } catch (err) {
      setError(err.message || "Failed to load test-mode emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadEmails();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalize = (email) => (email || "").trim().toLowerCase();

  const handleAdd = (e) => {
    e.preventDefault();
    const email = normalize(newEmail);
    if (!email) return;
    if (emails.includes(email)) {
      setError("Email is already in the list");
      return;
    }
    setEmails((prev) => [...prev, email]);
    setNewEmail("");
    setError("");
    setDirty(true);
  };

  const handleRemove = (email) => {
    setEmails((prev) => prev.filter((x) => x !== email));
    setDirty(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiCall("admin/payment/test-mode-emails", "POST", { emails }, true);
      setEmails(res?.emails || []);
      setSuccess("Test-mode emails updated successfully");
      setDirty(false);
    } catch (err) {
      setError(err.message || "Failed to save test-mode emails");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="py-4">
      <div className="flex items-center gap-3 mb-2">
        <FlaskConical size={20} className="text-gold" />
        <h1 className="text-xl text-white font-medium">Payment Test Mode</h1>
      </div>

      <div className="flex items-start gap-2 mb-8 text-sm text-white/40">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>
          Users listed here will be routed to Razorpay <span className="text-gold/80">TEST</span> keys
          when creating milestone payment orders. Payouts always use live keys.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 bg-green-400/10 border border-green-400/20 px-4 py-3 text-sm text-green-400">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 bg-obsidian-900 border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-gold/50"
          placeholder="user@example.com"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-gold text-obsidian-950 px-5 py-3 text-sm font-medium hover:bg-gold-hover transition-colors"
        >
          <Plus size={16} />
          Add Email
        </button>
      </form>

      <div className="bg-obsidian-900 border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gold" />
          </div>
        ) : (
          <>
            {emails.length === 0 ? (
              <div className="px-6 py-12 text-center text-white/30 text-sm">
                No test-mode emails added yet
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {emails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02]"
                  >
                    <span className="text-sm text-white">{email}</span>
                    <button
                      onClick={() => handleRemove(email)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                      aria-label={`Remove ${email}`}
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading || !dirty}
          className="flex items-center justify-center gap-2 bg-gold text-obsidian-950 px-6 py-3 text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-50"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : "Save Changes"}
        </button>
      </div>
    </main>
  );
};

export default PaymentTestModePage;
