"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { LogIn, UserPlus, Loader, AlertCircle } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass-panel rounded-3xl shadow-2xl animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{isSignUp ? "Join MusicWorld" : "Welcome Back"}</h2>
        <p className="text-white/60 text-sm">Save your tabs and practice anywhere.</p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : isSignUp ? (
            <>
              <UserPlus className="w-5 h-5" />
              Sign Up
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>
        
        <div className="flex items-center gap-4 my-2">
          <div className="h-px flex-1 bg-white/10"></div>
          <span className="text-white/20 text-xs uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-white/10"></div>
        </div>

        <button
          onClick={async () => {
            setEmail("admin@musicworld.com");
            setPassword("musicworld123");
            // We'll let the user fill it or just trigger the handler if they want
          }}
          className="text-white/40 hover:text-white/80 text-xs transition-colors"
        >
          Use Demo Account: admin@musicworld.com
        </button>
      </div>
    </div>
  );
}
