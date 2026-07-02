/* eslint-disable */
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Send, Bookmark, Home, Search, Film, Settings, X, Plus, Trash2, Upload, ChevronLeft, BadgeCheck, Grid3x3, Music, MoreHorizontal, Phone, Video, Camera, Menu, ChevronDown, AtSign, UserPlus, Repeat, User } from "lucide-react";
import {
  type InstaConfig, type InstaPost, type InstaStory, type InstaReel, type InstaThread, type InstaDMMessage, type InstaHighlight, type InstaFeedPost, type LocalizedText, type CalcPrediction,
  loadInstaConfig, saveInstaConfig, fileToScaledDataUrl, formatCount, defaultInstaConfig, pickText, formatPostDate, avatarGradient, loadCalcPrediction, applyPrediction,
} from "./instagram-config";
import AppUnlockForm from "./AppUnlockForm";

const BLOCK_TEXTS: Record<string, {
  blockTitle: string;
  blockBody: string;
  codePlaceholder: string;
  maRegister: string;
  maRegistering: string;
  goToProduct: string;
}> = {
  ko: {
    blockTitle: "인증 필요",
    blockBody: "이 기기는 아직 활성화되지 않았거나 다른 기기에서 재활성화하여 인증이 만료되었습니다. 아래에 인증 코드를 입력하여 다시 활성화해주십시오.",
    codePlaceholder: "인증 코드 입력",
    maRegister: "인증하기",
    maRegistering: "인증 중…",
    goToProduct: "상품 구매 페이지로 이동",
  },
  en: {
    blockTitle: "Authentication Required",
    blockBody: "This device is not activated yet, or its activation has expired because it was reactivated on another device. Please enter your activation code below to reactivate.",
    codePlaceholder: "Enter activation code",
    maRegister: "Activate",
    maRegistering: "Activating...",
    goToProduct: "Go to Product Page",
  },
  ja: {
    blockTitle: "認証が必要です",
    blockBody: "このデバイスはまだ有効化されていないか、別のデバイスで再有効化されたため認証が期限切れです。以下に認証コードを入力して再有効化してください。",
    codePlaceholder: "認証コードを入力",
    maRegister: "認証する",
    maRegistering: "認証中…",
    goToProduct: "商品ページへ移動",
  },
  "zh-CN": {
    blockTitle: "需要身份验证",
    blockBody: "此设备尚未激活，或者由于在其他设备上重新激活导致激活已过期。请在下方输入激活码以重新激活。",
    codePlaceholder: "输入激活码",
    maRegister: "激活",
    maRegistering: "正在激活…",
    goToProduct: "前往商品页面",
  },
  es: {
    blockTitle: "Autenticación Requerida",
    blockBody: "Este dispositivo aún no está activado, o su activación ha expirado porque se reactivó en otro dispositivo. Introduzca su código de activación a continuación para reactivarlo.",
    codePlaceholder: "Introducir código de activación",
    maRegister: "Activar",
    maRegistering: "Activando...",
    goToProduct: "Ir a la página del producto",
  },
  fr: {
    blockTitle: "Authentification Requise",
    blockBody: "Cet appareil n'est pas encore activé, ou son activation a expiré car il a été réactivé sur un autre appareil. Veuillez saisir votre code d'activation ci-dessous pour réactiver.",
    codePlaceholder: "Entrer le code d'activation",
    maRegister: "Activer",
    maRegistering: "Activation...",
    goToProduct: "Aller à la page du produit",
  },
  de: {
    blockTitle: "Authentifizierung Erforderlich",
    blockBody: "Dieses Gerät ist noch nicht aktiviert oder die Aktivierung ist abgelaufen, da es auf einem anderen Gerät reaktiviert wurde. Bitte geben Sie unten Ihren Aktivierungscode ein, um es erneut zu aktivieren.",
    codePlaceholder: "Aktivierungscode eingeben",
    maRegister: "Aktivieren",
    maRegistering: "Aktivierung...",
    goToProduct: "Zur Produktseite",
  }
};

interface Props {
  locale: string;
  productId: string;
}

interface UiStrings {
  posts: string; followers: string; following: string; viewAll: (n: number) => string; edit: string; follow: string; message: string;
  yourStory: string; reels: string; messages: string; active: string; messagePlaceholder: string; share: string; addBanner: string;
  likedBy: (user: string, n: string) => string; youPrefix: string; noPosts: string; noReels: string; noMessages: string;
}

const UI: Record<string, UiStrings> = {
  ko: { posts: "게시물", followers: "팔로워", following: "팔로잉", viewAll: (n) => `댓글 ${n}개 모두 보기`, edit: "프로필 편집", follow: "팔로우", message: "메시지", yourStory: "내 스토리", reels: "릴스", messages: "메시지", active: "활동 중", messagePlaceholder: "메시지 보내기...", share: "프로필 공유", addBanner: "배너 추가", likedBy: (u, n) => `${u}님 외 ${n}명이 좋아합니다`, youPrefix: "나: ", noPosts: "게시물이 없습니다", noReels: "릴스가 없습니다", noMessages: "메시지가 없습니다" },
  en: { posts: "posts", followers: "followers", following: "following", viewAll: (n) => `View all ${n} comments`, edit: "Edit profile", follow: "Follow", message: "Message", yourStory: "Your story", reels: "Reels", messages: "Messages", active: "Active now", messagePlaceholder: "Message...", share: "Share profile", addBanner: "Add banner", likedBy: (u, n) => `Liked by ${u} and ${n} others`, youPrefix: "You: ", noPosts: "No posts yet", noReels: "No reels yet", noMessages: "No messages yet" },
  ja: { posts: "投稿", followers: "フォロワー", following: "フォロー中", viewAll: (n) => `コメント${n}件をすべて見る`, edit: "プロフィールを編集", follow: "フォロー", message: "メッセージ", yourStory: "あなたのストーリー", reels: "リール", messages: "メッセージ", active: "アクティブ", messagePlaceholder: "メッセージ...", share: "プロフィールをシェア", addBanner: "バナーを追加", likedBy: (u, n) => `${u}、他${n}人が「いいね！」しました`, youPrefix: "あなた: ", noPosts: "投稿がありません", noReels: "リールがありません", noMessages: "メッセージがありません" },
  "zh-CN": { posts: "帖子", followers: "粉丝", following: "关注", viewAll: (n) => `查看全部 ${n} 条评论`, edit: "编辑主页", follow: "关注", message: "私信", yourStory: "你的快拍", reels: "Reels", messages: "私信", active: "在线", messagePlaceholder: "发消息...", share: "分享主页", addBanner: "添加横幅", likedBy: (u, n) => `${u} 和其他 ${n} 人都赞了`, youPrefix: "你: ", noPosts: "暂无帖子", noReels: "暂无 Reels", noMessages: "暂无消息" },
  es: { posts: "publicaciones", followers: "seguidores", following: "seguidos", viewAll: (n) => `Ver los ${n} comentarios`, edit: "Editar perfil", follow: "Seguir", message: "Mensaje", yourStory: "Tu historia", reels: "Reels", messages: "Mensajes", active: "Activo(a) ahora", messagePlaceholder: "Mensaje...", share: "Compartir perfil", addBanner: "Añadir banner", likedBy: (u, n) => `Les gusta a ${u} y ${n} personas más`, youPrefix: "Tú: ", noPosts: "Aún no hay publicaciones", noReels: "Aún no hay reels", noMessages: "Aún no hay mensajes" },
  fr: { posts: "publications", followers: "abonnés", following: "abonnements", viewAll: (n) => `Voir les ${n} commentaires`, edit: "Modifier le profil", follow: "Suivre", message: "Message", yourStory: "Votre story", reels: "Reels", messages: "Messages", active: "Actif", messagePlaceholder: "Message...", share: "Partager le profil", addBanner: "Ajouter une bannière", likedBy: (u, n) => `Aimé par ${u} et ${n} autres personnes`, youPrefix: "Vous : ", noPosts: "Aucune publication", noReels: "Aucun reel", noMessages: "Aucun message" },
  de: { posts: "Beiträge", followers: "Follower", following: "Gefolgt", viewAll: (n) => `Alle ${n} Kommentare ansehen`, edit: "Profil bearbeiten", follow: "Folgen", message: "Nachricht", yourStory: "Deine Story", reels: "Reels", messages: "Nachrichten", active: "Aktiv", messagePlaceholder: "Nachricht...", share: "Profil teilen", addBanner: "Banner hinzufügen", likedBy: (u, n) => `Gefällt ${u} und ${n} weiteren Personen`, youPrefix: "Du: ", noPosts: "Noch keine Beiträge", noReels: "Noch keine Reels", noMessages: "Noch keine Nachrichten" },
};

