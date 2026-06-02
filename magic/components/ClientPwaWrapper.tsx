"use client";

import React, { useState, useEffect } from "react";
import { PlusSquare, Share, MoreVertical, Sparkles } from "lucide-react";

interface Props {
  children: React.ReactNode;
  locale: string;
}

// 7개 언어 대응 PWA 가이드 텍스트
const PWA_TEXTS: Record<string, {
  title: string;
  subtitle: string;
  iosTitle: string;
  iosDesc: string;
  androidTitle: string;
  androidDesc: string;
  skipBtn: string;
}> = {
  ko: {
    title: "마술 계산기 웹앱 설치",
    subtitle: "브라우저 주소창을 제거하고 완벽한 진짜 계산기 앱처럼 위장하기 위해 홈 화면에 추가해주세요.",
    iosTitle: "아이폰 (Safari) 설정 방법",
    iosDesc: "하단 네비게이션 바에서 공유 버튼(□에 ↑)을 누르고, 스크롤을 내려 '홈 화면에 추가'를 터치해 주세요.",
    androidTitle: "안드로이드 (Chrome) 설정 방법",
    androidDesc: "우측 상단 더보기 버튼(점 3개)을 누르고, '앱 설치' 또는 '홈 화면에 추가'를 터치해 주세요.",
    skipBtn: "웹 브라우저로 계속 진행 (권장하지 않음)"
  },
  en: {
    title: "Install Magic Calculator Web App",
    subtitle: "Add this web app to your Home Screen to remove the address bar and disguise it as a native calculator.",
    iosTitle: "iPhone (Safari) Instructions",
    iosDesc: "Tap the Share icon (box with up arrow) in the bottom bar, scroll down, and select 'Add to Home Screen'.",
    androidTitle: "Android (Chrome) Instructions",
    androidDesc: "Tap the Menu icon (three dots) in the top right, and select 'Install app' or 'Add to Home screen'.",
    skipBtn: "Continue in Web Browser (Not Recommended)"
  },
  ja: {
    title: "マジック電卓のインストール",
    subtitle: "ブラウザのアドレスバーを非表示にし、本物の電卓アプリに偽装するためにホーム画面に追加してください。",
    iosTitle: "iPhone (Safari) の設定方法",
    iosDesc: "下部バーの共有ボタン(□に↑)をタップし、スクロールして「ホーム画面に追加」を選択します。",
    androidTitle: "Android (Chrome) の設定方法",
    androidDesc: "右上メニューボタン(縦の3点)をタップし、「アプリをインストール」または「ホーム画面に追加」を選択します。",
    skipBtn: "ウェブブラウザのまま進む (推奨しません)"
  },
  "zh-CN": {
    title: "安装魔术计算器网页版",
    subtitle: "添加到主屏幕以隐藏浏览器地址栏，实现计算器App的伪装。",
    iosTitle: "苹果手机 (Safari) 教程",
    iosDesc: "点击 Safari 浏览器底部的分享按钮（带上箭头的方框），向下滑动并选择“添加到主屏幕”。",
    androidTitle: "安卓手机 (Chrome) 教程",
    androidDesc: "点击 Chrome 浏览器右上角的菜单按钮（三个点），选择“安装应用”或“添加到主屏幕”。",
    skipBtn: "直接在网页版中打开 (不推荐)"
  },
  es: {
    title: "Instalar Calculadora Mágica",
    subtitle: "Añada esta aplicación a su pantalla de inicio para ocultar la barra de direcciones y camuflarla por completo.",
    iosTitle: "Instrucciones para iPhone (Safari)",
    iosDesc: "Toque el icono de Compartir (caja con flecha hacia arriba) en la barra inferior y elija 'Añadir a la pantalla de inicio'.",
    androidTitle: "Instrucciones para Android (Chrome)",
    androidDesc: "Toque el icono de tres puntos en la esquina superior derecha y seleccione 'Instalar aplicación' o 'Añadir a la pantalla de inicio'.",
    skipBtn: "Continuar en el Navegador (No Recomendado)"
  },
  fr: {
    title: "Installer la calculatrice",
    subtitle: "Ajoutez cette application Web à votre écran d'accueil pour supprimer la barre d'adresse et la déguiser en calculatrice.",
    iosTitle: "Instructions pour iPhone (Safari)",
    iosDesc: "Appuyez sur l'icône de partage (carré avec flèche vers le haut) en bas, puis sélectionnez 'Sur l'écran d'accueil'.",
    androidTitle: "Instructions pour Android (Chrome)",
    androidDesc: "Appuyez sur le menu (trois points) en haut à droite, puis sélectionnez 'Installer l'application'.",
    skipBtn: "Continuer sur le navigateur (Non Recommandé)"
  },
  de: {
    title: "Magischen Rechner installieren",
    subtitle: "Fügen Sie die Web-App Ihrem Home-Bildschirm hinzu, um die Adressleiste zu verbergen und den Rechner zu tarnen.",
    iosTitle: "Anleitung für iPhone (Safari)",
    iosDesc: "Tippen Sie unten auf das Teilen-Symbol (Box mit Pfeil nach oben), scrollen Sie nach unten und wählen Sie 'Zum Home-Bildschirm'.",
    androidTitle: "Anleitung für Android (Chrome)",
    androidDesc: "Tippen Sie oben rechts auf die drei Punkte und wählen Sie 'App installieren' oder 'Zum Startbildschirm'.",
    skipBtn: "Im Browser fortfahren (Nicht empfohlen)"
  }
};

