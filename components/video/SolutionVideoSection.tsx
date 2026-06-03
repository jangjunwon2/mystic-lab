"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Lock, Play, ShoppingCart, KeyRound, LogIn } from "lucide-react";
import CloudflarePlayer from "@/components/video/CloudflarePlayer";

interface Props {
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasPurchased: boolean;
  /** Pre-signed iframe URL (generated server-side). Null means no video or no access. */
  signedUrl: string | null;
  videoTitle: string | null;
  locale: string;
  productSlug: string;
}

export default function SolutionVideoSection({
  isLoggedIn,
  isAdmin: _isAdmin,
  hasPurchased,
  signedUrl,
  videoTitle,
  locale,
  productSlug,
}: Props) {
  const t = useTranslations("tutorial");
  // Case 1: Has signed URL → play the video
  if (signedUrl) {
    return (
      <div className="space-y-4">
        {videoTitle && (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>{videoTitle}</p>
        )}
        <CloudflarePlayer
          src={signedUrl}
          title={videoTitle ?? t("solutionTutorial")}
        />
        <p className="text-xs flex items-center gap-1.5" style={{ color: "#6B7280" }}>
          <Play className="w-3 h-3" />
          {t("verifiedOnly")}
        </p>
      </div>
    );
  }

  // Case 2: Authenticated and purchased — video not uploaded yet
  if (isLoggedIn && hasPurchased) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <Play className="w-6 h-6" style={{ color: "#A855F7" }} />
        </div>
        <p className="font-medium mb-2" style={{ color: "#F0E6FF" }}>
          {t("comingSoonTitle")}
        </p>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          {t("comingSoonBody")}
        </p>
      </div>
    );
  }

  // Case 3: Authenticated but not purchased
  if (isLoggedIn && !hasPurchased) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "#2D2D4E" }}
        >
          <Lock className="w-6 h-6" style={{ color: "#9CA3AF" }} />
        </div>
        <p className="font-medium mb-2" style={{ color: "#F0E6FF" }}>{t("lockedTitle")}</p>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#9CA3AF" }}>
          {t("purchaseBody")}
        </p>
        <Link
          href={`/${locale}/checkout?product=${productSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium px-6 py-2.5 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff" }}
        >
          <ShoppingCart className="w-4 h-4" />
          {t("purchaseBtn")}
        </Link>
      </div>
    );
  }

  // Case 4: Not logged in
  return (
    <div
      className="rounded-xl border p-8"
      style={{ background: "#1A1A2E", borderColor: "#2D2D4E" }}
    >
      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#2D2D4E" }}
        >
          <Lock className="w-6 h-6" style={{ color: "#9CA3AF" }} />
        </div>
        <div className="text-center sm:text-left">
          <p className="font-medium mb-1" style={{ color: "#F0E6FF" }}>{t("lockedTitle")}</p>
          <p className="text-sm mb-5" style={{ color: "#9CA3AF" }}>
            {t("lockedBodyGuest")}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: "rgba(124,58,237,0.15)",
                color: "#A855F7",
                border: "1px solid rgba(124,58,237,0.4)",
              }}
            >
              <LogIn className="w-4 h-4" />
              {t("signIn")}
            </Link>
            <Link
              href={`/${locale}/unlock`}
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{ color: "#9CA3AF", border: "1px solid #2D2D4E" }}
            >
              <KeyRound className="w-4 h-4" />
              {t("enterDeviceCode")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