// 비밀 설정창 7개 언어 (사용자=마술사용)
interface SettingsStrings {
  title: string; language: string; profile: string; profilePhoto: string; username: string; displayName: string; bio: string;
  posts: string; followers: string; following: string; verifiedBadge: string; addPost: string; langHint: (loc: string) => string;
  photo: string; caption: string; likes: string; relDate: string; relDatePh: string; exactDate: string; clear: string;
  comments: string; userId: string; content: string; addComment: string; stories: string; addStory: string;
  reels: string; addReel: string; music: string; commentCount: string; dm: string; addThread: string; partnerId: string;
  online: string; messagesLabel: string; me: string; partner: string; addMessage: string; reset: string; goCalc: string; done: string;
  resetConfirm: string; audio: string; highlights: string; addHighlight: string; highlightTitle: string;
  feedPosts: string; addFeedPost: string; feedHint: string;
}
const SETTINGS: Record<string, SettingsStrings> = {
  en: { title: "Instagram Settings", language: "Language", profile: "Profile", profilePhoto: "Profile photo", username: "Username (@)", displayName: "Name", bio: "Bio", posts: "Posts", followers: "Followers", following: "Following", verifiedBadge: "Show verified badge (blue check)", addPost: "Add post", langHint: (l) => `Captions, dates and comments are saved in the current language (${l}). Switch "Language" above to enter content for other languages.`, photo: "Photo", caption: "Caption", likes: "Likes", relDate: "Relative date", relDatePh: "3 weeks ago", exactDate: "Exact post date (overrides relative date)", clear: "Clear", comments: "Comments", userId: "Username", content: "Text", addComment: "+ Add comment", stories: "Stories", addStory: "Add story", reels: "Reels", addReel: "Add reel", music: "Audio/Music", commentCount: "Comments", dm: "DM", addThread: "Add chat", partnerId: "Their username", online: "Active", messagesLabel: "Messages (toggle sender)", me: "Me", partner: "Them", addMessage: "+ Add message", reset: "Reset", goCalc: "Go to calculator", done: "Done", resetConfirm: "Reset to defaults?", audio: "Audio line (e.g. Original audio)", highlights: "Highlights", addHighlight: "Add highlight", highlightTitle: "Title", feedPosts: "Feed posts (other accounts)", addFeedPost: "Add feed post", feedHint: "These appear in the feed as if posted by other accounts (not on your profile grid)." },
  ko: { title: "Instagram 설정", language: "언어", profile: "프로필", profilePhoto: "프로필 사진", username: "사용자명 (@)", displayName: "이름", bio: "소개 (bio)", posts: "게시물", followers: "팔로워", following: "팔로잉", verifiedBadge: "인증 배지(파란 체크) 표시", addPost: "게시물 추가", langHint: (l) => `캡션·날짜·댓글은 현재 언어(${l})로 저장됩니다. 상단 '언어'를 바꿔 다른 언어 내용을 따로 입력하세요.`, photo: "사진", caption: "캡션", likes: "좋아요", relDate: "상대 날짜", relDatePh: "3주 전", exactDate: "정확한 게시일 (설정 시 상대 날짜 대신 표시)", clear: "지우기", comments: "댓글", userId: "아이디", content: "내용", addComment: "+ 댓글 추가", stories: "스토리", addStory: "스토리 추가", reels: "릴스", addReel: "릴스 추가", music: "오디오/음악", commentCount: "댓글 수", dm: "DM", addThread: "대화 추가", partnerId: "상대 아이디", online: "접속중", messagesLabel: "메시지 (보낸이 토글)", me: "나", partner: "상대", addMessage: "+ 메시지 추가", reset: "초기화", goCalc: "계산기로 이동", done: "완료", resetConfirm: "기본 설정으로 초기화할까요?", audio: "음원 라인 (예: Original audio)", highlights: "하이라이트", addHighlight: "하이라이트 추가", highlightTitle: "제목", feedPosts: "피드 게시물 (다른 계정)", addFeedPost: "피드 게시물 추가", feedHint: "피드에 '다른 계정'이 올린 것처럼 노출됩니다(내 프로필 그리드에는 안 보임)." },
  ja: { title: "Instagram 設定", language: "言語", profile: "プロフィール", profilePhoto: "プロフィール写真", username: "ユーザーネーム (@)", displayName: "名前", bio: "自己紹介", posts: "投稿", followers: "フォロワー", following: "フォロー中", verifiedBadge: "認証バッジ(青チェック)を表示", addPost: "投稿を追加", langHint: (l) => `キャプション・日付・コメントは現在の言語(${l})で保存されます。上の「言語」を変えて他言語の内容を入力してください。`, photo: "写真", caption: "キャプション", likes: "いいね", relDate: "相対日付", relDatePh: "3週間前", exactDate: "正確な投稿日(設定時は相対日付の代わりに表示)", clear: "消去", comments: "コメント", userId: "ID", content: "内容", addComment: "+ コメント追加", stories: "ストーリー", addStory: "ストーリー追加", reels: "リール", addReel: "リール追加", music: "オーディオ/音楽", commentCount: "コメント数", dm: "DM", addThread: "チャットを追加", partnerId: "相手のID", online: "アクティブ", messagesLabel: "メッセージ(送信者を切替)", me: "自分", partner: "相手", addMessage: "+ メッセージ追加", reset: "リセット", goCalc: "電卓へ移動", done: "完了", resetConfirm: "初期設定にリセットしますか？", audio: "オーディオ行 (例: Original audio)", highlights: "ハイライト", addHighlight: "ハイライトを追加", highlightTitle: "タイトル", feedPosts: "フィード投稿 (他アカウント)", addFeedPost: "フィード投稿を追加", feedHint: "他のアカウントが投稿したようにフィードに表示されます(プロフィールには出ません)。" },
  "zh-CN": { title: "Instagram 设置", language: "语言", profile: "个人资料", profilePhoto: "头像", username: "用户名 (@)", displayName: "姓名", bio: "简介", posts: "帖子", followers: "粉丝", following: "关注", verifiedBadge: "显示认证徽章(蓝勾)", addPost: "添加帖子", langHint: (l) => `标题、日期和评论将以当前语言(${l})保存。切换上方“语言”以输入其他语言内容。`, photo: "照片", caption: "标题", likes: "点赞", relDate: "相对日期", relDatePh: "3周前", exactDate: "精确发布日期(设置后替代相对日期)", clear: "清除", comments: "评论", userId: "用户名", content: "内容", addComment: "+ 添加评论", stories: "快拍", addStory: "添加快拍", reels: "Reels", addReel: "添加 Reel", music: "音频/音乐", commentCount: "评论数", dm: "私信", addThread: "添加对话", partnerId: "对方用户名", online: "在线", messagesLabel: "消息(切换发送者)", me: "我", partner: "对方", addMessage: "+ 添加消息", reset: "重置", goCalc: "前往计算器", done: "完成", resetConfirm: "恢复默认设置？", audio: "音频行 (例: Original audio)", highlights: "精彩集锦", addHighlight: "添加精彩集锦", highlightTitle: "标题", feedPosts: "动态帖子 (其他账号)", addFeedPost: "添加动态帖子", feedHint: "将作为'其他账号'的帖子显示在动态中(不会出现在你的主页网格)。" },
  es: { title: "Configuración de Instagram", language: "Idioma", profile: "Perfil", profilePhoto: "Foto de perfil", username: "Usuario (@)", displayName: "Nombre", bio: "Biografía", posts: "Publicaciones", followers: "Seguidores", following: "Seguidos", verifiedBadge: "Mostrar insignia verificada (check azul)", addPost: "Añadir publicación", langHint: (l) => `Los pies de foto, fechas y comentarios se guardan en el idioma actual (${l}). Cambia "Idioma" arriba para otros idiomas.`, photo: "Foto", caption: "Pie de foto", likes: "Me gusta", relDate: "Fecha relativa", relDatePh: "hace 3 semanas", exactDate: "Fecha exacta (reemplaza la fecha relativa)", clear: "Borrar", comments: "Comentarios", userId: "Usuario", content: "Texto", addComment: "+ Añadir comentario", stories: "Historias", addStory: "Añadir historia", reels: "Reels", addReel: "Añadir reel", music: "Audio/Música", commentCount: "Comentarios", dm: "DM", addThread: "Añadir chat", partnerId: "Usuario del otro", online: "Activo(a)", messagesLabel: "Mensajes (alternar remitente)", me: "Yo", partner: "Otro", addMessage: "+ Añadir mensaje", reset: "Restablecer", goCalc: "Ir a la calculadora", done: "Hecho", resetConfirm: "¿Restablecer a valores predeterminados?", audio: "Línea de audio (ej. Original audio)", highlights: "Destacadas", addHighlight: "Añadir destacada", highlightTitle: "Título", feedPosts: "Publicaciones del feed (otras cuentas)", addFeedPost: "Añadir publicación al feed", feedHint: "Aparecen en el feed como si las publicaran otras cuentas (no en tu cuadrícula de perfil)." },
  fr: { title: "Paramètres Instagram", language: "Langue", profile: "Profil", profilePhoto: "Photo de profil", username: "Nom d'utilisateur (@)", displayName: "Nom", bio: "Bio", posts: "Publications", followers: "Abonnés", following: "Abonnements", verifiedBadge: "Afficher le badge vérifié (coche bleue)", addPost: "Ajouter une publication", langHint: (l) => `Les légendes, dates et commentaires sont enregistrés dans la langue actuelle (${l}). Changez « Langue » ci-dessus pour d'autres langues.`, photo: "Photo", caption: "Légende", likes: "J'aime", relDate: "Date relative", relDatePh: "il y a 3 semaines", exactDate: "Date exacte (remplace la date relative)", clear: "Effacer", comments: "Commentaires", userId: "Nom d'utilisateur", content: "Texte", addComment: "+ Ajouter un commentaire", stories: "Stories", addStory: "Ajouter une story", reels: "Reels", addReel: "Ajouter un reel", music: "Audio/Musique", commentCount: "Commentaires", dm: "DM", addThread: "Ajouter une conversation", partnerId: "Son nom d'utilisateur", online: "Actif", messagesLabel: "Messages (changer l'expéditeur)", me: "Moi", partner: "Lui/Elle", addMessage: "+ Ajouter un message", reset: "Réinitialiser", goCalc: "Aller à la calculatrice", done: "Terminé", resetConfirm: "Réinitialiser par défaut ?", audio: "Ligne audio (ex. Original audio)", highlights: "À la une", addHighlight: "Ajouter à la une", highlightTitle: "Titre", feedPosts: "Publications du fil (autres comptes)", addFeedPost: "Ajouter une publication", feedHint: "Apparaissent dans le fil comme publiées par d'autres comptes (pas sur votre grille de profil)." },
  de: { title: "Instagram-Einstellungen", language: "Sprache", profile: "Profil", profilePhoto: "Profilbild", username: "Benutzername (@)", displayName: "Name", bio: "Bio", posts: "Beiträge", followers: "Follower", following: "Gefolgt", verifiedBadge: "Verifiziert-Abzeichen (blauer Haken) zeigen", addPost: "Beitrag hinzufügen", langHint: (l) => `Bildunterschriften, Daten und Kommentare werden in der aktuellen Sprache (${l}) gespeichert. Oben "Sprache" wechseln für andere Sprachen.`, photo: "Foto", caption: "Bildunterschrift", likes: "Gefällt mir", relDate: "Relatives Datum", relDatePh: "vor 3 Wochen", exactDate: "Genaues Datum (ersetzt relatives Datum)", clear: "Löschen", comments: "Kommentare", userId: "Benutzername", content: "Text", addComment: "+ Kommentar hinzufügen", stories: "Storys", addStory: "Story hinzufügen", reels: "Reels", addReel: "Reel hinzufügen", music: "Audio/Musik", commentCount: "Kommentare", dm: "DM", addThread: "Chat hinzufügen", partnerId: "Benutzername", online: "Aktiv", messagesLabel: "Nachrichten (Absender wechseln)", me: "Ich", partner: "Andere", addMessage: "+ Nachricht hinzufügen", reset: "Zurücksetzen", goCalc: "Zum Rechner", done: "Fertig", resetConfirm: "Auf Standard zurücksetzen?", audio: "Audiozeile (z. B. Original audio)", highlights: "Highlights", addHighlight: "Highlight hinzufügen", highlightTitle: "Titel", feedPosts: "Feed-Beiträge (andere Konten)", addFeedPost: "Feed-Beitrag hinzufügen", feedHint: "Erscheinen im Feed, als wären sie von anderen Konten gepostet (nicht in deinem Profilraster)." },
};

