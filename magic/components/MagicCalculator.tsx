"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Wifi, Check, AlertTriangle, BookOpen, RefreshCw, X, ChevronRight
} from "lucide-react";

// Google Fonts 동적 로드용 링크 컴포넌트
function GoogleFontsLink() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Shadows+Into+Light&family=Caveat:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

// 7개 언어 대응 설명서
const MANUAL_TEXTS: Record<string, {
  title: string;
  nfcPwa: string;
  nfcPwaDesc: string;
  forceTitle: string;
  forceDesc: string;
  peekingTitle: string;
  peekingDesc: string;
  eraseTitle: string;
  eraseDesc: string;
  bluetoothTitle: string;
  bluetoothDesc: string;
  instagramTitle: string;
  instagramDesc: string;
}> = {
  ko: {
    title: "미스틱 캘큘레이터 마술 사용설명서",
    nfcPwa: "1. NFC 및 홈화면 앱 설치 (PWA)",
    nfcPwaDesc: "• 아이폰은 Safari에서 공유 버튼 클릭 후 '홈 화면에 추가'를 눌러 설치하면 주소창이 숨겨져 실제 계산기처럼 동작합니다.\n• NFC 태그에 'https://mystic-lab.vercel.app/calc' 주소를 심고 관객 폰 대신 마술사 본인의 폰에 태그하여 빠른 연출을 시작할 수 있습니다.",
    forceTitle: "2. 포스 모드 제어 (C 버튼 3초 홀드)",
    forceDesc: "• C (또는 AC) 버튼을 3초간 꾹 누르면 미세한 화면 디밍(반짝임)과 함께 포스 모드가 켜고 꺼집니다.\n• 포스가 활성화되면 '%' 버튼 내부의 작은 구멍 2개 한가운데에 극도로 작은 비밀 검은 점(Dot) 마커가 표시됩니다.\n• 포스 활성 시 '=' 버튼을 누르면 입력된 수식과 관계없이 설정된 숫자나 시간 포스값이 최종 노출됩니다.",
    peekingTitle: "3. 비밀 기록 훔쳐보기 (9번 2초 홀드 후 드래그)",
    peekingDesc: "• 9번 버튼을 2초 이상 꾹 누르면 디밍 피드백과 함께 Peeking 모드가 켜집니다. 손가락을 뗄 때는 숫자 9가 입력되지 않습니다.\n• 이 상태에서 계산기 화면을 오른쪽에서 왼쪽으로 쓸어넘기면(Swipe Left) 화면이 찢어지며 검은 배경에 흰색 글씨로 관객이 입력한 순수 숫자 로그가 나타납니다.\n• 손가락을 놓으면 스프링 모션으로 0.1초 만에 닫힙니다.\n• '=' 버튼을 2초간 누르면 피킹 로그가 완전히 지워집니다.",
    eraseTitle: "4. 앞자리 삭제 마술 (규칙 뒤집기)",
    eraseDesc: "• '+/-' 버튼을 터치하여 켜면 버튼명이 '-/+'로 뒤바뀝니다.\n• 이 상태에서 디스플레이 숫자 창을 왼쪽에서 오른쪽으로 스와이프하면 가장 앞자리(왼쪽) 글자부터 한 글자씩 부드럽게 날아가며 지워지는 초자연적 연출을 보여줍니다.",
    bluetoothTitle: "5. 휴대용 블루투스 프린터 예언 인쇄",
    bluetoothDesc: "• 설정창에서 Bluetooth 기기를 스캔하여 페어링합니다.\n• 계산기 '=' 버튼을 3초간 꾹 누르면, 템플릿에 지정한 필기체 폰트로 텍스트가 흑백 비트맵 이미지로 변환되어 실시간으로 영수증이 출력됩니다.\n• 아이폰(iOS)에서 인쇄 기능을 사용하려면 Web Bluetooth를 지원하는 'Bluefy' 브라우저 앱을 설치하여 구동해야 합니다.",
    instagramTitle: "6. 페이크 인스타그램 예언 이동 (0000 =)",
    instagramDesc: "• 계산기에 '0000 ='을 입력하면 화면 전체가 로딩을 거쳐 페이크 인스타그램 앱 화면으로 이동합니다.\n• 이 화면에서는 3주 전 날짜로 조작되어 있으며, 관객이 입력했던 숫자들이 본문 텍스트 내에 자연스럽게 삽입되어 있습니다."
  },
  en: {
    title: "Mystic Calculator Instruction Guide",
    nfcPwa: "1. NFC & PWA Installation",
    nfcPwaDesc: "• On iOS, open in Safari, tap Share, and select 'Add to Home Screen' to launch as fullscreen without URL bar.\n• Write 'https://mystic-lab.vercel.app/calc' to your NFC tag. Scan it on your own phone to instantly spawn the calculator.",
    forceTitle: "2. Force Control (Hold 'C' for 3s)",
    forceDesc: "• Long press 'C' (or 'AC') for 3s to toggle Force mode (indicated by a subtle screen dimming feedback).\n• When active, a secret 1px Dot marker renders inside the two circles of the '%' icon.\n• Pressing '=' outputs your forced static value or timeoffset value instantly.",
    peekingTitle: "3. Spectator Peeking (Hold '9' for 2s & Swipe)",
    peekingDesc: "• Long press '9' for 2s. Liting the finger won't type '9'. Swipe left to reveal the scrollable white-on-black history log.\n• Letting go snaps the screen back instantly.\n• Long press '=' for 2s to clear the log history.",
    eraseTitle: "4. First Digit Erasure (Hold '+/-')",
    eraseDesc: "• Press '+/-' to toggle. The key changes to '-/+' as an indicator.\n• Swipe left-to-right on the display to fade away numbers starting from the first (leftmost) digit.",
    bluetoothTitle: "5. Bluetooth Receipt Printer Integration",
    bluetoothDesc: "• Scan and pair your BLE printer in settings.\n• Long press '=' for 3s to print. The app renders script text to a canvas bitmap for cursive handwriting print output.\n• On iOS, you MUST run this inside the 'Bluefy' BLE-capable browser app.",
    instagramTitle: "6. Fake Instagram Morph (Type 0000 =)",
    instagramDesc: "• Enter '0000 =' on the keypad to transition to a simulated Instagram profile feed page.\n• Displays a mock post dated '3 weeks ago' embedded with the spectator's inputs dynamically."
  },
  ja: {
    title: "マジック電卓 使用説明書",
    nfcPwa: "1. NFCとホーム画面PWA追加",
    nfcPwaDesc: "• iOSの場合、Safariの共有ボタンから「ホーム画面に追加」をタップすると、アドレスバーのないフルスクリーンで起動します。\n• NFCに「https://mystic-lab.vercel.app/calc」を設定してご自身の携帯でスキャンし、即座に起動できます。",
    forceTitle: "2. フォースの制御 (Cを3秒長押し)",
    forceDesc: "• C(またはAC)ボタンを3秒間長押しすると、画面が微かに暗滅し、フォースのON/OFFが切り替わります。\n• 有効化時、「%」ボタンの中の2つの丸の中心に極小の黒い点が表示されます。\n• フォース有効時に「=」を押すと、設定値が結果として出力されます。",
    peekingTitle: "3. 秘密ののぞき見 (9を2秒長押ししてスワイプ)",
    peekingDesc: "• 9ボタンを2秒以上長押しすると、のぞき見モードがONになり、指を離しても9は入力されません。\n• 電卓画面を右から左へスワイプすると、観客が入力した純粋な数字の履歴が表示されます。\n• 指を離すとスナップバックします。「=」を2秒長押しで履歴がクリアされます。",
    eraseTitle: "4. 左側からの数字消去 (+/-トグル)",
    eraseDesc: "• 「+/-」をタップすると有効化され、表示が「-/+」に変わります。\n• 数字表示部を左から右にスワイプすると、一番左(先頭)の数字から1文字ずつ消えていきます。",
    bluetoothTitle: "5. Bluetoothプリンター連携",
    bluetoothDesc: "• 設定画面からBluetooth機器をスキャンし、ペアリングします。\n• 「=」を3秒長押しすると、手書きフォントに変換されたレシートが印刷されます。\n• iOS(iPhone)では「Bluefy」ブラウザアプリで動かす必要があります。",
    instagramTitle: "6. フェイクインスタグラム移行 (0000 =)",
    instagramDesc: "• キーパッドで「0000 =」と入力すると、自動的に偽のインスタグラムフィードへ移行します。\n• 3週間前に投稿されたような投稿に、入力された数字が自動代入されています。"
  },
  "zh-CN": {
    title: "魔术计算器 使用说明书",
    nfcPwa: "1. NFC及PWA安装",
    nfcPwaDesc: "• 在苹果Safari中点击分享并选择“添加到主屏幕”，即可无地址栏全屏运行。\n• 可将“https://mystic-lab.vercel.app/calc”写入NFC芯片，在魔术师手机上一贴即开。",
    forceTitle: "2. 强迫输出控制 (长按 C 键 3秒)",
    forceDesc: "• 长按“C”(或AC)键3秒，屏幕会闪烁微调亮暗以切换强迫模式。\n• 激活时，“%”按钮的两个圆圈中央将显示一个极其微小的黑点标记。\n• 在该模式下按“=”，将直接输出设定好的目标数字或时间。",
    peekingTitle: "3. 偷看记录 (长按 9 键 2秒并滑动)",
    peekingDesc: "• 长按“9”键2秒，移开手指时不会输入9。向左滑动电卓界面可以拉开后面的白字黑底输入记录板。\n• 松开手指界面即刻回弹。长按“=”键2秒可清除偷看记录。",
    eraseTitle: "4. 抹除头部数字 (+/- 键激活)",
    eraseDesc: "• 按下“+/-”键切换至“-/+”。在显示屏上从左往右滑动，将使数字从最左侧(头部)开始逐个淡出消失。",
    bluetoothTitle: "5. 便携蓝牙打印机连动",
    bluetoothDesc: "• 在设置中扫描并配对您的BLE打印机。\n• 长按“=”键3秒可无线打印手写体字母拼装的预言便条。\n• iOS用户必须在支持蓝牙的“Bluefy”浏览器应用中打开此网页才能使用打印功能。",
    instagramTitle: "6. 模拟Ins预言转换 (输入 0000 =)",
    instagramDesc: "• 键入“0000 =”后，界面将平滑转场至模拟的Ins博主帖。\n• 该贴发布时间显示为“3周前”，帖子正文会自动嵌入观众刚才按下的数字。"
  },
  es: {
    title: "Manual de Uso de la Calculadora Mágica",
    nfcPwa: "1. NFC y Configuración PWA",
    nfcPwaDesc: "• En iOS, comparta en Safari y seleccione 'Añadir a la pantalla de inicio' para ejecutar sin barra de direcciones.\n• Grabe 'https://mystic-lab.vercel.app/calc' en su etiqueta NFC. Escanéela en su teléfono para iniciar la calculadora instantáneamente.",
    forceTitle: "2. Control del Forzaje (Mantener 'C' por 3s)",
    forceDesc: "• Mantenga pulsado 'C' (o 'AC') por 3s para activar/desactivar el forzaje (se confirma con un leve parpadeo de la pantalla).\n• Si está activo, aparece un punto negro diminuto en el centro del símbolo '%'.\n• Presionar '=' arrojará directamente su valor de forzaje asignado.",
    peekingTitle: "3. Peeking / Vistazo Secreto (Mantener '9' por 2s)",
    peekingDesc: "• Mantenga pulsado '9' por 2s. Deslice hacia la izquierda para revelar la lista negra de entradas del espectador. Al soltar, se cierra.\n• Mantenga pulsado '=' por 2s para borrar el historial.",
    eraseTitle: "4. Borrado del Primer Dígito (Tocar '+/-')",
    eraseDesc: "• Pulse '+/-' para activarlo, el botón cambiará a '-/+'. Deslice de izquierda a derecha en la pantalla para borrar los números desde el principio.",
    bluetoothTitle: "5. Impresión Térmica Bluetooth",
    bluetoothDesc: "• Conéctese a su impresora BLE desde ajustes.\n• Mantenga pulsado '=' por 3s para imprimir la profecía en tipografía cursiva.\n• En iOS, debe utilizar el navegador BLE 'Bluefy'.",
    instagramTitle: "6. Forzado de Instagram Fake (Escribir 0000 =)",
    instagramDesc: "• Escriba '0000 =' en el teclado para redirigir a un perfil de Instagram simulado.\n• Muestra una publicación con fecha de 'hace 3 semanas' con los números inyectados dinámicamente."
  },
  fr: {
    title: "Guide de la Calculatrice Magique",
    nfcPwa: "1. NFC & Installation PWA",
    nfcPwaDesc: "• Sur iOS, partagez depuis Safari et sélectionnez 'Sur l'écran d'accueil' pour masquer la barre d'adresse.\n• Écrivez 'https://mystic-lab.vercel.app/calc' sur un tag NFC pour lancer la calculatrice instantanément.",
    forceTitle: "2. Forçage (Maintenir 'C' 3s)",
    forceDesc: "• Maintenez 'C' (ou 'AC') enfoncé pendant 3s pour basculer le mode forçage (signalé par un clignotement discret).\n• Lorsqu'il est actif, un point secret apparaît sur l'icône '%'.\n• Appuyer sur '=' affiche le nombre forcé.",
    peekingTitle: "3. Regard Secret (Maintenir '9' 2s)",
    peekingDesc: "• Maintenez '9' 2s, puis glissez vers la gauche pour lire les entrées secrètes du spectateur. Relâchez pour fermer.\n• Maintenez '=' 2s pour vider l'historique.",
    eraseTitle: "4. Effacement de Gauche (Activer '+/-')",
    eraseDesc: "• Appuyez sur '+/-' pour changer en '-/+'. Glissez de gauche à droite sur l'écran pour effacer à partir du premier chiffre.",
    bluetoothTitle: "5. Impression Thermique Bluetooth",
    bluetoothDesc: "• Associez votre imprimante BLE dans les réglages. Maintenez '=' 3s pour lancer l'impression de la prédiction cursive.\n• Sur iOS, utilisez le navigateur spécialisé 'Bluefy'.",
    instagramTitle: "6. Faux Instagram (Taper 0000 =)",
    instagramDesc: "• Saisissez '0000 =' pour charger le faux profil Instagram et sa publication datée de 'il y a 3 semaines' contenant les variables."
  },
  de: {
    title: "Magischer Rechner Anleitung",
    nfcPwa: "1. NFC & PWA Installation",
    nfcPwaDesc: "• Auf iOS unter Safari 'Zum Home-Bildschirm hinzufügen' wählen, um den Rechner als Vollbild-App zu starten.\n• NFC mit 'https://mystic-lab.vercel.app/calc' beschreiben. Ein Scan am eigenen Handy öffnet die App sofort.",
    forceTitle: "2. Forcierung (Hold 'C' für 3s)",
    forceDesc: "• C (oder AC) für 3s halten, um Forcierung zu toggeln. Bestätigt durch kurzes Dimmen.\n• Aktiviert zeigt einen winzigen Punkt im '%'-Symbol.\n• '=' drücken zeigt das Forcier-Ergebnis.",
    peekingTitle: "3. Spion-Ansicht (Hold '9' für 2s)",
    peekingDesc: "• '9' für 2s halten. Nach links wischen, um den Protokollverlauf der Zuschauer-Eingaben zu sehen. Loslassen schließt.\n• '=' für 2s halten löscht den Verlauf.",
    eraseTitle: "4. Erstes Zeichen löschen (Hold '+/-')",
    eraseDesc: "• Drücken Sie '+/-' (wird zu '-/+'). Wischen Sie auf dem Display von links nach rechts, um Ziffern von vorne zu löschen.",
    bluetoothTitle: "5. Bluetooth Belegdrucker",
    bluetoothDesc: "• Drucker in Einstellungen koppeln. '=' für 3s halten, um den Beleg mit Schreibschrift-Bitmaps zu drucken.\n• Auf iOS ist die Browser-App 'Bluefy' zwingend erforderlich.",
    instagramTitle: "6. Instagram-Verwandlung (Tippe 0000 =)",
    instagramDesc: "• '0000 =' eingeben, um zu einem täuschend echten Instagram-Feed zu wechseln, der einen Beitrag 'vor 3 Wochen' mit den Zahlen anzeigt."
  }
};

