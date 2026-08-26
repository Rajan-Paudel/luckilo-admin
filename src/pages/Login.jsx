import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-10">
        
          <h1 className="text-3xl flex items-center justify-center font-serif text-white mb-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8 mr-2" />
            Luckilo<span className="text-amber-500">.</span>
          </h1>
          <p className="text-white/40 text-sm">Admin Dashboard</p>
        </div>

        <div className="bg-[#12121a] border border-white/8 p-8">
          {error && (
            <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-amber-500/50 transition-colors"
                placeholder="admin@luckilo.com"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-white/40 block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 text-white px-4 py-3 text-sm outline-none focus:border-amber-500/50 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-[#0a0a0f] py-3 text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