const AVATAR_FALLBACK = "/images/magic/instagram-post.png";

// 아바타 — 이미지가 있으면 원형 이미지, 없으면 사용자명 기반 이니셜+그라데이션(계정별로 다른 색).
// 부모 컨테이너 크기를 채운다(w-full h-full). fontPx는 이니셜 글자 크기.
function Avatar({ src, name, fontPx }: { src: string; name: string; fontPx: number }) {
  if (src) {
    return <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${src}')` }} />;
  }
  return (
    <div className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold" style={{ background: avatarGradient(name), fontSize: fontPx }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
}

export default function FakeInstagramApp({ locale, productId }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<InstaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [view, setView] = useState<"feed" | "profile" | "reels" | "dm">("feed");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [storyStart, setStoryStart] = useState<number | null>(null);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [prediction, setPrediction] = useState<CalcPrediction | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setConfig(loadInstaConfig(locale));
    setLoading(false);
    setMounted(true);
  }, [locale]);

  // 기기 인증 및 쿠키 복원 처리
  useEffect(() => {
    if (!productId) return;

    // 1. localStorage에서 토큰 찾아 쿠키 유실 시 복원
    let token = localStorage.getItem(`ml_dt_${productId}`);
    if (token) {
      const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `ml_dt_${productId}=${token}; path=/; max-age=2592000; SameSite=Lax${secureSuffix}`;
    }

    // 2. 로컬스토리지 플래그 기반 낙관적(즉시) 인증 처리
    const localActive = localStorage.getItem("ml_app_activated_fake-instagram") === "1";
    if (localActive) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }

    // 3. 백그라운드 라이선스 세션 검증 API 호출
    fetch(`/api/magic/verify-session?slug=fake-instagram`)
      .then((res) => res.json())
      .then((data) => {
        if (data.authorized) {
          setAuthorized(true);
          localStorage.setItem("ml_app_activated_fake-instagram", "1");
          if (data.deviceToken) {
            localStorage.setItem(`ml_dt_${productId}`, data.deviceToken);
          }
        } else {
          setAuthorized(false);
          localStorage.removeItem("ml_app_activated_fake-instagram");
        }
      })
      .catch(() => {
        // 네트워크 오프라인 상태일 때는 로컬스토리지 인증 성공 상태를 유지
      });
  }, [productId]);

  // 계산기 연동 예언값 — 마운트 시 + 앱이 다시 보일 때(계산기에서 막 입력 후 전환) 갱신.
  useEffect(() => {
    const refresh = () => setPrediction(loadCalcPrediction());
    refresh();
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // 기기/브라우저 뒤로가기 → 앱 내부 화면을 한 단계씩 복귀(설치형 PWA에서 뒤로가기가 앱을 나가버리던 문제 해결).
  const navRef = useRef({ settingsOpen, storyStart, openPostId, openThreadId, view });
  useEffect(() => {
    navRef.current = { settingsOpen, storyStart, openPostId, openThreadId, view };
  }, [settingsOpen, storyStart, openPostId, openThreadId, view]);
  const goBack = useCallback(() => {
    const s = navRef.current;
    if (s.settingsOpen) { setSettingsOpen(false); return; }
    if (s.storyStart !== null) { setStoryStart(null); return; }
    if (s.openPostId) { setOpenPostId(null); return; }
    if (s.view === "dm") {
      if (s.openThreadId) { setOpenThreadId(null); return; }
      setView("feed"); return;
    }
    if (s.view === "reels" || s.view === "profile") { setView("feed"); return; }
    // 피드 루트 — 더 돌아갈 곳 없음(네이티브 앱처럼 뒤로가기로 앱이 닫히지 않게 유지)
  }, []);
  useEffect(() => {
    window.history.pushState({ insta: true }, "");
    const onPop = () => {
      goBack();
      window.history.pushState({ insta: true }, ""); // 다음 뒤로가기도 가로채도록 재무장
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [goBack]);

  // iOS 등에서 화면을 당길 때 웹뷰 고무줄(rubber-band)로 뒤 검정이 비치는 현상 차단 —
  // 내부 스크롤러의 overscroll-contain만으론 iOS 스탠드얼론 웹뷰 자체 바운스를 못 막으므로
  // html/body의 스크롤·오버스크롤을 잠그고 배경을 검정으로 고정한다(언마운트 시 원복).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow, htmlOverscroll: html.style.overscrollBehavior, htmlBg: html.style.background,
      bodyOverflow: body.style.overflow, bodyOverscroll: body.style.overscrollBehavior, bodyBg: body.style.background,
    };
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    html.style.background = "#000";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.background = "#000";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      html.style.background = prev.htmlBg;
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      body.style.background = prev.bodyBg;
    };
  }, []);

  if (!mounted || authorized === null || !config) {
    return <div className="w-full h-screen bg-black" />;
  }

  if (authorized === false) {
    const bt = BLOCK_TEXTS[locale] ?? BLOCK_TEXTS.en;
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center p-6 text-center select-text">
        <div className="max-w-md w-full rounded-2xl border border-[#2D2D4E] bg-[#1A1A2E] p-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center mx-auto">
            <span className="text-2xl text-[#EF4444]">⚠</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#F0E6FF]" style={{ fontFamily: "var(--font-cinzel), serif" }}>
              {bt.blockTitle}
            </h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{bt.blockBody}</p>
          </div>
          <AppUnlockForm
            productId={productId}
            locale={locale}
            slug="fake-instagram"
            productUrl={`/${locale}/products/fake-instagram`}
            translations={{
              placeholder: bt.codePlaceholder,
              submit: bt.maRegister,
              checking: bt.maRegistering,
              goToProduct: bt.goToProduct,
            }}
          />
        </div>
      </div>
    );
  }

  const ui = UI[config.appLocale] ?? UI.en;
  const update = (patch: Partial<InstaConfig>) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveInstaConfig(next);
      return next;
    });
  };

  const toggleLike = (post: InstaPost) => {
    setLikes((p) => ({ ...p, [post.id]: !p[post.id] }));
    if (navigator.vibrate) navigator.vibrate(35);
  };
  const likeCount = (post: InstaPost) => post.likes + (likes[post.id] ? 1 : 0);

  return (
    <div
      className="fixed inset-0 w-full bg-black text-white select-none overflow-hidden flex flex-col font-sans"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", overscrollBehavior: "none" }}
    >
      {/* 좌상단 비밀 설정 진입 (3초 홀드) — 뒤로가기 화살표가 있는 화면(게시물 상세·DM·스토리)에서는
          숨겨 헤더 좌상단 뒤로가기 버튼 위를 덮지 않게 한다(탭바와 동일 조건). */}
      {!openPostId && view !== "dm" && storyStart === null && (
        <div
          className="absolute top-0 left-0 w-[22vw] h-[10vh] z-[60]"
          onTouchStart={() => { holdRef.current = setTimeout(() => setSettingsOpen(true), 3000); }}
          onTouchEnd={() => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } }}
          onMouseDown={() => { holdRef.current = setTimeout(() => setSettingsOpen(true), 3000); }}
          onMouseUp={() => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } }}
        />
      )}

      {/* 로딩 스플래시 */}
      <AnimatePresence>
        {loading && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black z-[9999] flex flex-col justify-between items-center py-16">
            <div />
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[22px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]" style={{ transform: "scale(1.05)" }} />
              <div className="absolute inset-[4px] rounded-[18px] bg-black" />
              <div className="absolute w-10 h-10 rounded-full border-[5px] border-white" />
              <div className="absolute top-[22px] right-[22px] w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 tracking-wider">from</span>
              <span className="text-sm font-bold text-white tracking-widest">Meta</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 본문 */}
      {openPostId ? (
        <PostDetail
          post={config.posts.find((p) => p.id === openPostId)!}
          config={config} ui={ui} liked={!!likes[openPostId]} likeCount={likeCount}
          onBack={() => setOpenPostId(null)} onLike={toggleLike} prediction={prediction}
        />
      ) : view === "reels" ? (
        <ReelsView config={config} ui={ui} />
      ) : view === "dm" ? (
        openThreadId ? (
          <DMThreadView
            thread={config.dms.find((d) => d.id === openThreadId)!}
            config={config} ui={ui} onBack={() => setOpenThreadId(null)}
          />
        ) : (
          <DMListView config={config} ui={ui} onBack={() => setView("feed")} onOpenThread={(id) => setOpenThreadId(id)} />
        )
      ) : view === "feed" ? (
        <FeedView
          config={config} ui={ui} likes={likes} likeCount={likeCount} onLike={toggleLike}
          onOpenStory={(i) => setStoryStart(i)} onOpenDM={() => setView("dm")} prediction={prediction}
        />
      ) : (
        <ProfileView config={config} ui={ui} onOpenSettings={() => setSettingsOpen(true)} onOpenPost={(id) => setOpenPostId(id)} />
      )}

      {/* 하단 탭 바 — 게시물 상세·DM·스토리 뷰어에서는 숨김 */}
      {!openPostId && view !== "dm" && storyStart === null && (
        <div className="h-[49px] border-t border-[#262626] bg-black flex items-center justify-around px-2 shrink-0">
          <button onClick={() => setView("feed")} className="text-white">
            <Home className="w-6 h-6" fill={view === "feed" ? "currentColor" : "none"} strokeWidth={view === "feed" ? 0 : 2} />
          </button>
          <button onClick={() => setView("reels")} className="text-white">
            <Film className="w-6 h-6" fill={view === "reels" ? "currentColor" : "none"} strokeWidth={view === "reels" ? 0 : 2} />
          </button>
          <button onClick={() => setView("dm")} className="relative text-white active:opacity-60">
            <Send className="w-6 h-6" strokeWidth={2} />
            {config.dms.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF3040] text-[9px] font-bold flex items-center justify-center">{config.dms.length}</span>
            )}
          </button>
          <button className="text-white"><Search className="w-6 h-6" strokeWidth={2} /></button>
          <button onClick={() => setView("profile")} className="w-7 h-7 rounded-full overflow-hidden" style={{ border: view === "profile" ? "1.5px solid #fff" : "1px solid #555" }}>
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
          </button>
        </div>
      )}

      {/* 스토리 뷰어 (풀스크린 오버레이) */}
      <AnimatePresence>
        {storyStart !== null && (
          <StoryViewer config={config} ui={ui} startIndex={storyStart} onClose={() => setStoryStart(null)} />
        )}
      </AnimatePresence>

      {/* 비밀 설정 패널 */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsPanel config={config} locale={locale} onUpdate={update} onClose={() => setSettingsOpen(false)} onExit={() => router.push(`/${locale}/calc`)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// 피드 노출 순서 — 다른 계정(feedPosts)과 본인 게시물(posts)을 번갈아 섞어 실제 피드처럼 보이게 한다.
// (본인 게시물은 프로필 그리드에도 노출되지만 feedPosts는 피드 전용)
type FeedEntry = { post: InstaPost; author?: { username: string; avatar: string; verified: boolean } };
function buildFeed(config: InstaConfig): FeedEntry[] {
  const out: FeedEntry[] = [];
  const own = config.posts;
  const others = config.feedPosts;
  const maxLen = Math.max(own.length, others.length);
  for (let i = 0; i < maxLen; i++) {
    const o = others[i];
    if (o) out.push({ post: o, author: { username: o.username, avatar: o.avatar, verified: o.verified } });
    if (own[i]) out.push({ post: own[i] });
  }
  return out;
}

// ─── 피드 ───
function FeedView({ config, ui, likes, likeCount, onLike, onOpenStory, onOpenDM, prediction }: {
  config: InstaConfig; ui: UiStrings; likes: Record<string, boolean>; likeCount: (p: InstaPost) => number; onLike: (p: InstaPost) => void;
  onOpenStory: (i: number) => void; onOpenDM: () => void; prediction?: CalcPrediction | null;
}) {
  return (
    <>
      <div className="relative h-12 border-b border-[#262626] bg-black flex items-center justify-between px-4 shrink-0">
        <Plus className="w-7 h-7 text-white" strokeWidth={2.2} />
        <span className="absolute left-1/2 -translate-x-1/2 text-[26px] leading-none text-white" style={{ fontFamily: "'Brush Script MT', 'Snell Roundhand', cursive" }}>Instagram</span>
        <div className="flex items-center gap-5">
          <Heart className="w-6 h-6 text-white" strokeWidth={2} />
          <button onClick={onOpenDM} className="relative active:opacity-60">
            <Send className="w-6 h-6 text-white" strokeWidth={2} />
            {config.dms.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3040] text-[9px] font-bold flex items-center justify-center">{config.dms.length}</span>
            )}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain pb-2">
        <StoriesRing config={config} ui={ui} onOpenStory={onOpenStory} />
        {buildFeed(config).map(({ post, author }) => (
          <PostCard key={post.id} post={post} author={author} config={config} ui={ui} liked={!!likes[post.id]} likeCount={likeCount} onLike={onLike} prediction={prediction} />
        ))}
        {config.posts.length === 0 && config.feedPosts.length === 0 && (
          <div className="py-24 text-center text-gray-500 text-sm">{ui.noPosts}</div>
        )}
      </div>
    </>
  );
}

