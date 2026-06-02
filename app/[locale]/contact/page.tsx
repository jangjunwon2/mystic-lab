"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle2, ChevronDown } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

type ContactContent = {
  title: string;
  subtitle: string;
  form: {
    name: string;
    email: string;
    type: string;
    typeOptions: { value: string; label: string }[];
    message: string;
    messagePlaceholder: string;
    submit: string;
    sending: string;
    success: string;
    successSub: string;
    error: string;
    required: string;
  };
  faq: { q: string; a: string }[];
  back: string;
  faqTitle: string;
};

const content: Record<string, ContactContent> = {
  en: {
    title: "Contact Us",
    subtitle: "Questions, partnerships, press inquiries — we read every message.",
    back: "Back",
    faqTitle: "Frequently Asked Questions",
    form: {
      name: "Your Name",
      email: "Email Address",
      type: "Topic",
      typeOptions: [
        { value: "general", label: "General Inquiry" },
        { value: "order", label: "Order Support" },
        { value: "custom", label: "Custom Device" },
        { value: "partnership", label: "Partnership / Wholesale" },
        { value: "press", label: "Press / Media" },
      ],
      message: "Message",
      messagePlaceholder: "Tell us what's on your mind...",
      submit: "Send Message",
      sending: "Sending...",
      success: "Message Sent!",
      successSub: "We typically reply within 24–48 hours via email.",
      error: "Something went wrong. Please try again.",
      required: "Please fill in all required fields.",
    },
    faq: [
      {
        q: "How long does shipping take?",
        a: "Standard international shipping takes 7–14 business days. Expedited options are available at checkout. Tracking is provided once your order ships.",
      },
      {
        q: "Do you ship worldwide?",
        a: "Yes — we ship to most countries. If your country is unavailable at checkout, please contact us directly and we'll find a solution.",
      },
      {
        q: "Can I watch the solution video before buying?",
        a: "No — solution videos reveal the secret of each effect and are only accessible after purchase. Demo videos showing the effect (not the method) are available on each product page.",
      },
      {
        q: "How do custom device orders work?",
        a: "Submit a brief via the Custom Order page. Our team will review it and reply within 48 hours with a quote and timeline. Custom builds start from $500 USD.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards, PayPal, and local Korean payment via Toss Payments (KRW). All international prices are in USD.",
      },
    ],
  },
  ko: {
    title: "문의하기",
    subtitle: "질문, 파트너십, 언론 문의 — 모든 메시지를 직접 읽습니다.",
    back: "홈으로",
    faqTitle: "자주 묻는 질문",
    form: {
      name: "이름",
      email: "이메일 주소",
      type: "문의 유형",
      typeOptions: [
        { value: "general", label: "일반 문의" },
        { value: "order", label: "주문 지원" },
        { value: "custom", label: "커스텀 장치" },
        { value: "partnership", label: "파트너십 / 도매" },
        { value: "press", label: "언론 / 미디어" },
      ],
      message: "메시지",
      messagePlaceholder: "궁금한 점이나 하고 싶은 말씀을 적어주세요...",
      submit: "메시지 보내기",
      sending: "전송 중...",
      success: "메시지가 전송되었습니다!",
      successSub: "보통 이메일로 24~48시간 내에 답변드립니다.",
      error: "오류가 발생했습니다. 다시 시도해주세요.",
      required: "필수 항목을 모두 입력해주세요.",
    },
    faq: [
      {
        q: "배송 기간은 얼마나 걸리나요?",
        a: "국내 배송은 2~3 영업일, 해외 배송은 7~14 영업일이 소요됩니다. 빠른 배송 옵션은 결제 시 선택할 수 있습니다.",
      },
      {
        q: "전 세계 배송이 가능한가요?",
        a: "네, 대부분의 국가로 배송됩니다. 결제 시 국가가 표시되지 않으면 직접 문의해 주세요.",
      },
      {
        q: "구매 전 해법 영상을 볼 수 있나요?",
        a: "아니요. 해법 영상은 마술의 비밀을 공개하므로 구매 후에만 접근 가능합니다. 효과만 보여주는 데모 영상은 각 상품 페이지에서 확인하실 수 있습니다.",
      },
      {
        q: "커스텀 장치 주문은 어떻게 하나요?",
        a: "커스텀 의뢰 페이지에서 내용을 제출하시면, 48시간 내에 견적 및 일정을 안내해드립니다. 커스텀 제작은 $500 USD부터 시작합니다.",
      },
      {
        q: "어떤 결제 수단을 사용할 수 있나요?",
        a: "주요 신용카드, PayPal, 토스페이먼츠(KRW)를 지원합니다. 국제 가격은 USD 기준입니다.",
      },
    ],
  },
  ja: {
    title: "お問い合わせ",
    subtitle: "ご質問、パートナーシップ、報道関連のお問い合わせ — すべてのメッセージを直接拝読しています。",
    back: "ホームへ",
    faqTitle: "よくある質問",
    form: {
      name: "お名前",
      email: "メールアドレス",
      type: "お問い合わせ種別",
      typeOptions: [
        { value: "general", label: "一般的なお問い合わせ" },
        { value: "order", label: "注文サポート" },
        { value: "custom", label: "カスタムデバイス" },
        { value: "partnership", label: "パートナーシップ / 卸売り" },
        { value: "press", label: "報道 / メディア" },
      ],
      message: "メッセージ",
      messagePlaceholder: "ご質問やご用件をお書きください...",
      submit: "送信する",
      sending: "送信中...",
      success: "送信完了！",
      successSub: "通常24〜48時間以内にメールでご返信いたします。",
      error: "エラーが発生しました。もう一度お試しください。",
      required: "必須項目をすべて入力してください。",
    },
    faq: [
      {
        q: "配送にはどのくらいかかりますか？",
        a: "国際標準配送で7〜14営業日かかります。速達オプションはご注文時にお選びいただけます。発送後にトラッキング番号をご提供します。",
      },
      {
        q: "世界中に配送できますか？",
        a: "はい、ほとんどの国に配送しています。ご注文時にお国が表示されない場合は、直接お問い合わせください。",
      },
      {
        q: "購入前に解説動画を視聴できますか？",
        a: "いいえ。解説動画はマジックの秘密を明かすものですので、購入後のみアクセスできます。効果のみを見せるデモ動画は各商品ページでご覧いただけます。",
      },
      {
        q: "カスタムデバイスの注文はどうすればいいですか？",
        a: "カスタムオーダーページからご依頼内容をお送りください。48時間以内に見積もりとスケジュールをご案内します。カスタム制作は500ドルからです。",
      },
      {
        q: "どの決済方法が使えますか？",
        a: "主要クレジットカード、PayPal、Toss Payments（KRW）に対応しています。国際価格はUSD表示です。",
      },
    ],
  },
  "zh-CN": {
    title: "联系我们",
    subtitle: "问题、合作、媒体询问——我们亲自阅读每一条消息。",
    back: "返回首页",
    faqTitle: "常见问题",
    form: {
      name: "您的姓名",
      email: "电子邮箱",
      type: "咨询类型",
      typeOptions: [
        { value: "general", label: "一般咨询" },
        { value: "order", label: "订单支持" },
        { value: "custom", label: "定制设备" },
        { value: "partnership", label: "合作 / 批发" },
        { value: "press", label: "媒体 / 新闻" },
      ],
      message: "消息",
      messagePlaceholder: "请告诉我们您的想法...",
      submit: "发送消息",
      sending: "发送中...",
      success: "消息已发送！",
      successSub: "我们通常会在24至48小时内通过电子邮件回复。",
      error: "出错了，请重试。",
      required: "请填写所有必填项。",
    },
    faq: [
      {
        q: "配送需要多长时间？",
        a: "国际标准配送需7至14个工作日。结账时可选择加急配送。发货后将提供物流追踪信息。",
      },
      {
        q: "是否支持全球配送？",
        a: "是的，我们配送至大多数国家。如果结账时找不到您的国家，请直接联系我们。",
      },
      {
        q: "购买前可以观看解说视频吗？",
        a: "不可以。解说视频会揭示每个效果的秘密，只有购买后才能访问。展示效果（非方法）的演示视频可在各产品页面查看。",
      },
      {
        q: "如何下定制设备订单？",
        a: "通过定制订单页面提交您的需求，我们的团队将在48小时内回复报价和时间表。定制制作起价500美元。",
      },
      {
        q: "支持哪些付款方式？",
        a: "支持主要信用卡、PayPal以及韩国本地的Toss Payments（韩元）。国际价格以美元计价。",
      },
    ],
  },
  es: {
    title: "Contáctanos",
    subtitle: "Preguntas, colaboraciones, consultas de prensa — leemos cada mensaje.",
    back: "Volver",
    faqTitle: "Preguntas Frecuentes",
    form: {
      name: "Tu Nombre",
      email: "Correo Electrónico",
      type: "Tema",
      typeOptions: [
        { value: "general", label: "Consulta General" },
        { value: "order", label: "Soporte de Pedido" },
        { value: "custom", label: "Dispositivo Personalizado" },
        { value: "partnership", label: "Colaboración / Mayorista" },
        { value: "press", label: "Prensa / Medios" },
      ],
      message: "Mensaje",
      messagePlaceholder: "Cuéntanos en qué podemos ayudarte...",
      submit: "Enviar Mensaje",
      sending: "Enviando...",
      success: "¡Mensaje Enviado!",
      successSub: "Normalmente respondemos en 24–48 horas por correo electrónico.",
      error: "Algo salió mal. Por favor, inténtalo de nuevo.",
      required: "Por favor completa todos los campos requeridos.",
    },
    faq: [
      {
        q: "¿Cuánto tiempo tarda el envío?",
        a: "El envío internacional estándar tarda 7–14 días hábiles. Opciones exprés disponibles al finalizar la compra.",
      },
      {
        q: "¿Envían a todo el mundo?",
        a: "Sí, enviamos a la mayoría de países. Si tu país no aparece al pagar, contáctanos directamente.",
      },
      {
        q: "¿Puedo ver el video de solución antes de comprar?",
        a: "No — los videos de solución revelan el secreto de cada efecto y solo son accesibles tras la compra. Videos de demostración están disponibles en cada página de producto.",
      },
      {
        q: "¿Cómo funcionan los pedidos de dispositivos personalizados?",
        a: "Envía un brief a través de la página de Pedido Personalizado. Nuestro equipo responderá en 48 horas con un presupuesto. Los dispositivos personalizados empiezan desde $500 USD.",
      },
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos las principales tarjetas de crédito, PayPal y Toss Payments (KRW para usuarios coreanos). Los precios internacionales son en USD.",
      },
    ],
  },
  fr: {
    title: "Nous Contacter",
    subtitle: "Questions, partenariats, demandes presse — nous lisons chaque message.",
    back: "Retour",
    faqTitle: "Questions Fréquentes",
    form: {
      name: "Votre Nom",
      email: "Adresse E-mail",
      type: "Sujet",
      typeOptions: [
        { value: "general", label: "Demande Générale" },
        { value: "order", label: "Support Commande" },
        { value: "custom", label: "Dispositif Personnalisé" },
        { value: "partnership", label: "Partenariat / Gros" },
        { value: "press", label: "Presse / Médias" },
      ],
      message: "Message",
      messagePlaceholder: "Dites-nous ce que vous avez en tête...",
      submit: "Envoyer le Message",
      sending: "Envoi en cours...",
      success: "Message Envoyé !",
      successSub: "Nous répondons généralement sous 24–48 heures par e-mail.",
      error: "Une erreur s'est produite. Veuillez réessayer.",
      required: "Veuillez remplir tous les champs obligatoires.",
    },
    faq: [
      {
        q: "Combien de temps prend la livraison ?",
        a: "La livraison internationale standard prend 7–14 jours ouvrés. Des options express sont disponibles à la commande.",
      },
      {
        q: "Livrez-vous dans le monde entier ?",
        a: "Oui, nous livrons dans la plupart des pays. Si votre pays n'apparaît pas au paiement, contactez-nous directement.",
      },
      {
        q: "Puis-je voir la vidéo de solution avant d'acheter ?",
        a: "Non — les vidéos de solution révèlent le secret de chaque effet et ne sont accessibles qu'après achat. Des vidéos de démonstration sont disponibles sur chaque page produit.",
      },
      {
        q: "Comment fonctionne la commande de dispositif personnalisé ?",
        a: "Soumettez un brief via la page Commande Personnalisée. Notre équipe répondra dans les 48 heures avec un devis. Les créations sur mesure démarrent à 500 USD.",
      },
      {
        q: "Quels modes de paiement acceptez-vous ?",
        a: "Nous acceptons les principales cartes de crédit, PayPal et Toss Payments (KRW). Les prix internationaux sont en USD.",
      },
    ],
  },
  de: {
    title: "Kontakt",
    subtitle: "Fragen, Partnerschaften, Presseanfragen — wir lesen jede Nachricht persönlich.",
    back: "Zurück",
    faqTitle: "Häufig Gestellte Fragen",
    form: {
      name: "Dein Name",
      email: "E-Mail-Adresse",
      type: "Thema",
      typeOptions: [
        { value: "general", label: "Allgemeine Anfrage" },
        { value: "order", label: "Bestellsupport" },
        { value: "custom", label: "Kundenspezifisches Gerät" },
        { value: "partnership", label: "Partnerschaft / Großhandel" },
        { value: "press", label: "Presse / Medien" },
      ],
      message: "Nachricht",
      messagePlaceholder: "Was liegt dir auf dem Herzen...",
      submit: "Nachricht Senden",
      sending: "Wird gesendet...",
      success: "Nachricht Gesendet!",
      successSub: "Wir antworten in der Regel innerhalb von 24–48 Stunden per E-Mail.",
      error: "Etwas ist schief gelaufen. Bitte versuche es erneut.",
      required: "Bitte fülle alle Pflichtfelder aus.",
    },
    faq: [
      {
        q: "Wie lange dauert der Versand?",
        a: "Internationaler Standardversand dauert 7–14 Werktage. Express-Optionen sind beim Checkout verfügbar.",
      },
      {
        q: "Versendet ihr weltweit?",
        a: "Ja, wir versenden in die meisten Länder. Falls dein Land beim Checkout nicht erscheint, kontaktiere uns direkt.",
      },
      {
        q: "Kann ich das Lösungsvideo vor dem Kauf ansehen?",
        a: "Nein — Lösungsvideos enthüllen das Geheimnis jedes Effekts und sind erst nach dem Kauf zugänglich. Demovideos, die den Effekt zeigen, sind auf jeder Produktseite verfügbar.",
      },
      {
        q: "Wie funktionieren Bestellungen für individuelle Geräte?",
        a: "Reiche ein Brief über die Seite Individuelle Bestellung ein. Unser Team antwortet innerhalb von 48 Stunden mit einem Angebot. Individuelle Bauten beginnen ab 500 USD.",
      },
      {
        q: "Welche Zahlungsmethoden akzeptiert ihr?",
        a: "Wir akzeptieren alle gängigen Kreditkarten, PayPal und Toss Payments (KRW). Internationale Preise sind in USD.",
      },
    ],
  },
};

