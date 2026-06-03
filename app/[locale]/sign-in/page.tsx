"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  params: Promise<{ locale: string }>;
}

export default function SignInPage({ params }: Props) {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("en");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));

    const err = searchParams.get("error");
    if (err === "auth_error") setError(ta("authFailed"));
  }, [params, searchParams, ta]);

  const mapAuthError = (msg: string): string => {
    if (msg.includes("Invalid login credentials") || msg.includes("User not found"))
      return ta("invalidCredentials");
    if (msg.includes("Email not confirmed"))
      return ta("emailNotConfirmed");
    if (msg.includes("Too many requests") || msg.includes("rate limit"))
      return ta("tooManyRequests");
    if (msg.includes("Account not found"))
      return ta("notRegistered");
    return ta("signInError");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(mapAuthError(authError.message));
      setLoading(false);
      return;
    }

    const rawRedirect = searchParams.get("redirect");
    const redirect =
      rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//")
        ? rawRedirect
        : `/${locale}/account`;
    router.push(redirect);
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/account`,
      },
    });
  };

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
            {t("signIn")}
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            {ta("subtitle")}
          </p>
        </div>

        <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-8">
          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                {ta("emailLabel")}
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
                {ta("passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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

            <div className="flex justify-end">
              <Link
                href={`/${locale}/forgot-password`}
                className="text-xs text-[#6B7280] hover:text-[#A855F7] transition-colors"
              >
                {ta("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-medium py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? ta("signingIn") : t("signIn")}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#2D2D4E]" />
            <span className="text-xs text-[#4B5563]">{ta("orDivider")}</span>
            <div className="flex-1 h-px bg-[#2D2D4E]" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 border border-[#2D2D4E] hover:border-[#7C3AED]/60 text-[#9CA3AF] hover:text-[#F0E6FF] py-3 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {ta("continueWithGoogle")}
          </button>
        </div>

        {/* Footer links */}
        <p className="text-center text-sm text-[#6B7280] mt-6">
          {ta("noAccount")}{" "}
          <Link href={`/${locale}/sign-up`} className="text-[#A855F7] hover:text-[#C084FC] transition-colors">
            {ta("signUpLink")}
          </Link>
        </p>
        <p className="text-center text-sm text-[#6B7280] mt-2">
          {ta("haveDeviceCode")}{" "}
          <Link href={`/${locale}/unlock`} className="text-[#A855F7] hover:text-[#C084FC] transition-colors">
            {ta("unlockTutorial")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