interface Props {
  locale: string;
  productId: string;
}

export default function MagicCalculator({ locale, productId }: Props) {
  const router = useRouter();

  // 계산기 상태
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [isCalculated, setIsCalculated] = useState(false);
  const [lastResult, setLastResult] = useState("");
  
  // 마술 트릭 관련 상태
  const [isForceActive, setIsForceActive] = useState(false);
  const [isEraseLeftActive, setIsEraseLeftActive] = useState(false);
  const [peekLogs, setPeekLogs] = useState<string[]>([]);
  const [currentInputNumber, setCurrentInputNumber] = useState("");
  
  // UI 관련 상태
  const [theme, setTheme] = useState<"ios" | "android">("ios");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false); // 햅틱 대체 미세 디밍 피드백
  
  // 드래그 Peeking 상태
  const [isPeekingActive, setIsPeekingActive] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // 블루투스 프린터 상태
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);
  const [printerChar, setPrinterChar] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<string>("");

  // 마술 설정 관리 (로컬스토리지 저장)
  const [config, setConfig] = useState<MagicConfig>({
    forceType: "static",
    staticNumber: "7777",
    timeFormat: "YYYYMMDDHHMM",
    timeOffset: 0,
    forceMode: "one-time",
    osTheme: "auto",
    receiptTemplate: "Predicted:\nDrink sugar: {num1}%\nEspresso: {num2}ml\nTotal price: ${result}\nHave a magic day!",
    receiptFont: "cursive",
    appLocale: locale as any,
  });

  // 버튼 홀딩 상태
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leftTopHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const equalHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const equalHoldFiredRef = useRef(false);
  const isPressingKeyRef = useRef<string | null>(null);

  // OS 자동 감지 및 설정 세팅
  useEffect(() => {
    // 테마 설정
    if (config.osTheme === "auto") {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes("android")) {
        setTheme("android");
      } else {
        setTheme("ios");
      }
    } else {
      setTheme(config.osTheme);
    }
  }, [config.osTheme]);

  // 로컬 스토리지에서 마술 설정 복원
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("ml_calc_config");
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch { /* ignore */ }
  }, []);

  const saveConfig = (newConfig: MagicConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem("ml_calc_config", JSON.stringify(newConfig));
    } catch { /* ignore */ }
  };

  // 마술사 전용 미세 깜빡임 피드백 (0.1초 밝기 조절)
  const triggerDimmingFeedback = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(60); // 햅틱 지원 시 미세 진동
    }
    setIsDimmed(true);
    setTimeout(() => setIsDimmed(false), 120);
  };

  // 피킹 로그 누적 제어
  const appendToPeekLog = (numStr: string) => {
    if (!numStr) return;
    setPeekLogs((prev) => [...prev, numStr]);
  };

  // 수식 계산 처리
  const calculateResult = () => {
    // 0000 = 입력 시 인스타그램 페이지 전환
    if (equation === "0000") {
      triggerDimmingFeedback();
      setTimeout(() => {
        // 피킹 데이터를 인스타그램으로 넘기기 위해 세션 캐시 저장
        try {
          const logData = {
            num1: peekLogs[0] ?? "0",
            num2: peekLogs[1] ?? "0",
            result: isForceActive ? getForceValue() : display,
          };
          localStorage.setItem("ml_calc_instagram_prediction", JSON.stringify(logData));
        } catch { /* ignore */ }
        router.push(`/${config.appLocale}/calc/instagram`);
      }, 500);
      return;
    }

    // 포스 모드 활성화 시 강제 주입
    if (isForceActive) {
      const forcedVal = getForceValue();
      setDisplay(forcedVal);
      setEquation("");
      setIsCalculated(true);
      setLastResult(forcedVal);

      // 1회성 포스 설정 시 즉시 해제
      if (config.forceMode === "one-time") {
        setIsForceActive(false);
      }
      triggerDimmingFeedback();
      return;
    }

    // 일반 연산 수행
    try {
      // × -> *, ÷ -> / 변환
      let expr = equation;
      // 피킹 로그 마지막 누적
      if (currentInputNumber) {
        appendToPeekLog(currentInputNumber);
        setCurrentInputNumber("");
      }

      expr = expr.replace(/×/g, "*").replace(/÷/g, "/");
      // 끝에 남은 연산자/소수점 제거 (예: "5+" → "5") — 일반 계산 ERROR 방지
      expr = expr.replace(/[+\-*/.]+$/, "");
      if (!expr) {
        setEquation("");
        setIsCalculated(true);
        return;
      }

      // 간단한 사칙연산 수식만 평가 (자기 입력 한정)
      // eslint-disable-next-line no-eval
      const res = eval(expr);
      if (typeof res !== "number" || isNaN(res) || !isFinite(res)) {
        setDisplay("Error");
      } else {
        const resStr = String(res);
        setDisplay(resStr);
        setLastResult(resStr);
      }
    } catch {
      setDisplay("Error");
    }
    setEquation("");
    setIsCalculated(true);
  };

  // 포스 계산 결과값 빌드
  const getForceValue = (): string => {
    if (config.forceType === "static") {
      return config.staticNumber;
    }

    // 시간 포스 구현
    const now = new Date();
    // 오프셋 반영 (분 가감)
    if (config.timeOffset) {
      now.setMinutes(now.getMinutes() + config.timeOffset);
    }

    const YYYY = String(now.getFullYear());
    const YY = YYYY.slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const HH = String(now.getHours()).padStart(2, "0");
    const Min = String(now.getMinutes()).padStart(2, "0");

    switch (config.timeFormat) {
      case "YYYYMMDDHHMM":
        return `${YYYY}${MM}${DD}${HH}${Min}`;
      case "MMDDYYYYHHMM":
        return `${MM}${DD}${YYYY}${HH}${Min}`;
      case "DDMMYYYYHHMM":
        return `${DD}${MM}${YYYY}${HH}${Min}`;
      case "YYMMDDHHMM":
        return `${YY}${MM}${DD}${HH}${Min}`;
      case "HHMM":
        return `${HH}${Min}`;
      default:
        return `${YYYY}${MM}${DD}${HH}${Min}`;
    }
  };

  // 키패드 입력 핸들러 (touchend 릴리즈 감지)
  const handleKeyPress = (val: string) => {
    setIsCalculated(false);

    if (val >= "0" && val <= "9") {
      setCurrentInputNumber((prev) => prev + val);
      setDisplay((prev) => (prev === "0" || isCalculated ? val : prev + val));
      setEquation((prev) => (isCalculated ? val : prev + val));
    } else if (val === ".") {
      if (!display.includes(".")) {
        setCurrentInputNumber((prev) => prev + ".");
        setDisplay((prev) => prev + ".");
        setEquation((prev) => prev + ".");
      }
    } else if (["+", "-", "×", "÷"].includes(val)) {
      if (currentInputNumber) {
        appendToPeekLog(currentInputNumber);
        setCurrentInputNumber("");
      }
      setEquation((prev) => {
        const base = prev === "" ? display : prev;
        // 마지막에 눌린 연산자만 인식 — 직전 문자가 연산자면 교체
        if (/[+\-×÷]$/.test(base)) return base.slice(0, -1) + val;
        return base + val;
      });
      setDisplay("0");
    } else if (val === "C" || val === "AC") {
      // 이미 비워진 상태에서 AC: 아무것도 안 함 → 마지막 결과(lastResult) 유지하여 '=' 복원 가능
      if (val === "AC" && display === "0") {
        return;
      }
      setDisplay("0");
      setEquation("");
      setCurrentInputNumber("");
      // 복원된 결과 표시 상태에서 C → 완전 초기화 (마지막 결과까지 삭제, 복원 1회성)
      if (val === "C") {
        setLastResult("");
      }
    } else if (val === "=") {
      calculateResult();
    }
  };

  // AC상태에서 `=` 터치 시 이전 결과값 복원
  const handleEqualsClick = () => {
    if (display === "0" && equation === "" && lastResult !== "") {
      setDisplay(lastResult);
      setEquation(lastResult);
      triggerDimmingFeedback();
    } else {
      calculateResult();
    }
  };

  // 9번 버튼 홀드 (2초) - Peeking 활성화 / 짧게 누르면 숫자 9 입력
  const handle9Start = () => {
    isPressingKeyRef.current = "9";
    holdTimerRef.current = setTimeout(() => {
      // 1초 도달 → Peeking 모드 ON. 홀드가 발동했음을 timer ref=null로 표시
      setIsPeekingActive(true);
      triggerDimmingFeedback();
      holdTimerRef.current = null;
    }, 1000);
  };

  const handle9End = () => {
    // 타이머가 아직 살아있으면(2초 미만) 짧은 탭으로 간주 → 숫자 9 입력
    const wasShortTap = holdTimerRef.current !== null;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isPressingKeyRef.current = null;
    if (wasShortTap) {
      handleKeyPress("9");
    }
  };

  // % 버튼 - 일반 계산기 백분율 동작 (포스 마커는 별도 렌더, 그 외 마술 기능 없음)
  const handlePercent = () => {
    setIsCalculated(false);
    const n = parseFloat(display);
    if (isNaN(n)) return;
    const r = String(n / 100);
    setDisplay(r);
    setEquation(r);
    setCurrentInputNumber("");
  };

  // C 버튼 홀드 (3초) - 포스 모드 온오프
  const handleCStart = () => {
    holdTimerRef.current = setTimeout(() => {
      setIsForceActive((prev) => !prev);
      triggerDimmingFeedback();
      holdTimerRef.current = null;
    }, 3000);
  };

  const handleCEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      handleKeyPress(equation ? "C" : "AC");
    }
  };

  // = 버튼 2초 홀드(로그 청소) 및 3초 홀드(영수증 출력)
  const handleEqualStart = () => {
    equalHoldFiredRef.current = false;
    equalHoldTimerRef.current = setTimeout(() => {
      // 2초 도달 시 로그 클리어 (홀드 동작 발동 표시)
      equalHoldFiredRef.current = true;
      setPeekLogs([]);
      triggerDimmingFeedback();

      // 3초 도달용 2차 타이머 → 영수증 인쇄
      equalHoldTimerRef.current = setTimeout(() => {
        handlePrintReceipt();
      }, 1000);
    }, 2000);
  };

  const handleEqualEnd = () => {
    if (equalHoldTimerRef.current) {
      clearTimeout(equalHoldTimerRef.current);
      equalHoldTimerRef.current = null;
    }
    // 홀드 동작(로그 삭제/인쇄)이 이미 실행됐으면 일반 계산은 건너뜀
    if (equalHoldFiredRef.current) {
      equalHoldFiredRef.current = false;
      return;
    }
    handleEqualsClick();
  };

  // +/- 버튼 클릭 시 -/+ 치환 및 좌측 지우기 트릭 온오프
  const handlePlusMinusClick = () => {
    setIsEraseLeftActive((prev) => !prev);
    triggerDimmingFeedback();
  };

  // 앞자리 삭제 마술 (Impossible Erase) — -/+ 모드에서만, 왼쪽 드래그 시 앞자리부터 제거
  const handleDisplaySwipe = (direction: "left" | "right") => {
    if (!isEraseLeftActive) return; // 평소(+/-)엔 스와이프 삭제 동작 안 함
    if (direction !== "left") return;
    if (display.length > 1) {
      const nextVal = display.substring(1);
      setDisplay(nextVal);
      setEquation(nextVal);
    } else {
      setDisplay("0");
      setEquation("");
    }
  };

  // 드래그 Peeking 터치 제어
  const handleTouchStart = (e: React.TouchEvent) => {
    // 피킹은 9번 2초 홀드 '도중'에 켜지므로 시작 좌표는 항상 기록해 둔다
    (window as any).startX = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPeekingActive) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - ((window as any).startX ?? touch.clientX);
    if (diffX < 0) {
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isPeekingActive) return;
    // 떼는 즉시 스프링 모션으로 0으로 귀환하며 피킹 비활성화
    setDragOffset(0);
    setIsPeekingActive(false);
  };

  // ── Web Bluetooth 감열 프린터 래스터화 인쇄 모듈 ──

  // 감열 프린터 연결
  const handleConnectPrinter = async () => {
    setPrinterStatus("Bluetooth 스캔 중...");
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"], // 일반 BLE SPP 서비스 UUID
      });

      setPrinterStatus(`연결 시도 중: ${device.name}...`);
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
      const char = await service?.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");

      if (char) {
        setPrinterDevice(device);
        setPrinterChar(char);
        setPrinterStatus("✓ 프린터가 성공적으로 연결되었습니다.");
      } else {
        setPrinterStatus("특성(Characteristic)을 찾을 수 없습니다.");
      }
    } catch (e: any) {
      setPrinterStatus(`연결 실패: ${e.message}`);
    }
  };

  // 영수증 비트맵 이미지 생성 및 전송
  const handlePrintReceipt = async () => {
    if (!printerChar) {
      setPrinterStatus("프린터 연결 상태가 아닙니다. 설정에서 연결해주세요.");
      return;
    }

    setIsPrinting(true);
    setPrinterStatus("영수증 이미지 빌드 중...");

    try {
      // 템플릿 변수 치환
      let printText = config.receiptTemplate;
      printText = printText.replace(/{num1}/g, peekLogs[0] ?? "0");
      printText = printText.replace(/{num2}/g, peekLogs[1] ?? "0");
      printText = printText.replace(/{num3}/g, peekLogs[2] ?? "0");
      printText = printText.replace(/{result}/g, display);

      // 가상 Canvas에 그리기 (폭 384px 고정)
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      const ctx = canvas.getContext("2d")!;
      
      // 폰트 설정
      let fontName = "Arial";
      if (config.receiptFont === "cursive") fontName = "'Nanum Pen Script', 'Caveat', cursive";
      else if (config.receiptFont === "myeongjo") fontName = "serif";
      
      ctx.font = `24px ${fontName}`;
      
      // 줄바꿈 계산
      const lines = printText.split("\n");
      const canvasHeight = lines.length * 32 + 40;
      canvas.height = canvasHeight;

      // 흰색 배경
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 384, canvasHeight);

      // 검은색 텍스트
      ctx.fillStyle = "#000000";
      lines.forEach((line, i) => {
        ctx.fillText(line, 10, 30 + i * 32);
      });

      // Canvas 이미지 데이터를 ESC/POS 모노크롬 이진 데이터로 변환 (384 / 8 = 48바이트 폭)
      const imgData = ctx.getImageData(0, 0, 384, canvasHeight);
      const data = imgData.data;
      const binaryData = new Uint8Array(48 * canvasHeight);

      for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < 384; x++) {
          const idx = (y * 384 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // 알파값이 낮으면 흰색(0), 루미넌스가 높으면 흰색(0) 처리
          const isBlack = a > 128 && (0.299 * r + 0.587 * g + 0.114 * b) < 128;

          if (isBlack) {
            const byteIdx = y * 48 + Math.floor(x / 8);
            const bitShift = 7 - (x % 8);
            binaryData[byteIdx] |= (1 << bitShift);
          }
        }
      }

      // ESC/POS 패킷 조립
      // Initialize: 0x1B, 0x40 (ESC @)
      // Line spacing 0: 0x1B, 0x33, 0x00
      // Print Bitmap: 0x1D, 0x76, 0x30, 0x00 (GS v 0 m)
      // xL = 48 (0x30), xH = 0 (0x00)
      // yL = H % 256, yH = Math.floor(H / 256)
      const xL = 48;
      const xH = 0;
      const yL = canvasHeight % 256;
      const yH = Math.floor(canvasHeight / 256);

      const header = new Uint8Array([
        0x1B, 0x40,
        0x1B, 0x33, 0x00,
        0x1D, 0x76, 0x30, 0x00,
        xL, xH,
        yL, yH
      ]);

      const footer = new Uint8Array([
        0x1B, 0x64, 0x04, // Feed 4 lines
        0x1D, 0x56, 0x42, 0x00 // Cut paper
      ]);

      // 조립된 총 페이로드 송신
      const payload = new Uint8Array(header.length + binaryData.length + footer.length);
      payload.set(header, 0);
      payload.set(binaryData, header.length);
      payload.set(footer, header.length + binaryData.length);

      // BLE MTU 제한(주로 180~512바이트)을 피해 청크(180바이트)단위 순차 전송
      const chunkSize = 180;
      for (let offset = 0; offset < payload.length; offset += chunkSize) {
        const chunk = payload.slice(offset, offset + chunkSize);
        await printerChar.writeValueWithResponse(chunk);
      }

      setPrinterStatus("✓ 영수증 출력이 완료되었습니다.");
    } catch (e: any) {
      setPrinterStatus(`인쇄 실패: ${e.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // 다국어 매뉴얼 리소스 가져오기
  const manual = MANUAL_TEXTS[locale] ?? MANUAL_TEXTS.en;

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end w-full select-none overflow-hidden"
      style={{
        background: "#000000",
        overscrollBehavior: "none",
        touchAction: "none", // 9번 피킹 스와이프 외 화면 스크롤/이동 방지
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <GoogleFontsLink />

      {/* ── 백그라운드 Peeking 뷰 (관객의 순수 숫자 히스토리) ── */}
      <div className="absolute inset-0 flex justify-end w-full h-full bg-[#000000] z-0">
        <div className="w-full h-full px-6 pt-6 flex flex-col justify-start">
          <div className="flex-1 overflow-y-auto space-y-3 select-text text-right">
            {peekLogs.map((log, index) => (
              <div key={index} className="text-3xl font-bold text-white font-mono whitespace-nowrap leading-tight">
                {log}
              </div>
            ))}
            {currentInputNumber && (
              <div className="text-3xl font-bold text-white/50 font-mono whitespace-nowrap leading-tight italic">
                {currentInputNumber}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 전면 계산기 인터페이스 컨테이너 ── */}
      <motion.div
        className="absolute inset-0 w-full h-full z-10 flex flex-col justify-end bg-black shadow-2xl"
        style={{
          background: theme === "android" ? "#13131F" : "#000000",
          x: dragOffset, // Peeking 활성화 시 가로 스와이프로 밀려남
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
      >
        {/* Invisible 1/12 진입 영역 (3초 터치 시 세팅창) */}
        <div
          className="absolute top-0 left-0 w-[25vw] h-[15vh] z-50 cursor-pointer"
          onTouchStart={() => {
            leftTopHoldTimerRef.current = setTimeout(() => {
              setIsSettingsOpen(true);
              triggerDimmingFeedback();
            }, 3000);
          }}
          onTouchEnd={() => {
            if (leftTopHoldTimerRef.current) {
              clearTimeout(leftTopHoldTimerRef.current);
              leftTopHoldTimerRef.current = null;
            }
          }}
        />

        {/* ── 계산기 디스플레이 영역 ── */}
        <div
          className={`flex flex-col items-end justify-end px-8 pb-4 transition-opacity duration-150 ${
            isDimmed ? "opacity-30" : "opacity-100"
          }`}
          style={{ height: "35vh" }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (window as any).displayStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const startX = (window as any).displayStartX;
            if (startX !== undefined) {
              const diffX = touch.clientX - startX;
              if (Math.abs(diffX) > 40) {
                handleDisplaySwipe(diffX > 0 ? "right" : "left");
              }
            }
          }}
        >
          <div
            className="w-full text-right font-light text-white select-none transition-all whitespace-nowrap overflow-hidden"
            style={{
              fontFamily: theme === "android" ? "Roboto, sans-serif" : "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: `${Math.max(2, 5.5 - (display.length > 6 ? (display.length - 6) * 0.5 : 0))}rem`,
              lineHeight: "1.2",
            }}
          >
            {display}
          </div>
        </div>

        {/* ── 계산기 키패드 키보드 영역 ── */}
        <div className="grid grid-cols-4 gap-3.5 px-5 pb-8" style={{ height: "60vh" }}>
          {theme === "ios" ? (
            // ── iOS 계산기 디자인 키패드 ──
            <>
              {/* Row 1 */}
              <button
                onTouchStart={handleCStart}
                onTouchEnd={handleCEnd}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#A5A5A5] text-black active:bg-[#D9D9D9] transition-colors"
              >
                {equation ? "C" : "AC"}
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "+/-")}
                onTouchEnd={() => isPressingKeyRef.current === "+/-" && handlePlusMinusClick()}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium transition-colors bg-[#A5A5A5] text-black active:bg-[#D9D9D9]"
              >
                {isEraseLeftActive ? "-/+" : "+/-"}
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "%")}
                onTouchEnd={() => isPressingKeyRef.current === "%" && handlePercent()}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#A5A5A5] text-black active:bg-[#D9D9D9] transition-colors"
              >
                %
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "÷")}
                onTouchEnd={() => isPressingKeyRef.current === "÷" && handleKeyPress("÷")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#FF9F0A] text-white active:bg-[#CC7F08] transition-colors"
              >
                ÷
              </button>

              {/* Row 2 */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "7")}
                onTouchEnd={() => isPressingKeyRef.current === "7" && handleKeyPress("7")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                7
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "8")}
                onTouchEnd={() => isPressingKeyRef.current === "8" && handleKeyPress("8")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                8
              </button>
              <button
                onTouchStart={handle9Start}
                onTouchEnd={handle9End}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                9
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "×")}
                onTouchEnd={() => isPressingKeyRef.current === "×" && handleKeyPress("×")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#FF9F0A] text-white active:bg-[#CC7F08] transition-colors"
              >
                ×
              </button>

              {/* Row 3 */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "4")}
                onTouchEnd={() => isPressingKeyRef.current === "4" && handleKeyPress("4")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                4
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "5")}
                onTouchEnd={() => isPressingKeyRef.current === "5" && handleKeyPress("5")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                5
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "6")}
                onTouchEnd={() => isPressingKeyRef.current === "6" && handleKeyPress("6")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                6
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "-")}
                onTouchEnd={() => isPressingKeyRef.current === "-" && handleKeyPress("-")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#FF9F0A] text-white active:bg-[#CC7F08] transition-colors"
              >
                -
              </button>

              {/* Row 4 */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "1")}
                onTouchEnd={() => isPressingKeyRef.current === "1" && handleKeyPress("1")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                1
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "2")}
                onTouchEnd={() => isPressingKeyRef.current === "2" && handleKeyPress("2")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                2
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "3")}
                onTouchEnd={() => isPressingKeyRef.current === "3" && handleKeyPress("3")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                3
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "+")}
                onTouchEnd={() => isPressingKeyRef.current === "+" && handleKeyPress("+")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#FF9F0A] text-white active:bg-[#CC7F08] transition-colors"
              >
                +
              </button>

              {/* Row 5 */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "0")}
                onTouchEnd={() => isPressingKeyRef.current === "0" && handleKeyPress("0")}
                className="col-span-2 rounded-full flex items-center justify-start pl-8 text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
                style={{ height: "100%", width: "100%" }}
              >
                0
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = ".")}
                onTouchEnd={() => isPressingKeyRef.current === "." && handleKeyPress(".")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#333333] text-white active:bg-[#555555] transition-colors"
              >
                {/* 포스 모드 ON이면 점이 가운데(·)로 올라와 동작 표시, 평소엔 일반 소수점(.) */}
                {isForceActive ? "·" : "."}
              </button>
              <button
                onTouchStart={handleEqualStart}
                onTouchEnd={handleEqualEnd}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#FF9F0A] text-white active:bg-[#CC7F08] transition-colors"
              >
                =
              </button>
            </>
          ) : (
            // ── Android 계산기 디자인 키패드 (Material 둥근 사각형) ──
            <>
              <button
                onTouchStart={handleCStart}
                onTouchEnd={handleCEnd}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl font-semibold bg-[#2D2D4E] text-[#A855F7] active:bg-[#3D3D6E] transition-colors"
              >
                {equation ? "C" : "AC"}
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "+/-")}
                onTouchEnd={() => isPressingKeyRef.current === "+/-" && handlePlusMinusClick()}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl font-semibold transition-colors bg-[#2D2D4E] text-[#A855F7] active:bg-[#3D3D6E]"
              >
                {isEraseLeftActive ? "-/+" : "+/-"}
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "%")}
                onTouchEnd={() => isPressingKeyRef.current === "%" && handlePercent()}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl font-semibold bg-[#2D2D4E] text-[#A855F7] active:bg-[#3D3D6E] transition-colors"
              >
                %
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "÷")}
                onTouchEnd={() => isPressingKeyRef.current === "÷" && handleKeyPress("÷")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl font-semibold bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 active:bg-[#7C3AED]/40 transition-colors"
              >
                ÷
              </button>

              <button
                onTouchStart={() => (isPressingKeyRef.current = "7")}
                onTouchEnd={() => isPressingKeyRef.current === "7" && handleKeyPress("7")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                7
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "8")}
                onTouchEnd={() => isPressingKeyRef.current === "8" && handleKeyPress("8")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                8
              </button>
              <button
                onTouchStart={handle9Start}
                onTouchEnd={handle9End}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                9
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "×")}
                onTouchEnd={() => isPressingKeyRef.current === "×" && handleKeyPress("×")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 active:bg-[#7C3AED]/40 transition-colors"
              >
                ×
              </button>

              <button
                onTouchStart={() => (isPressingKeyRef.current = "4")}
                onTouchEnd={() => isPressingKeyRef.current === "4" && handleKeyPress("4")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                4
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "5")}
                onTouchEnd={() => isPressingKeyRef.current === "5" && handleKeyPress("5")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                5
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "6")}
                onTouchEnd={() => isPressingKeyRef.current === "6" && handleKeyPress("6")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                6
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "-")}
                onTouchEnd={() => isPressingKeyRef.current === "-" && handleKeyPress("-")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 active:bg-[#7C3AED]/40 transition-colors"
              >
                -
              </button>

              <button
                onTouchStart={() => (isPressingKeyRef.current = "1")}
                onTouchEnd={() => isPressingKeyRef.current === "1" && handleKeyPress("1")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                1
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "2")}
                onTouchEnd={() => isPressingKeyRef.current === "2" && handleKeyPress("2")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                2
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "3")}
                onTouchEnd={() => isPressingKeyRef.current === "3" && handleKeyPress("3")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                3
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "+")}
                onTouchEnd={() => isPressingKeyRef.current === "+" && handleKeyPress("+")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/40 active:bg-[#7C3AED]/40 transition-colors"
              >
                +
              </button>

              <button
                onTouchStart={() => (isPressingKeyRef.current = "0")}
                onTouchEnd={() => isPressingKeyRef.current === "0" && handleKeyPress("0")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                0
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = ".")}
                onTouchEnd={() => isPressingKeyRef.current === "." && handleKeyPress(".")}
                className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl bg-[#1A1A2E] text-white active:bg-[#2D2D4E] border border-[#2D2D4E] transition-colors"
              >
                {/* 포스 모드 ON이면 점이 가운데(·)로 올라와 동작 표시, 평소엔 일반 소수점(.) */}
                {isForceActive ? "·" : "."}
              </button>
              <button
                onTouchStart={handleEqualStart}
                onTouchEnd={handleEqualEnd}
                className="col-span-2 rounded-2xl flex items-center justify-center text-2xl font-bold bg-[#7C3AED] text-white active:bg-[#5B21B6] transition-colors"
                style={{ height: "100%", width: "100%" }}
              >
                =
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── 마술 설정 패널 (Secret Settings Modal) ── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0D0D1A]/95 z-50 p-6 overflow-y-auto flex flex-col justify-start select-text"
          >
            <div className="max-w-md mx-auto w-full space-y-6 pb-20 pt-8">
              <div className="flex items-center justify-between border-b border-[#2D2D4E] pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#A855F7]" />
                  <h2 className="text-lg font-bold text-[#F0E6FF]">Secret Config Panel</h2>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg bg-[#1A1A2E] text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. 언어 설정 드롭다운 (사장님 요청) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF] uppercase">Language (Locale)</label>
                <select
                  value={config.appLocale}
                  onChange={(e) => {
                    const nextLocale = e.target.value as any;
                    const next = { ...config, appLocale: nextLocale };
                    saveConfig(next);
                    router.push(`/${nextLocale}/calc`);
                  }}
                  className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-[#F0E6FF] px-3 py-2 text-sm focus:outline-none focus:border-[#7C3AED]"
                >
                  <option value="ko">한국어 (Korean)</option>
                  <option value="en">English (English)</option>
                  <option value="ja">日本語 (Japanese)</option>
                  <option value="zh-CN">简体中文 (Chinese)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                </select>
              </div>

              {/* 2. 포스 설정 */}
              <div className="space-y-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4">
                <h3 className="text-sm font-semibold text-[#A855F7]">Force Target Value</h3>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                    <input
                      type="radio"
                      name="forceType"
                      checked={config.forceType === "static"}
                      onChange={() => saveConfig({ ...config, forceType: "static" })}
                      className="accent-[#7C3AED]"
                    />
                    Static Number
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                    <input
                      type="radio"
                      name="forceType"
                      checked={config.forceType === "time"}
                      onChange={() => saveConfig({ ...config, forceType: "time" })}
                      className="accent-[#7C3AED]"
                    />
                    Time-based
                  </label>
                </div>

                {config.forceType === "static" ? (
                  <div className="space-y-2">
                    <label className="text-xs text-[#9CA3AF]">Forced Number</label>
                    <input
                      type="text"
                      value={config.staticNumber}
                      onChange={(e) => saveConfig({ ...config, staticNumber: e.target.value.replace(/[^0-9.-]/g, "") })}
                      className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-[#9CA3AF]">Time Format (Dropdown)</label>
                      <select
                        value={config.timeFormat}
                        onChange={(e) => saveConfig({ ...config, timeFormat: e.target.value as any })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none"
                      >
                        <option value="YYYYMMDDHHMM">YYYYMMDDHHMM (ex: 202606031530)</option>
                        <option value="MMDDYYYYHHMM">MMDDYYYYHHMM (ex: 060320261530)</option>
                        <option value="DDMMYYYYHHMM">DDMMYYYYHHMM (ex: 030620261530)</option>
                        <option value="YYMMDDHHMM">YYMMDDHHMM (ex: 2606031530)</option>
                        <option value="HHMM">HHMM (ex: 1530)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-[#9CA3AF]">Minutes Offset (+/- minutes)</label>
                      <input
                        type="number"
                        value={config.timeOffset}
                        onChange={(e) => saveConfig({ ...config, timeOffset: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#2D2D4E]">
                  <label className="text-xs text-[#9CA3AF] uppercase">Force Behavior Mode</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                      <input
                        type="radio"
                        name="forceMode"
                        checked={config.forceMode === "one-time"}
                        onChange={() => saveConfig({ ...config, forceMode: "one-time" })}
                        className="accent-[#7C3AED]"
                      />
                      One-time
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                      <input
                        type="radio"
                        name="forceMode"
                        checked={config.forceMode === "continuous"}
                        onChange={() => saveConfig({ ...config, forceMode: "continuous" })}
                        className="accent-[#7C3AED]"
                      />
                      Continuous
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. 위장 테마 설정 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF] uppercase">Calculator Camouflage Theme</label>
                <div className="flex gap-3">
                  {["auto", "ios", "android"].map((tOption) => (
                    <button
                      key={tOption}
                      onClick={() => saveConfig({ ...config, osTheme: tOption as any })}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border uppercase transition-colors ${
                        config.osTheme === tOption
                          ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                          : "bg-[#1A1A2E] border-[#2D2D4E] text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      {tOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. 감열 프린터 연동 설정 */}
              <div className="space-y-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4">
                <h3 className="text-sm font-semibold text-[#A855F7] flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" /> Thermal Printer Settings
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={handleConnectPrinter}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
                  >
                    Scan & Pair Bluetooth Printer
                  </button>
                  {printerStatus && (
                    <p className="text-[11px] text-[#9CA3AF] bg-[#13131F] p-2 rounded border border-[#2D2D4E] break-words">
                      {printerStatus}
                    </p>
                  )}
                </div>

                {printerDevice && (
                  <div className="space-y-3 pt-2 border-t border-[#2D2D4E]">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#9CA3AF]">Receipt Template</label>
                      <textarea
                        rows={5}
                        value={config.receiptTemplate}
                        onChange={(e) => saveConfig({ ...config, receiptTemplate: e.target.value })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white text-xs px-3 py-2 resize-none"
                      />
                      <p className="text-[9px] text-gray-500">Variables: {"{num1}, {num2}, {num3}, {result}"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-[#9CA3AF]">Print Font Style</label>
                      <select
                        value={config.receiptFont}
                        onChange={(e) => saveConfig({ ...config, receiptFont: e.target.value as any })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white text-xs px-3 py-2 focus:outline-none"
                      >
                        <option value="cursive">Cursive Cursive (필기체)</option>
                        <option value="myeongjo">Myeongjo Serif (명조체)</option>
                        <option value="gothic">Gothic Sans-serif (기본체)</option>
                      </select>
                    </div>

                    <button
                      onClick={handlePrintReceipt}
                      disabled={isPrinting}
                      className="w-full py-2 rounded-lg text-xs font-semibold border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      {isPrinting ? "Printing..." : "Test Print Receipt"}
                    </button>
                  </div>
                )}
              </div>

              {/* 5. 마술 설명서 (다국어 수록) */}
              <div className="space-y-4 rounded-xl bg-[#13131F] border border-[#2D2D4E] p-4 text-xs select-text">
                <h3 className="text-sm font-semibold text-[#F0E6FF] flex items-center gap-1.5 pb-2 border-b border-[#2D2D4E]">
                  <BookOpen className="w-4 h-4 text-[#A855F7]" /> {manual.title}
                </h3>

                <div className="space-y-4 text-gray-400 leading-relaxed font-sans">
                  <div>
                    <h4 className="font-semibold text-white mb-1">{manual.nfcPwa}</h4>
                    <p className="whitespace-pre-line">{manual.nfcPwaDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{manual.forceTitle}</h4>
                    <p className="whitespace-pre-line">{manual.forceDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{manual.peekingTitle}</h4>
                    <p className="whitespace-pre-line">{manual.peekingDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{manual.eraseTitle}</h4>
                    <p className="whitespace-pre-line">{manual.eraseDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{manual.bluetoothTitle}</h4>
                    <p className="whitespace-pre-line">{manual.bluetoothDesc}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{manual.instagramTitle}</h4>
                    <p className="whitespace-pre-line">{manual.instagramDesc}</p>
                  </div>
                </div>
              </div>

              {/* 6. 수동 로그 삭제 버튼 */}
              <div className="pt-4 border-t border-[#2D2D4E]">
                <button
                  onClick={() => {
                    setPeekLogs([]);
                    triggerDimmingFeedback();
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  Clear Background Logs History
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TypeScript 인터페이스 ──
interface MagicConfig {
  forceType: "static" | "time";
  staticNumber: string;
  timeFormat: "YYYYMMDDHHMM" | "MMDDYYYYHHMM" | "DDMMYYYYHHMM" | "YYMMDDHHMM" | "HHMM";
  timeOffset: number;
  forceMode: "one-time" | "continuous";
  osTheme: "auto" | "ios" | "android";
  receiptTemplate: string;
  receiptFont: "gothic" | "myeongjo" | "cursive";
  appLocale: "ko" | "en" | "ja" | "zh-CN" | "es" | "fr" | "de";
}

// Web Bluetooth API 타입 캐스팅
interface BluetoothDevice {
  name?: string;
  gatt?: {
    connect(): Promise<BluetoothRemoteGATTServer>;
  };
}
interface BluetoothRemoteGATTServer {
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}
interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}
interface BluetoothRemoteGATTCharacteristic {
  writeValueWithResponse(value: BufferSource): Promise<void>;
}