export default function ContactPage({ params }: Props) {
  const [locale, setLocale] = useState("en");
  const [form, setForm] = useState({ name: "", email: "", type: "general", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const page = content[locale] ?? content.en;

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg(page.form.required);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      setStatus(res.ok ? "done" : "error");
      if (!res.ok) setErrorMsg(page.form.error);
    } catch {
      setStatus("error");
      setErrorMsg(page.form.error);
    }
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#2D2D4E] p-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2
              className="text-xl font-bold text-[#F0E6FF] mb-3"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {page.form.success}
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-6">{page.form.successSub}</p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              ← {page.back}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-16 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors mb-8"
        >
          ← {page.back}
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-[#A855F7]" />
            <h1
              className="text-3xl font-bold text-[#F0E6FF]"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {page.title}
            </h1>
          </div>
          <div className="w-20 h-px bg-gradient-to-r from-[#7C3AED] to-transparent mb-3" />
          <p className="text-[#9CA3AF]">{page.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form — takes 3 of 5 columns */}
          <div className="lg:col-span-3">
            <div className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-2xl p-6 sm:p-8">
              {status === "error" && errorMsg && (
                <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                      {page.form.name} *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      required
                      className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                      {page.form.email} *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      required
                      className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                    {page.form.type}
                  </label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={update("type")}
                      className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] focus:outline-none focus:border-[#7C3AED] transition-colors appearance-none cursor-pointer"
                    >
                      {page.form.typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5 uppercase tracking-wide">
                    {page.form.message} *
                  </label>
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    required
                    rows={6}
                    placeholder={page.form.messagePlaceholder}
                    className="w-full bg-[#13131F] border border-[#2D2D4E] rounded-xl px-4 py-3 text-sm text-[#F0E6FF] placeholder-[#4B5563] focus:outline-none focus:border-[#7C3AED] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] text-white font-semibold py-3.5 rounded-xl hover:bg-[#6D28D9] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {status === "loading" ? page.form.sending : page.form.submit}
                </button>
              </form>
            </div>
          </div>

          {/* FAQ — takes 2 of 5 columns */}
          <div className="lg:col-span-2">
            <h2
              className="text-lg font-semibold text-[#F0E6FF] mb-4"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {page.faqTitle}
            </h2>
            <div className="space-y-2">
              {page.faq.map((item, i) => (
                <div
                  key={i}
                  className="border border-[#2D2D4E] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-[#1A1A2E] hover:bg-[#1F1F35] transition-colors"
                  >
                    <span className="text-sm text-[#F0E6FF] font-medium">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 py-3 bg-[#13131F] border-t border-[#2D2D4E]">
                      <p className="text-sm text-[#9CA3AF] leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl">
              <p className="text-xs text-[#6B7280] mb-1 uppercase tracking-wide">Email</p>
              <a
                href="mailto:support@mystic-lab.com"
                className="text-sm text-[#A855F7] hover:text-[#C084FC] transition-colors"
              >
                support@mystic-lab.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