// ─── 스토리 링 (피드 상단) ───
function StoriesRing({ config, ui, onOpenStory }: { config: InstaConfig; ui: UiStrings; onOpenStory: (i: number) => void }) {
  // index 0 = 내 스토리(본인), 1.. = config.stories
  return (
    <div className="flex gap-3.5 px-3.5 py-3 overflow-x-auto border-b border-[#262626] no-scrollbar">
      <button onClick={() => onOpenStory(0)} className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
        <div className="relative w-16 h-16 rounded-full bg-cover bg-center border border-[#333]" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }}>
          <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0095F6] border-2 border-black flex items-center justify-center"><Plus className="w-3 h-3 text-white" strokeWidth={3} /></span>
        </div>
        <span className="text-[11px] text-gray-200 truncate w-full text-center">{ui.yourStory}</span>
      </button>
      {config.stories.map((s, i) => (
        <button key={s.id} onClick={() => onOpenStory(i + 1)} className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]">
            <div className="w-full h-full rounded-full bg-black p-[2px]">
              <Avatar src={s.avatar} name={s.username} fontPx={22} />
            </div>
          </div>
          <span className="text-[11px] text-gray-200 truncate w-full text-center">{s.username}</span>
        </button>
      ))}
    </div>
  );
}

// ─── 게시물 카드 ───
// author 미지정 = 본인 게시물(프로필 소유자). 지정 시 '다른 계정' 피드 게시물로 표시.
function PostCard({ post, config, ui, liked, likeCount, onLike, author, prediction }: {
  post: InstaPost; config: InstaConfig; ui: typeof UI["en"]; liked: boolean; likeCount: (p: InstaPost) => number; onLike: (p: InstaPost) => void;
  author?: { username: string; avatar: string; verified: boolean }; prediction?: CalcPrediction | null;
}) {
  const authorName = author?.username ?? config.username;
  const authorAvatar = author?.avatar ?? config.avatar;
  const authorVerified = author?.verified ?? config.verified;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584]">
            <div className="w-full h-full rounded-full bg-black p-[1px]">
              <Avatar src={authorAvatar} name={authorName} fontPx={11} />
            </div>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-semibold text-white">{authorName}</span>
              {authorVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
            </div>
            {post.audio && (
              <div className="flex items-center gap-1 mt-0.5">
                <Music className="w-2.5 h-2.5 text-white shrink-0" />
                <span className="text-[11px] text-white/90 truncate max-w-[180px]">{post.audio}</span>
              </div>
            )}
          </div>
        </div>
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 9.75A1.25 1.25 0 1012 12a1.25 1.25 0 000-2.25zm-5.5 0a1.25 1.25 0 100 2.25 1.25 1.25 0 000-2.25zm11 0a1.25 1.25 0 100 2.25 1.25 1.25 0 000-2.25z" /></svg>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.image || AVATAR_FALLBACK} alt="" className="w-full aspect-square object-cover bg-[#121212]" />
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post)} className="active:scale-125 transition-transform">
            <Heart className="w-6.5 h-6.5" style={{ width: 26, height: 26 }} fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "#fff"} strokeWidth={2} />
          </button>
          <MessageCircle style={{ width: 26, height: 26 }} className="text-white" strokeWidth={2} />
          <Send style={{ width: 26, height: 26 }} className="text-white" strokeWidth={2} />
        </div>
        <Bookmark style={{ width: 26, height: 26 }} className="text-white" strokeWidth={2} />
      </div>
      <div className="px-3 pb-1 text-sm text-white">{ui.likedBy(authorName, formatCount(likeCount(post)))}</div>
      <div className="px-3 pb-1 text-[13.5px] leading-relaxed text-gray-100">
        <strong className="text-white mr-1.5">{authorName}</strong>
        <span className="whitespace-pre-line select-text">{applyPrediction(pickText(post.caption, config.appLocale), prediction ?? null)}</span>
      </div>
      {post.comments.length > 0 && (
        <div className="px-3 pb-1 text-xs text-gray-400">{ui.viewAll(post.comments.length + 40)}</div>
      )}
      <div className="px-3 space-y-0.5 text-[13px] text-gray-100">
        {post.comments.slice(0, 2).map((c, i) => (
          <div key={i}><strong className="text-white mr-1.5">{c.user}</strong><span className="select-text">{pickText(c.text, config.appLocale)}</span></div>
        ))}
      </div>
      <div className="px-3 pt-1 text-[10px] text-gray-500 uppercase tracking-wide">{formatPostDate(post, config.appLocale)}</div>
    </div>
  );
}

