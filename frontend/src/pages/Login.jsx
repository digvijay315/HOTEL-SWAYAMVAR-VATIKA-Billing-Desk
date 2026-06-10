import React, { useState } from "react";
import api from "../api";
import { Coffee, KeyRound, Mail, AlertTriangle } from "lucide-react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("api/auth/login", { email, password });
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full glass border border-gold-800/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>

        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-amber-600 to-yellow-400 p-3.5 rounded-2xl text-slate-950 mb-4 shadow-lg shadow-amber-500/20 animate-pulse">
            <Coffee className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-3xl font-black font-serif tracking-tight text-white">
            HOTEL SWAYAMVAR VATIKA
          </h2>
          <p className="text-xs text-amber-500 uppercase tracking-widest font-bold mt-1">
            Billing Desk
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@marwaribasa.com"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500/60 text-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-slate-650"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-amber-500/60 text-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-slate-650"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-600/20 active:scale-[0.98] transition-all flex items-center justify-center text-sm disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Access Billing Desk"}
          </button>
        </form>

        {/* Footer tip */}
      {/* <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-800/40 pt-6">
          <p>Admin credentials: <code className="text-amber-400/80">admin@marwaribasa.com</code> / <code className="text-amber-400/80">adminpassword123</code></p>
        </div>*/}
      </div>
    </div>
  );
}
