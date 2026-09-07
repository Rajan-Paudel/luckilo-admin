import { useState } from "react";
import useAuth from "../hooks/useAuth";
import {
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-obsidian-950 flex items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #FACC15 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 bg-gold/5 blur-3xl" />

      <div className="relative w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-white/10 bg-obsidian-900">
            <img src="/favicon.svg" alt="" className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-serif text-white mb-2">
            Luckilo<span className="text-gold">.</span>
          </h1>
          <p className="text-white/40 text-sm tracking-wide">
            Admin Dashboard
          </p>
        </div>

        <div className="bg-obsidian-900 border border-white/8 p-8">
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck size={16} className="text-gold" />
            <span className="text-sm text-white/60">Secure Admin Access</span>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-gold/50"
                  placeholder="admin@luckilo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-white/10 bg-obsidian-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-gold/50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-gold py-3 text-sm font-medium text-obsidian-950 transition-colors hover:bg-gold-hover disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Login;