// ─── 게시물 상세 (단일) ───
function PostDetail({ post, config, ui, liked, likeCount, onBack, onLike, prediction }: {
  post: InstaPost; config: InstaConfig; ui: typeof UI["en"]; liked: boolean; likeCount: (p: InstaPost) => number; onBack: () => void; onLike: (p: InstaPost) => void; prediction?: CalcPrediction | null;
}) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center px-2 shrink-0">
        <button onClick={onBack} className="text-white active:opacity-60 p-1"><ChevronLeft className="w-6 h-6" /></button>
        <span className="font-semibold text-base ml-1">{ui.posts}</span>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <PostCard post={post} config={config} ui={ui} liked={liked} likeCount={likeCount} onLike={onLike} prediction={prediction} />
      </div>
    </>
  );
}

// ─── 프로필 ───
function ProfileView({ config, ui, onOpenSettings, onOpenPost }: { config: InstaConfig; ui: typeof UI["en"]; onOpenSettings: () => void; onOpenPost: (id: string) => void }) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base">{config.username}</span>
          {config.verified && <BadgeCheck className="w-4 h-4 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
          <ChevronDown className="w-4 h-4 text-white ml-0.5" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <AtSign className="w-6 h-6 text-white" strokeWidth={2} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF3040]" />
          </div>
          {/* 햄버거(≡) → 비밀 설정 */}
          <button onClick={onOpenSettings} className="active:opacity-60"><Menu className="w-6 h-6 text-white" strokeWidth={2} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain pb-2">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-6">
            <div className="w-[88px] h-[88px] rounded-full p-[2px] bg-gradient-to-tr from-[#F9C900] via-[#E1306C] to-[#C13584] shrink-0">
              <div className="w-full h-full rounded-full bg-black p-[2px]">
                <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
              </div>
            </div>
            <div className="flex-1 flex justify-around text-center">
              {[[config.postsCount, ui.posts], [config.followers, ui.followers], [config.following, ui.following]].map(([n, label], i) => (
                <div key={i}>
                  <div className="text-base font-semibold text-white">{formatCount(n as number)}</div>
                  <div className="text-xs text-gray-300">{label as string}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white">{config.displayName}</span>
              {config.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
            </div>
            <p className="text-[13px] text-gray-100 whitespace-pre-line leading-snug mt-0.5">{config.bio}</p>
          </div>
          <div className="flex gap-1.5 mt-3">
            <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] text-white">{ui.edit}</button>
            <button className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-[#262626] text-white">{ui.share}</button>
            <button className="px-2.5 py-1.5 rounded-lg bg-[#262626] text-white flex items-center justify-center"><UserPlus className="w-4 h-4" /></button>
          </div>
          {/* 배너 추가 */}
          <button className="flex items-center gap-1.5 mt-3 text-[13px] text-[#8E8E8E]"><Plus className="w-4 h-4" /> {ui.addBanner}</button>
        </div>

        {/* 하이라이트 스토리 (원형 커버 가로 스크롤) */}
        {config.highlights.length > 0 && (
          <div className="flex gap-4 px-4 pt-4 overflow-x-auto no-scrollbar">
            {config.highlights.map((h) => (
              <div key={h.id} className="flex flex-col items-center gap-1 shrink-0 w-[68px]">
                <div className="w-16 h-16 rounded-full border border-[#333] bg-cover bg-center" style={{ backgroundImage: `url('${h.cover || AVATAR_FALLBACK}')` }} />
                <span className="text-[11px] text-gray-200 truncate w-full text-center">{pickText(h.title, config.appLocale)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 탭 바: 그리드(활성) · 릴스 · 리믹스 · 태그됨 */}
        <div className="flex items-center border-t border-[#262626] mt-4">
          <div className="flex-1 py-2.5 flex justify-center text-white border-t border-white -mt-px"><Grid3x3 className="w-6 h-6" /></div>
          <div className="flex-1 py-2.5 flex justify-center text-[#8E8E8E]"><Film className="w-6 h-6" /></div>
          <div className="flex-1 py-2.5 flex justify-center text-[#8E8E8E]"><Repeat className="w-6 h-6" /></div>
          <div className="flex-1 py-2.5 flex justify-center text-[#8E8E8E]"><User className="w-6 h-6" /></div>
        </div>
        <div className="grid grid-cols-3 gap-[2px]">
          {config.posts.map((p) => (
            <button key={p.id} onClick={() => onOpenPost(p.id)} className="aspect-square bg-[#121212] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image || AVATAR_FALLBACK} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── 스토리 뷰어 (풀스크린) ───
function StoryViewer({ config, ui, startIndex, onClose }: {
  config: InstaConfig; ui: UiStrings; startIndex: number; onClose: () => void;
}) {
  const stories = useMemo<InstaStory[]>(() => [
    { id: "me", username: config.username, avatar: config.avatar, image: config.posts[0]?.image || config.avatar || AVATAR_FALLBACK },
    ...config.stories,
  ], [config]);
  const [idx, setIdx] = useState(Math.min(Math.max(0, startIndex), stories.length - 1));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const DURATION = 5000;
    const timer = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / DURATION);
      setProgress(p);
      if (p >= 1) {
        clearInterval(timer);
        if (idx < stories.length - 1) setIdx(idx + 1);
        else onClose();
      }
    }, 50);
    return () => clearInterval(timer);
  }, [idx, stories.length, onClose]);

  const cur = stories[idx];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] bg-black flex flex-col">
      {/* 진행 바 */}
      <div className="flex gap-1 px-2 pt-2">
        {stories.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full bg-white" style={{ width: i < idx ? "100%" : i === idx ? `${progress * 100}%` : "0%" }} />
          </div>
        ))}
      </div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-8 h-8 shrink-0"><Avatar src={cur.avatar} name={cur.username} fontPx={13} /></div>
        <span className="text-sm font-semibold text-white">{idx === 0 ? ui.yourStory : cur.username}</span>
        <button onClick={onClose} className="ml-auto p-1 active:opacity-60"><X className="w-6 h-6 text-white" /></button>
      </div>
      {/* 이미지 + 탭 영역 */}
      <div className="flex-1 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.image || AVATAR_FALLBACK} alt="" className="absolute inset-0 w-full h-full object-contain" />
        <button aria-label="prev" className="absolute left-0 top-0 w-1/3 h-full" onClick={() => (idx > 0 ? setIdx(idx - 1) : onClose())} />
        <button aria-label="next" className="absolute right-0 top-0 w-2/3 h-full" onClick={() => (idx < stories.length - 1 ? setIdx(idx + 1) : onClose())} />
      </div>
      {/* 답장 바 */}
      <div className="px-3 py-3 flex items-center gap-2.5">
        <div className="flex-1 rounded-full border border-white/40 px-4 py-2.5 text-sm text-white/60">{ui.messagePlaceholder}</div>
        <Heart className="w-6 h-6 text-white" />
        <Send className="w-6 h-6 text-white" />
      </div>
    </motion.div>
  );
}

// ─── 릴스 ───
function ReelsView({ config, ui }: { config: InstaConfig; ui: UiStrings }) {
  return (
    <div className="flex-1 relative bg-black overflow-y-auto overscroll-contain snap-y snap-mandatory no-scrollbar">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
        <span className="text-lg font-semibold text-white drop-shadow">{ui.reels}</span>
        <Camera className="w-6 h-6 text-white drop-shadow" />
      </div>
      {config.reels.map((r) => <ReelItem key={r.id} reel={r} config={config} ui={ui} />)}
      {config.reels.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm">{ui.noReels}</div>
      )}
    </div>
  );
}

function ReelItem({ reel, config, ui }: { reel: InstaReel; config: InstaConfig; ui: UiStrings }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="relative h-full w-full snap-start shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={reel.image || AVATAR_FALLBACK} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
      {/* 우측 액션 레일 */}
      <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-5 z-10">
        <button onClick={() => setLiked((v) => !v)} className="flex flex-col items-center gap-1 active:scale-110 transition-transform">
          <Heart className="w-7 h-7" fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "#fff"} strokeWidth={2} />
          <span className="text-[11px] text-white">{formatCount(reel.likes + (liked ? 1 : 0))}</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" strokeWidth={2} />
          <span className="text-[11px] text-white">{formatCount(reel.comments)}</span>
        </div>
        <Send className="w-7 h-7 text-white" strokeWidth={2} />
        <MoreHorizontal className="w-6 h-6 text-white" />
        <div className="w-7 h-7 rounded-md bg-cover bg-center border-2 border-white animate-spin [animation-duration:3s]" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
      </div>
      {/* 하단 정보 */}
      <div className="absolute left-3 right-16 bottom-20 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-cover bg-center border border-white" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
          <span className="text-sm font-semibold text-white">{reel.username}</span>
          {config.verified && <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
          <span className="ml-1 text-xs border border-white/60 rounded px-2 py-0.5 text-white">{ui.follow}</span>
        </div>
        <p className="text-[13px] text-white whitespace-pre-line line-clamp-2 mb-1.5">{pickText(reel.caption, config.appLocale)}</p>
        <div className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-white shrink-0" /><span className="text-xs text-white truncate">{reel.music}</span></div>
      </div>
    </div>
  );
}

// ─── DM 목록 ───
function DMListView({ config, ui, onBack, onOpenThread }: {
  config: InstaConfig; ui: UiStrings; onBack: () => void; onOpenThread: (id: string) => void;
}) {
  return (
    <>
      <div className="h-12 border-b border-[#262626] bg-black flex items-center gap-3 px-3 shrink-0">
        <button onClick={onBack} className="active:opacity-60"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <span className="font-semibold text-base text-white flex items-center gap-1">
          {config.username}
          {config.verified && <BadgeCheck className="w-4 h-4 text-[#3897F0] fill-[#3897F0]" stroke="#000" strokeWidth={1.5} />}
        </span>
        <Plus className="w-6 h-6 text-white ml-auto" />
      </div>
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">{ui.messages}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {config.dms.map((d) => {
          const last = d.messages[d.messages.length - 1];
          return (
            <button key={d.id} onClick={() => onOpenThread(d.id)} className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-[#1A1A1A]">
              <div className="relative w-14 h-14 shrink-0">
                <Avatar src={d.avatar} name={d.username} fontPx={20} />
                {d.online && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#2ECC71] border-2 border-black" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-white truncate">{d.username}</p>
                <p className="text-xs text-gray-400 truncate">{last ? `${last.fromMe ? ui.youPrefix : ""}${last.text}` : ""}</p>
              </div>
              <Camera className="w-6 h-6 text-gray-400 shrink-0" />
            </button>
          );
        })}
        {config.dms.length === 0 && (
          <div className="py-24 text-center text-gray-500 text-sm">{ui.noMessages}</div>
        )}
      </div>
    </>
  );
}

