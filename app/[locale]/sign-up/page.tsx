"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Mail, Lock, User, UserPlus, Eye, EyeOff, Sparkles, CheckCircle2, ChevronDown, MapPin } from "lucide-react";
import { COUNTRIES } from "@/lib/constants/countries";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
      }) => { open: () => void };
    };
  }
}

interface Props {
  params: Promise<{ locale: string }>;
}

export default function SignUpPage({ params }: Props) {
  const router = useRouter();
  const t = useTranslations("signUp");
  const [locale, setLocale] = useState("en");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Optional address
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrCountry, setAddrCountry] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      if (l === "ko") setAddrCountry("KR");
    });
  }, [params]);

  function openDaumPostcode() {
    const open = () => {
      new window.daum!.Postcode({
        oncomplete(data) {
          setAddrPostal(data.zonecode);
          setAddrLine1(data.roadAddress || data.jibunAddress);
        },
      }).open();
    };
    if (window.daum?.Postcode) {
      open();
    } else {
      const script = document.createElement("script");
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = open;
      document.head.appendChild(script);
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("errPasswordMismatch"));
      return;
    }
    if (password.length < 8) {
      setError(t("errPasswordShort"));
      return;
    }
    if (!termsAgreed || !privacyAgreed || !ageConfirmed) {
      setError(t("errRequiredAgreements"));
      return;
    }

    const defaultAddress = addrLine1.trim()
      ? {
          name: addrName.trim(),
          phone: addrPhone.trim(),
          postal: addrPostal.trim(),
          line1: addrLine1.trim(),
          line2: addrLine2.trim(),
          city: addrCity.trim(),
          country: addrCountry.trim().toUpperCase() || (locale === "ko" ? "KR" : ""),
        }
      : undefined;

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          marketing_agreed: marketingAgreed,
          terms_agreed_at: new Date().toISOString(),
          ...(defaultAddress ? { default_address: defaultAddress } : {}),
        },
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
              {t("successTitle")}
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6">
              {t("successBody", { email })}
            </p>
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center gap-2 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              {t("backToSignIn")}
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
            {t("title")}
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            {t("subtitle")}
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
                {t("nameLabel")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t("namePlaceholder")}
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                {t("emailLabel")}
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
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder={t("passwordPlaceholder")}
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
                {t("confirmLabel")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t("confirmPlaceholder")}
                  className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl pl-10 pr-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            {/* Optional shipping address */}
            <div className="border-t border-[#2D2D4E] pt-3">
              <button
                type="button"
                onClick={() => setAddrOpen(!addrOpen)}
                className="w-full flex items-center justify-between text-xs text-[#9CA3AF] hover:text-[#C084FC] transition-colors py-1"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {t("saveAddress")}
                </span>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ transform: addrOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {addrOpen && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <input
                    type="text"
                    placeholder={t("addrName")}
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                  />
                  <input
                    type="text"
                    placeholder={t("addrPhone")}
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                  />

                  {locale === "ko" ? (
                    <>
                      <div className="col-span-2 flex gap-2">
                        <input
                          type="text"
                          placeholder={t("addrPostal")}
                          value={addrPostal}
                          readOnly
                          className="flex-1 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                        />
                        <button
                          type="button"
                          onClick={openDaumPostcode}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
                        >
                          주소 찾기
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="주소"
                        value={addrLine1}
                        readOnly
                        className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                      />
                      <input
                        type="text"
                        placeholder="상세 주소 (동/호수 등)"
                        value={addrLine2}
                        onChange={(e) => setAddrLine2(e.target.value)}
                        className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </>
                  ) : (
                    <>
                      <select
                        value={addrCountry}
                        onChange={(e) => setAddrCountry(e.target.value)}
                        className="bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] focus:outline-none focus:border-[#7C3AED]"
                      >
                        <option value="">{t("country")}</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder={t("addrPostal")}
                        value={addrPostal}
                        onChange={(e) => setAddrPostal(e.target.value)}
                        className="bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                      />
                      <input
                        type="text"
                        placeholder={t("addrLine1")}
                        value={addrLine1}
                        onChange={(e) => setAddrLine1(e.target.value)}
                        className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                      />
                      <input
                        type="text"
                        placeholder={t("addrLine2")}
                        value={addrLine2}
                        onChange={(e) => setAddrLine2(e.target.value)}
                        className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                      />
                      <input
                        type="text"
                        placeholder={t("addrCity")}
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="col-span-2 bg-[#13131F] border border-[#2D2D4E] rounded-xl px-3 py-2 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED]"
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-2.5 pt-2 border-t border-[#2D2D4E]">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#2D2D4E] bg-[#13131F] text-[#7C3AED] accent-[#7C3AED] shrink-0"
                />
                <span className="text-xs text-[#9CA3AF] group-hover:text-[#C084FC] transition-colors leading-relaxed">
                  {locale === "ko" ? (
                    <><Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">이용약관</Link>에 동의합니다 <span className="text-red-400">*</span></>
                  ) : locale === "ja" ? (
                    <><Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">利用規約</Link>に同意します <span className="text-red-400">*</span></>
                  ) : locale === "zh-CN" ? (
                    <>我同意<Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">服务条款</Link> <span className="text-red-400">*</span></>
                  ) : locale === "de" ? (
                    <>Ich stimme den <Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Nutzungsbedingungen</Link> zu <span className="text-red-400">*</span></>
                  ) : locale === "fr" ? (
                    <>J&apos;accepte les <Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Conditions d&apos;Utilisation</Link> <span className="text-red-400">*</span></>
                  ) : locale === "es" ? (
                    <>Acepto los <Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Términos de Servicio</Link> <span className="text-red-400">*</span></>
                  ) : (
                    <>I agree to the <Link href={`/${locale}/terms`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Terms of Service</Link> <span className="text-red-400">*</span></>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#2D2D4E] bg-[#13131F] text-[#7C3AED] accent-[#7C3AED] shrink-0"
                />
                <span className="text-xs text-[#9CA3AF] group-hover:text-[#C084FC] transition-colors leading-relaxed">
                  {locale === "ko" ? (
                    <><Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">개인정보처리방침</Link>에 동의합니다 <span className="text-red-400">*</span></>
                  ) : locale === "ja" ? (
                    <><Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">プライバシーポリシー</Link>に同意します <span className="text-red-400">*</span></>
                  ) : locale === "zh-CN" ? (
                    <>我同意<Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">隐私政策</Link> <span className="text-red-400">*</span></>
                  ) : locale === "de" ? (
                    <>Ich stimme der <Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Datenschutzerklärung</Link> zu <span className="text-red-400">*</span></>
                  ) : locale === "fr" ? (
                    <>J&apos;accepte la <Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Politique de Confidentialité</Link> <span className="text-red-400">*</span></>
                  ) : locale === "es" ? (
                    <>Acepto la <Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Política de Privacidad</Link> <span className="text-red-400">*</span></>
                  ) : (
                    <>I agree to the <Link href={`/${locale}/privacy`} className="text-[#A855F7] underline underline-offset-2" target="_blank">Privacy Policy</Link> <span className="text-red-400">*</span></>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#2D2D4E] bg-[#13131F] text-[#7C3AED] accent-[#7C3AED] shrink-0"
                />
                <span className="text-xs text-[#9CA3AF] group-hover:text-[#C084FC] transition-colors leading-relaxed">
                  {t("ageConfirm")} <span className="text-red-400">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#2D2D4E] bg-[#13131F] text-[#7C3AED] accent-[#7C3AED] shrink-0"
                />
                <span className="text-xs text-[#9CA3AF] group-hover:text-[#C084FC] transition-colors leading-relaxed">
                  {t("marketing")}
                </span>
              </label>
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
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("alreadyHaveAccount")}{" "}
          <Link href={`/${locale}/sign-in`} className="text-[#A855F7] hover:text-[#C084FC] transition-colors">
            {t("signInLink")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
