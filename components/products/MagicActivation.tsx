"use client";
// v2
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Zap } from "lucide-react";

interface Props {
  productId: string;
  locale: string;
}

const ACTIVATION_TEXTS: Record<string, {
  title: string;
  desc: string;
  placeholder: string;
  btnActivate: string;
  btnActivating: string;
  btnOpen: string;
  alreadyRegistered: string;
}> = {
  ko: {
    title: "도구 정품 인증",
    desc: "구매 시 제공받은 정품 인증 코드를 입력하여 이 단말기를 등록하세요. 코드 1개당 단 1대의 단말기만 활성화할 수 있으며, 다른 기기에서 새로 등록하면 기존 기기의 권한은 즉시 취소됩니다.",
    placeholder: "인증 코드 입력 (예: MC-XXXX-XXXX)",
    btnActivate: "단말기 등록 및 인증",
    btnActivating: "인증 진행 중...",
    btnOpen: "마술 계산기 웹앱 실행",
    alreadyRegistered: "✓ 이 단말기는 이미 등록되었습니다. 언제든지 마술 계산기를 실행할 수 있습니다.",
  },
  en: {
    title: "Tool Activation",
    desc: "Enter your unique purchase activation code to register this device. Exactly one active device is allowed per code. Registering a new device will revoke access from the previous one.",
    placeholder: "Enter Activation Code (e.g., MC-XXXX-XXXX)",
    btnActivate: "Register & Activate Device",
    btnActivating: "Activating...",
    btnOpen: "Open Magic Calculator Web App",
    alreadyRegistered: "✓ This device is already registered. You can open the Magic Calculator anytime.",
  },
  ja: {
    title: "道具の正規品認証",
    desc: "購入時に提供されたライセンスコードを入力して、この端末を登録してください。コード1つにつき1台の端末のみアクティブにでき、他のデバイスで新しく登録すると、既存の端末の権限は即座にキャンセルされます。",
    placeholder: "認証コードを入力 (例: MC-XXXX-XXXX)",
    btnActivate: "端末を登録して認証",
    btnActivating: "認証中...",
    btnOpen: "マジック電卓ウェブアプリを実行",
    alreadyRegistered: "✓ この端末は既に登録されています。いつでもマジック電卓を実行できます。",
  },
  "zh-CN": {
    title: "工具激活",
    desc: "输入购买时提供的激活码以注册此设备。每个激活码仅允许一台设备处于激活状态，在其他设备上重新注册将立即注销当前设备的权限。",
    placeholder: "输入激活码 (例如: MC-XXXX-XXXX)",
    btnActivate: "注册并激活设备",
    btnActivating: "正在激活...",
    btnOpen: "打开魔术计算器网页应用",
    alreadyRegistered: "✓ 该设备已注册。您可以随时打开魔术计算器。",
  },
  es: {
    title: "Activación de la Herramienta",
    desc: "Introduzca el código de activación de su compra para registrar este dispositivo. Se permite exactamente un dispositivo activo por código. Registrar un nuevo dispositivo revocará el acceso del anterior.",
    placeholder: "Introduzca el código (ej. MC-XXXX-XXXX)",
    btnActivate: "Registrar y Activar Dispositivo",
    btnActivating: "Activando...",
    btnOpen: "Abrir Aplicación Web de Calculadora Mágica",
    alreadyRegistered: "✓ Este dispositivo ya está registrado. Puede abrir la calculadora mágica en cualquier momento.",
  },
  fr: {
    title: "Activation de l'Outil",
    desc: "Entrez votre code d'activation d'achat unique pour enregistrer cet appareil. Un seul appareil actif est autorisé par code. L'enregistrement d'un nouvel appareil révoquera l'accès du précédent.",
    placeholder: "Entrez le code (ex. MC-XXXX-XXXX)",
    btnActivate: "Enregistrer et Activer l'Appareil",
    btnActivating: "Activation en cours...",
    btnOpen: "Ouvrir la calculatrice magique",
    alreadyRegistered: "✓ Cet appareil est déjà enregistré. Vous pouvez ouvrir la calculatrice magique à tout moment.",
  },
  de: {
    title: "Geräte-Aktivierung",
    desc: "Geben Sie Ihren eindeutigen Aktivierungscode ein, um dieses Gerät zu registrieren. Es ist nur ein aktives Gerät pro Code zulässig. Die Registrierung eines neuen Geräts widerruft den Zugriff des vorherigen.",
    placeholder: "Code eingeben (z. B. MC-XXXX-XXXX)",
    btnActivate: "Gerät registrieren und aktivieren",
    btnActivating: "Aktivierung läuft...",
    btnOpen: "Magischen Taschenrechner öffnen",
    alreadyRegistered: "✓ Dieses Gerät ist bereits registriert. Sie können den magischen Taschenrechner jederzeit öffnen.",
  },
};

export default function MagicActivation({ productId, locale }: Props) {
  const router = useRouter();
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("ml_calc_device_token");
      if (storedToken) setDeviceToken(storedToken);
    } catch { /* ignore */ }
  }, []);

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      setActivationError(locale === "ko" ? "코드를 입력해주세요." : "Please enter activation code.");
      return;
    }
    setIsActivating(true);
    setActivationError("");
    try {
      const response = await fetch("/api/magic/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: activationCode, productId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("ml_calc_device_token", data.deviceToken);
        setDeviceToken(data.deviceToken);
        router.refresh();
      } else {
        setActivationError(data.error ?? (locale === "ko" ? "인증 실패" : "Activation failed"));
      }
    } catch {
      setActivationError(locale === "ko" ? "서버와의 통신이 실패했습니다." : "Failed to communicate with server.");
    } finally {
      setIsActivating(false);
    }
  };

  const text = ACTIVATION_TEXTS[locale] ?? ACTIVATION_TEXTS.en;

  return (
    <div className="mb-14">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-[#A855F7]" />
        <h2
          className="text-xl font-semibold text-[#F0E6FF]"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {text.title}
        </h2>
      </div>
      <div className="w-12 h-px bg-[#7C3AED] mb-6" />

      <div className="bg-[#1A1A2E] rounded-xl border border-[#2D2D4E] p-6 max-w-lg">
        <p className="text-[#9CA3AF] text-sm mb-4 leading-relaxed">{text.desc}</p>

        {deviceToken ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{text.alreadyRegistered}</span>
            </div>
            <Link
              href={`/${locale}/calc`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
            >
              <Zap className="w-4 h-4" />
              {text.btnOpen}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder={text.placeholder}
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7C3AED] transition-colors"
                style={{ background: "#13131F", border: "1px solid #2D2D4E", color: "#F0E6FF" }}
              />
              {activationError && (
                <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>
                  {activationError}
                </p>
              )}
            </div>
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 text-white"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
            >
              {isActivating ? text.btnActivating : text.btnActivate}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