// ─── DM 대화 ───
function DMThreadView({ thread, ui, onBack }: {
  thread: InstaThread; config: InstaConfig; ui: UiStrings; onBack: () => void;
}) {
  const [messages, setMessages] = useState<InstaDMMessage[]>(thread.messages);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { fromMe: true, text }]);
    setDraft("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <>
      <div className="h-14 border-b border-[#262626] bg-black flex items-center gap-3 px-3 shrink-0">
        <button onClick={onBack} className="active:opacity-60"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <div className="w-8 h-8 shrink-0"><Avatar src={thread.avatar} name={thread.username} fontPx={13} /></div>
        <div className="leading-tight min-w-0">
          <p className="text-sm font-semibold text-white truncate">{thread.username}</p>
          {thread.online && <p className="text-[11px] text-gray-400">{ui.active}</p>}
        </div>
        <div className="ml-auto flex items-center gap-4"><Phone className="w-6 h-6 text-white" /><Video className="w-6 h-6 text-white" /></div>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 flex flex-col gap-1.5">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[72%] px-3.5 py-2 rounded-3xl text-sm leading-snug ${m.fromMe ? "self-end bg-[#3797F0] text-white" : "self-start bg-[#262626] text-white"}`}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="px-3 py-2.5 border-t border-[#262626] bg-black flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center rounded-full border border-[#333] px-4 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={ui.messagePlaceholder}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>
        {draft.trim() ? (
          <button onClick={send} className="text-[#3797F0] text-sm font-semibold px-1 shrink-0">{ui.message}</button>
        ) : (
          <Heart className="w-6 h-6 text-white shrink-0" />
        )}
      </div>
    </>
  );
}

