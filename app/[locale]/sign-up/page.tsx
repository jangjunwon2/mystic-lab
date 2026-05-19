"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, UserPlus, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default function SignUpPage({ params }: Props) {
  const router = useRouter();
  const [locale, setLocale] = useState("en");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/account`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2
              className="text-xl font-bold text-[#F0E6FF] mb-3"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              Check Your Email
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6">
              We sent a confirmation link to <strong className="text-[#F0E6FF]">{email}</strong>.
              Click the link to activate your account.
            </p>
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center gap-2 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-[#7C3AED]" />
            <span
              className="text-xl font-bold tracking-wider text-[#F0E6FF]"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              MYSTIC LAB
            </span>
          </Link>
          <h1
            className="text-2xl font-bold text-[#F0E6FF] mb-1"
            style={{ fontFamily: "var(--font-cinzel), serif" }}
          >
            Create Account
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            Join Mystic Lab to access your tutorials and orders
          </p>
        </div>

        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-8">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-10 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat your password"
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-medium py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{" "}
          <Link href={`/${locale}/sign-in`} className="text-[#A855F7] hover:text-[#C084FC] transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