export default function ClientPwaWrapper({ children, locale }: Props) {
  const [isStandalone, setIsStandalone] = useState(true);
  const [skipPwa, setSkipPwa] = useState(false);
  const [osType, setOsType] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // 1. Standalone 모드 구동 여부 검증
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMedia || isIOSStandalone);
    };

    // 2. OS 플랫폼 확인
    const checkOS = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
        setOsType("ios");
      } else if (ua.includes("android")) {
        setOsType("android");
      }
    };

    checkStandalone();
    checkOS();
  }, []);

  // Standalone 모드거나 건너뛰기를 누른 경우 마술 계산기 렌더링
  if (isStandalone || skipPwa) {
    return <>{children}</>;
  }

  const text = PWA_TEXTS[locale] ?? PWA_TEXTS.en;

  return (
    <div className="fixed inset-0 bg-[#0D0D1A] text-[#F0E6FF] z-50 flex flex-col justify-between p-6 select-text overflow-y-auto font-sans">
      <div className="max-w-md mx-auto w-full space-y-8 pt-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-[#A855F7] animate-pulse" />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-cinzel), serif" }}>
            {text.title}
          </h1>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            {text.subtitle}
          </p>
        </div>

        {/* Instructions Container */}
        <div className="space-y-6">
          {/* iOS Card */}
          {(osType === "ios" || osType === "other") && (
            <div className="rounded-xl border border-[#2D2D4E] bg-[#1A1A2E] p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#A855F7]">
                <Share className="w-4 h-4" />
                <span>{text.iosTitle}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                {text.iosDesc}
              </p>
              <div className="flex items-center gap-1.5 justify-center py-2 px-3 bg-[#13131F] rounded-lg border border-[#2D2D4E] text-xs font-mono text-[#6B7280]">
                <span>Safari 공유</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <PlusSquare className="w-4 h-4 text-white" />
                <span>홈 화면에 추가</span>
              </div>
            </div>
          )}

          {/* Android Card */}
          {(osType === "android" || osType === "other") && (
            <div className="rounded-xl border border-[#2D2D4E] bg-[#1A1A2E] p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#A855F7]">
                <MoreVertical className="w-4 h-4" />
                <span>{text.androidTitle}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                {text.androidDesc}
              </p>
              <div className="flex items-center gap-1.5 justify-center py-2 px-3 bg-[#13131F] rounded-lg border border-[#2D2D4E] text-xs font-mono text-[#6B7280]">
                <span>Chrome 메뉴</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>앱 설치 (또는 홈 추가)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skip Button Footer */}
      <div className="max-w-md mx-auto w-full pt-8 pb-4 text-center">
        <button
          onClick={() => setSkipPwa(true)}
          className="text-xs text-gray-500 hover:text-gray-300 underline decoration-dotted transition-colors"
        >
          {text.skipBtn}
        </button>
      </div>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