// ─── 비밀 설정 패널 ───
function SettingsPanel({ config, locale, onUpdate, onClose, onExit }: {
  config: InstaConfig; locale: string; onUpdate: (patch: Partial<InstaConfig>) => void; onClose: () => void; onExit: () => void;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const postFileRef = useRef<HTMLInputElement>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const reelFileRef = useRef<HTMLInputElement>(null);
  const highlightFileRef = useRef<HTMLInputElement>(null);
  const feedFileRef = useRef<HTMLInputElement>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null);

  const inputCls = "w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]";
  const labelCls = "text-xs text-[#9CA3AF] block mb-1";
  const tx = SETTINGS[config.appLocale] ?? SETTINGS.en;

  const setPosts = (posts: InstaPost[]) => onUpdate({ posts });
  const updatePost = (id: string, patch: Partial<InstaPost>) =>
    setPosts(config.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  // 게시물 텍스트는 현재 설정 언어(appLocale) 슬롯에 입력/표시한다.
  const loc = config.appLocale;
  const setLoc = (m: LocalizedText | undefined, val: string): LocalizedText => ({ ...(m ?? {}), [loc]: val });

  const setStories = (stories: InstaStory[]) => onUpdate({ stories });
  const updateStory = (id: string, patch: Partial<InstaStory>) =>
    setStories(config.stories.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const setReels = (reels: InstaReel[]) => onUpdate({ reels });
  const updateReel = (id: string, patch: Partial<InstaReel>) =>
    setReels(config.reels.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setHighlights = (highlights: InstaHighlight[]) => onUpdate({ highlights });
  const updateHighlight = (id: string, patch: Partial<InstaHighlight>) =>
    setHighlights(config.highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const setFeedPosts = (feedPosts: InstaFeedPost[]) => onUpdate({ feedPosts });
  const updateFeedPost = (id: string, patch: Partial<InstaFeedPost>) =>
    setFeedPosts(config.feedPosts.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const setDms = (dms: InstaThread[]) => onUpdate({ dms });
  const updateThread = (id: string, patch: Partial<InstaThread>) =>
    setDms(config.dms.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    onUpdate({ avatar: await fileToScaledDataUrl(f, 320) });
    e.target.value = "";
  };
  const onPostImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingPostId) return;
    updatePost(editingPostId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const onStoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingStoryId) return;
    updateStory(editingStoryId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const onReelImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingReelId) return;
    updateReel(editingReelId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const onHighlightImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingHighlightId) return;
    updateHighlight(editingHighlightId, { cover: await fileToScaledDataUrl(f, 320) });
    e.target.value = "";
  };
  const onFeedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !editingFeedId) return;
    updateFeedPost(editingFeedId, { image: await fileToScaledDataUrl(f) });
    e.target.value = "";
  };
  const addPost = () => {
    const id = `p${Date.now()}`;
    setPosts([{ id, image: "", caption: {}, likes: 100, date: {}, comments: [] }, ...config.posts]);
    setEditingPostId(id);
  };
  const addStory = () => {
    const id = `s${Date.now()}`;
    setStories([...config.stories, { id, username: "", avatar: "", image: "" }]);
    setEditingStoryId(id);
    storyFileRef.current?.click();
  };
  const addReel = () => {
    const id = `r${Date.now()}`;
    setReels([{ id, image: "", caption: {}, likes: 1000, comments: 50, username: config.username, music: "Original audio" }, ...config.reels]);
    setEditingReelId(id);
  };
  const addHighlight = () => {
    const id = `h${Date.now()}`;
    setHighlights([...config.highlights, { id, title: {}, cover: "" }]);
    setEditingHighlightId(id);
    highlightFileRef.current?.click();
  };
  const addFeedPost = () => {
    const id = `f${Date.now()}`;
    setFeedPosts([{ id, username: "", avatar: "", verified: false, image: "", caption: {}, likes: 500, date: {}, comments: [] }, ...config.feedPosts]);
    setEditingFeedId(id);
  };
  const addThread = () => {
    const id = `d${Date.now()}`;
    setDms([...config.dms, { id, username: "", avatar: "", online: false, messages: [] }]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0D0D1A]/97 z-[100] overflow-y-auto overscroll-contain p-5 select-text">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
      <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={onPostImage} />
      <input ref={storyFileRef} type="file" accept="image/*" className="hidden" onChange={onStoryImage} />
      <input ref={reelFileRef} type="file" accept="image/*" className="hidden" onChange={onReelImage} />
      <input ref={highlightFileRef} type="file" accept="image/*" className="hidden" onChange={onHighlightImage} />
      <input ref={feedFileRef} type="file" accept="image/*" className="hidden" onChange={onFeedImage} />

      <div className="max-w-md mx-auto space-y-5 pb-20 pt-6">
        <div className="flex items-center justify-between border-b border-[#2D2D4E] pb-4">
          <div className="flex items-center gap-2"><Settings className="w-5 h-5 text-[#A855F7]" /><h2 className="text-lg font-bold text-[#F0E6FF]">{tx.title}</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg bg-[#1A1A2E] text-[#9CA3AF] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* 언어 */}
        <div>
          <label className={labelCls}>{tx.language}</label>
          <select value={config.appLocale} onChange={(e) => onUpdate({ appLocale: e.target.value as InstaConfig["appLocale"] })} className={inputCls}>
            <option value="ko">한국어</option><option value="en">English</option><option value="ja">日本語</option>
            <option value="zh-CN">简体中文</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option>
          </select>
        </div>

        {/* 프로필 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#A855F7]">{tx.profile}</h3>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-cover bg-center border border-[#2D2D4E]" style={{ backgroundImage: `url('${config.avatar || AVATAR_FALLBACK}')` }} />
            <button onClick={() => avatarRef.current?.click()} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> {tx.profilePhoto}</button>
          </div>
          <div><label className={labelCls}>{tx.username}</label><input value={config.username} onChange={(e) => onUpdate({ username: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>{tx.displayName}</label><input value={config.displayName} onChange={(e) => onUpdate({ displayName: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>{tx.bio}</label><textarea value={config.bio} onChange={(e) => onUpdate({ bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className={labelCls}>{tx.posts}</label><input type="number" value={config.postsCount} onChange={(e) => onUpdate({ postsCount: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
            <div><label className={labelCls}>{tx.followers}</label><input type="number" value={config.followers} onChange={(e) => onUpdate({ followers: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
            <div><label className={labelCls}>{tx.following}</label><input type="number" value={config.following} onChange={(e) => onUpdate({ following: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input type="checkbox" checked={config.verified} onChange={(e) => onUpdate({ verified: e.target.checked })} className="accent-[#7C3AED]" /> {tx.verifiedBadge}
          </label>
        </div>

        {/* 게시물 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">{tx.posts} ({config.posts.length})</h3>
            <button onClick={addPost} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> {tx.addPost}</button>
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">{tx.langHint(loc.toUpperCase())}</p>
          {config.posts.map((p) => (
            <div key={p.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${p.image || AVATAR_FALLBACK}')` }} />
                <button onClick={() => { setEditingPostId(p.id); postFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> {tx.photo}</button>
                <button onClick={() => setPosts(config.posts.filter((x) => x.id !== p.id))} className="ml-auto p-1.5 rounded" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={p.caption[loc] ?? ""} onChange={(e) => updatePost(p.id, { caption: setLoc(p.caption, e.target.value) })} placeholder={`${tx.caption} (${loc.toUpperCase()})`} rows={2} className={`${inputCls} resize-none`} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>{tx.likes}</label><input type="number" value={p.likes} onChange={(e) => updatePost(p.id, { likes: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
                <div><label className={labelCls}>{tx.relDate} ({loc.toUpperCase()})</label><input value={p.date[loc] ?? ""} onChange={(e) => updatePost(p.id, { date: setLoc(p.date, e.target.value) })} placeholder={tx.relDatePh} className={inputCls} disabled={!!p.exactDate} style={p.exactDate ? { opacity: 0.5 } : undefined} /></div>
              </div>
              <div>
                <label className={labelCls}>{tx.exactDate}</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={p.exactDate ?? ""} onChange={(e) => updatePost(p.id, { exactDate: e.target.value || undefined })} className={inputCls} style={{ flex: 1 }} />
                  {p.exactDate && <button onClick={() => updatePost(p.id, { exactDate: undefined })} className="text-xs px-2 py-2 rounded shrink-0" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>{tx.clear}</button>}
                </div>
              </div>
              <div><label className={labelCls}>{tx.audio}</label><input value={p.audio ?? ""} onChange={(e) => updatePost(p.id, { audio: e.target.value || undefined })} placeholder="Original audio" className={inputCls} /></div>
              {/* 댓글 */}
              <div className="space-y-1.5">
                <label className={labelCls}>{tx.comments} ({loc.toUpperCase()})</label>
                {p.comments.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-1.5">
                    <input value={c.user} onChange={(e) => updatePost(p.id, { comments: p.comments.map((x, j) => j === ci ? { ...x, user: e.target.value } : x) })} placeholder={tx.userId} className={inputCls} style={{ width: "35%" }} />
                    <input value={c.text[loc] ?? ""} onChange={(e) => updatePost(p.id, { comments: p.comments.map((x, j) => j === ci ? { ...x, text: setLoc(x.text, e.target.value) } : x) })} placeholder={tx.content} className={inputCls} style={{ flex: 1 }} />
                    <button onClick={() => updatePost(p.id, { comments: p.comments.filter((_, j) => j !== ci) })} className="p-1 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => updatePost(p.id, { comments: [...p.comments, { user: "", text: {} }] })} className="text-xs" style={{ color: "#A855F7" }}>{tx.addComment}</button>
              </div>
            </div>
          ))}
        </div>

        {/* 피드 게시물 (다른 계정) */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">{tx.feedPosts} ({config.feedPosts.length})</h3>
            <button onClick={addFeedPost} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> {tx.addFeedPost}</button>
          </div>
          <p className="text-[11px] text-[#6B7280] leading-snug">{tx.feedHint}</p>
          {config.feedPosts.map((f) => (
            <div key={f.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${f.image || AVATAR_FALLBACK}')` }} />
                <button onClick={() => { setEditingFeedId(f.id); feedFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> {tx.photo}</button>
                <button onClick={() => setFeedPosts(config.feedPosts.filter((x) => x.id !== f.id))} className="ml-auto p-1.5 rounded" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <input value={f.username} onChange={(e) => updateFeedPost(f.id, { username: e.target.value })} placeholder={tx.userId} className={inputCls} style={{ flex: 1 }} />
                <label className="flex items-center gap-1 text-xs text-white shrink-0 cursor-pointer">
                  <input type="checkbox" checked={f.verified} onChange={(e) => updateFeedPost(f.id, { verified: e.target.checked })} className="accent-[#7C3AED]" /> ✔
                </label>
              </div>
              <textarea value={f.caption[loc] ?? ""} onChange={(e) => updateFeedPost(f.id, { caption: setLoc(f.caption, e.target.value) })} placeholder={`${tx.caption} (${loc.toUpperCase()})`} rows={2} className={`${inputCls} resize-none`} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>{tx.likes}</label><input type="number" value={f.likes} onChange={(e) => updateFeedPost(f.id, { likes: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
                <div><label className={labelCls}>{tx.relDate} ({loc.toUpperCase()})</label><input value={f.date[loc] ?? ""} onChange={(e) => updateFeedPost(f.id, { date: setLoc(f.date, e.target.value) })} placeholder={tx.relDatePh} className={inputCls} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* 스토리 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">{tx.stories} ({config.stories.length})</h3>
            <button onClick={addStory} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> {tx.addStory}</button>
          </div>
          {config.stories.map((s) => (
            <div key={s.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${s.image || AVATAR_FALLBACK}')` }} />
              <button onClick={() => { setEditingStoryId(s.id); storyFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg shrink-0" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> {tx.photo}</button>
              <input value={s.username} onChange={(e) => updateStory(s.id, { username: e.target.value })} placeholder={tx.userId} className={inputCls} style={{ flex: 1 }} />
              <button onClick={() => setStories(config.stories.filter((x) => x.id !== s.id))} className="p-1.5 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* 하이라이트 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">{tx.highlights} ({config.highlights.length})</h3>
            <button onClick={addHighlight} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> {tx.addHighlight}</button>
          </div>
          {config.highlights.map((h) => (
            <div key={h.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${h.cover || AVATAR_FALLBACK}')` }} />
              <button onClick={() => { setEditingHighlightId(h.id); highlightFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg shrink-0" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> {tx.photo}</button>
              <input value={h.title[loc] ?? ""} onChange={(e) => updateHighlight(h.id, { title: setLoc(h.title, e.target.value) })} placeholder={`${tx.highlightTitle} (${loc.toUpperCase()})`} className={inputCls} style={{ flex: 1 }} />
              <button onClick={() => setHighlights(config.highlights.filter((x) => x.id !== h.id))} className="p-1.5 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {/* 릴스 */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">{tx.reels} ({config.reels.length})</h3>
            <button onClick={addReel} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> {tx.addReel}</button>
          </div>
          {config.reels.map((r) => (
            <div key={r.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-cover bg-center border border-[#2D2D4E] shrink-0" style={{ backgroundImage: `url('${r.image || AVATAR_FALLBACK}')` }} />
                <button onClick={() => { setEditingReelId(r.id); reelFileRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Upload className="w-3.5 h-3.5" /> {tx.photo}</button>
                <button onClick={() => setReels(config.reels.filter((x) => x.id !== r.id))} className="ml-auto p-1.5 rounded" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea value={r.caption[loc] ?? ""} onChange={(e) => updateReel(r.id, { caption: setLoc(r.caption, e.target.value) })} placeholder={`${tx.caption} (${loc.toUpperCase()})`} rows={2} className={`${inputCls} resize-none`} />
              <input value={r.music} onChange={(e) => updateReel(r.id, { music: e.target.value })} placeholder={tx.music} className={inputCls} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>{tx.likes}</label><input type="number" value={r.likes} onChange={(e) => updateReel(r.id, { likes: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
                <div><label className={labelCls}>{tx.commentCount}</label><input type="number" value={r.comments} onChange={(e) => updateReel(r.id, { comments: parseInt(e.target.value, 10) || 0 })} className={inputCls} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* DM */}
        <div className="rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#A855F7]">{tx.dm} ({config.dms.length})</h3>
            <button onClick={addThread} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7" }}><Plus className="w-3.5 h-3.5" /> {tx.addThread}</button>
          </div>
          {config.dms.map((d) => (
            <div key={d.id} className="rounded-lg border border-[#2D2D4E] bg-[#13131F] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={d.username} onChange={(e) => updateThread(d.id, { username: e.target.value })} placeholder={tx.partnerId} className={inputCls} style={{ flex: 1 }} />
                <label className="flex items-center gap-1 text-xs text-white shrink-0 cursor-pointer">
                  <input type="checkbox" checked={d.online} onChange={(e) => updateThread(d.id, { online: e.target.checked })} className="accent-[#7C3AED]" /> {tx.online}
                </label>
                <button onClick={() => setDms(config.dms.filter((x) => x.id !== d.id))} className="p-1.5 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>{tx.messagesLabel}</label>
                {d.messages.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateThread(d.id, { messages: d.messages.map((x, j) => j === mi ? { ...x, fromMe: !x.fromMe } : x) })}
                      className="text-xs px-2 py-1.5 rounded shrink-0 w-14"
                      style={{ background: m.fromMe ? "rgba(55,151,240,0.2)" : "rgba(120,120,120,0.2)", color: m.fromMe ? "#3797F0" : "#9CA3AF" }}
                    >{m.fromMe ? tx.me : tx.partner}</button>
                    <input value={m.text} onChange={(e) => updateThread(d.id, { messages: d.messages.map((x, j) => j === mi ? { ...x, text: e.target.value } : x) })} placeholder={tx.content} className={inputCls} style={{ flex: 1 }} />
                    <button onClick={() => updateThread(d.id, { messages: d.messages.filter((_, j) => j !== mi) })} className="p-1 shrink-0" style={{ color: "#EF4444" }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <button onClick={() => updateThread(d.id, { messages: [...d.messages, { fromMe: false, text: "" }] })} className="text-xs" style={{ color: "#A855F7" }}>{tx.addMessage}</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-[#2D2D4E]">
          <button onClick={() => { if (confirm(tx.resetConfirm)) onUpdate(defaultInstaConfig(locale)); }} className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-red-950/20 border border-red-500/30 text-red-400">{tx.reset}</button>
          <button onClick={onExit} className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-[#1A1A2E] border border-[#2D2D4E] text-[#9CA3AF]">{tx.goCalc}</button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white">{tx.done}</button>
        </div>
      </div>
    </motion.div>
  );
}
