/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Wifi, Check, AlertTriangle, BookOpen, RefreshCw, X, ChevronRight,
  Clock, Ruler, Delete
} from "lucide-react";
import AppUnlockForm from "./AppUnlockForm";

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

// 안전한 사칙연산 파서 (eval 대체) — 숫자·소수점·( )·+ - * / 및 단항 마이너스 지원.
// 입력은 자기 입력 한정이지만 eval 회피 + 비정상 입력에 NaN 반환으로 안전.
function safeEval(expr: string): number {
  const tokens = expr.match(/(\d+\.?\d*|\.\d+|[+\-*/()])/g);
  if (!tokens) return NaN;
  const out: (number | string)[] = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, u: 3 };
  let prev: string | null = null;
  for (const t of tokens) {
    if (/^[\d.]/.test(t)) {
      out.push(parseFloat(t));
      prev = "num";
    } else if (t === "(") {
      ops.push(t);
      prev = "(";
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()!);
      if (ops[ops.length - 1] === "(") ops.pop();
      prev = ")";
    } else {
      // 단항 마이너스: 시작/여는괄호/연산자 직후의 '-'
      const isUnary = t === "-" && (prev === null || prev === "(" || prev === "op");
      const op = isUnary ? "u" : t;
      if (op === "u") {
        ops.push("u");
      } else {
        while (
          ops.length && ops[ops.length - 1] !== "(" &&
          prec[ops[ops.length - 1]] >= prec[op]
        ) {
          out.push(ops.pop()!);
        }
        ops.push(op);
      }
      prev = "op";
    }
  }
  while (ops.length) out.push(ops.pop()!);

  const st: number[] = [];
  for (const tok of out) {
    if (typeof tok === "number") st.push(tok);
    else if (tok === "u") {
      const a = st.pop();
      if (a === undefined) return NaN;
      st.push(-a);
    } else {
      const b = st.pop();
      const a = st.pop();
      if (a === undefined || b === undefined) return NaN;
      st.push(tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : a / b);
    }
  }
  return st.length === 1 ? st[0] : NaN;
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
    forceDesc: "• C (또는 AC) 버튼을 3초간 꾹 누르면 미세한 화면 디밍(반짝임)과 함께 포스 모드가 켜고 꺼집니다.\n• 포스가 활성화되면 '.'(소수점) 버튼 기호가 일반 마침표에서 가운데로 살짝 올라온 점(·)으로 미세하게 바뀝니다.\n• 포스 활성 시 '=' 버튼을 누르면 입력된 수식과 관계없이 설정된 숫자나 시간 포스값이 최종 노출됩니다.",
    peekingTitle: "3. 비밀 기록 훔쳐보기 (9번 1초 홀드 후 드래그)",
    peekingDesc: "• 9번 버튼을 1초 이상 꾹 누르면 디밍 피드백과 함께 Peeking 모드가 켜집니다. 손가락을 뗄 때는 숫자 9가 입력되지 않습니다.\n• 이 상태에서 계산기 화면을 오른쪽에서 왼쪽으로 쓸어넘기면(Swipe Left) 화면이 찢어지며 검은 배경에 흰색 글씨로 관객이 입력한 순수 숫자 로그가 나타납니다.\n• 손가락을 놓으면 스프링 모션으로 0.1초 만에 닫힙니다.\n• '=' 버튼을 2초간 누르면 피킹 로그가 완전히 지워집니다.",
    eraseTitle: "4. 앞자리 삭제 마술 (규칙 뒤집기)",
    eraseDesc: "• '+/-' 버튼을 터치하여 켜면 버튼명이 '-/+'로 뒤바뀝니다.\n• 이 상태에서 디스플레이 숫자 창을 오른쪽에서 왼쪽으로 스와이프(좌측으로 쓸기)하면 가장 앞자리(왼쪽) 글자부터 한 글자씩 부드럽게 날아가며 지워지는 초자연적 연출을 보여줍니다.",
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
    forceDesc: "• Long press 'C' (or 'AC') for 3s to toggle Force mode (indicated by a subtle screen dimming feedback).\n• When active, the '.' (decimal) key subtly changes to a raised, centered dot (·).\n• Pressing '=' outputs your forced static value or timeoffset value instantly.",
    peekingTitle: "3. Spectator Peeking (Hold '9' for 1s & Swipe)",
    peekingDesc: "• Long press '9' for 1s. Liting the finger won't type '9'. Swipe left to reveal the scrollable white-on-black history log.\n• Letting go snaps the screen back instantly.\n• Long press '=' for 2s to clear the log history.",
    eraseTitle: "4. First Digit Erasure (Hold '+/-')",
    eraseDesc: "• Press '+/-' to toggle. The key changes to '-/+' as an indicator.\n• Swipe right-to-left on the display to fade away numbers starting from the first (leftmost) digit.",
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
    forceDesc: "• C(またはAC)ボタンを3秒間長押しすると、画面が微かに暗滅し、フォースのON/OFFが切り替わります。\n• 有効化時、「.」(小数点)ボタンの記号が中央に少し上がった点(·)に微妙に変わります。\n• フォース有効時に「=」を押すと、設定値が結果として出力されます。",
    peekingTitle: "3. 秘密ののぞき見 (9を1秒長押ししてスワイプ)",
    peekingDesc: "• 9ボタンを1秒以上長押しすると、のぞき見モードがONになり、指を離しても9は入力されません。\n• 電卓画面を右から左へスワイプすると、観客が入力した純粋な数字の履歴が表示されます。\n• 指を離すとスナップバックします。「=」を2秒長押しで履歴がクリアされます。",
    eraseTitle: "4. 左側からの数字消去 (+/-トグル)",
    eraseDesc: "• 「+/-」をタップすると有効化され、表示が「-/+」に変わります。\n• 数字表示部を右から左にスワイプすると、一番左(先頭)の数字から1文字ずつ消えていきます。",
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
    forceDesc: "• 长按“C”(或AC)键3秒，屏幕会闪烁微调亮暗以切换强迫模式。\n• 激活时，“.”(小数点)按钮的符号会微妙地变成略微居中上移的点(·)。\n• 在该模式下按“=”，将直接输出设定好的目标数字或时间。",
    peekingTitle: "3. 偷看记录 (长按 9 键 1秒并滑动)",
    peekingDesc: "• 长按“9”键1秒，移开手指时不会输入9。向左滑动电卓界面可以拉开后面的白字黑底输入记录板。\n• 松开手指界面即刻回弹。长按“=”键2秒可清除偷看记录。",
    eraseTitle: "4. 抹除头部数字 (+/- 键激活)",
    eraseDesc: "• 按下“+/-”键切换至“-/+”。在显示屏上从右往左滑动，将使数字从最左侧(头部)开始逐个淡出消失。",
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
    forceDesc: "• Mantenga pulsado 'C' (o 'AC') por 3s para activar/desactivar el forzaje (se confirma con un leve parpadeo de la pantalla).\n• Si está activo, el botón '.' (decimal) cambia sutilmente a un punto elevado y centrado (·).\n• Presionar '=' arrojará directamente su valor de forzaje asignado.",
    peekingTitle: "3. Peeking / Vistazo Secreto (Mantener '9' por 1s)",
    peekingDesc: "• Mantenga pulsado '9' por 1s. Deslice hacia la izquierda para revelar la lista negra de entradas del espectador. Al soltar, se cierra.\n• Mantenga pulsado '=' por 2s para borrar el historial.",
    eraseTitle: "4. Borrado del Primer Dígito (Tocar '+/-')",
    eraseDesc: "• Pulse '+/-' para activarlo, el botón cambiará a '-/+'. Deslice de derecha a izquierda en la pantalla para borrar los números desde el principio.",
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
    forceDesc: "• Maintenez 'C' (ou 'AC') enfoncé pendant 3s pour basculer le mode forçage (signalé par un clignotement discret).\n• Lorsqu'il est actif, la touche '.' (décimale) devient subtilement un point surélevé et centré (·).\n• Appuyer sur '=' affiche le nombre forcé.",
    peekingTitle: "3. Regard Secret (Maintenir '9' 1s)",
    peekingDesc: "• Maintenez '9' 1s, puis glissez vers la gauche pour lire les entrées secrètes du spectateur. Relâchez pour fermer.\n• Maintenez '=' 2s pour vider l'historique.",
    eraseTitle: "4. Effacement de Gauche (Activer '+/-')",
    eraseDesc: "• Appuyez sur '+/-' pour changer en '-/+'. Glissez de droite à gauche sur l'écran pour effacer à partir du premier chiffre.",
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
    forceDesc: "• C (oder AC) für 3s halten, um Forcierung zu toggeln. Bestätigt durch kurzes Dimmen.\n• Aktiviert ändert sich die '.'-Taste (Dezimalpunkt) dezent zu einem erhöhten, zentrierten Punkt (·).\n• '=' drücken zeigt das Forcier-Ergebnis.",
    peekingTitle: "3. Spion-Ansicht (Hold '9' für 1s)",
    peekingDesc: "• '9' für 1s halten. Nach links wischen, um den Protokollverlauf der Zuschauer-Eingaben zu sehen. Loslassen schließt.\n• '=' für 2s halten löscht den Verlauf.",
    eraseTitle: "4. Erstes Zeichen löschen (Hold '+/-')",
    eraseDesc: "• Drücken Sie '+/-' (wird zu '-/+'). Wischen Sie auf dem Display von rechts nach links, um Ziffern von vorne zu löschen.",
    bluetoothTitle: "5. Bluetooth Belegdrucker",
    bluetoothDesc: "• Drucker in Einstellungen koppeln. '=' für 3s halten, um den Beleg mit Schreibschrift-Bitmaps zu drucken.\n• Auf iOS ist die Browser-App 'Bluefy' zwingend erforderlich.",
    instagramTitle: "6. Instagram-Verwandlung (Tippe 0000 =)",
    instagramDesc: "• '0000 =' eingeben, um zu einem täuschend echten Instagram-Feed zu wechseln, der einen Beitrag 'vor 3 Wochen' mit den Zahlen anzeigt."
  }
};

// 비밀 설정창 7개 언어 라벨 (사용자=마술사용)
interface SettingsText {
  panelTitle: string; language: string; forceTarget: string; staticNum: string; timeBased: string;
  forcedNumber: string; timeFormat: string; minutesOffset: string; minUnit: string; forceBehavior: string;
  oneTime: string; continuous: string; camouflage: string; printerSettings: string; scanPair: string;
  receiptTemplate: string; variables: string; printFont: string; fontCursive: string; fontMyeongjo: string;
  fontGothic: string; printing: string; testPrint: string; clearLogs: string;
  btScanning: string; btConnecting: string; btConnected: string; btNoChar: string; btFailed: string;
  prNotConnected: string; prBuilding: string; prDone: string; prFailed: string;
}
const SETTINGS_TEXTS: Record<string, SettingsText> = {
  en: { panelTitle: "Secret Config Panel", language: "Language", forceTarget: "Force Target Value", staticNum: "Static Number", timeBased: "Time-based", forcedNumber: "Forced Number", timeFormat: "Time Format", minutesOffset: "Minutes Offset", minUnit: "min", forceBehavior: "Force Behavior Mode", oneTime: "One-time", continuous: "Continuous", camouflage: "Calculator Camouflage Theme", printerSettings: "Thermal Printer Settings", scanPair: "Scan & Pair Bluetooth Printer", receiptTemplate: "Receipt Template", variables: "Variables", printFont: "Print Font Style", fontCursive: "Cursive", fontMyeongjo: "Serif", fontGothic: "Sans-serif", printing: "Printing...", testPrint: "Test Print Receipt", clearLogs: "Clear Background Logs History", btScanning: "Scanning Bluetooth...", btConnecting: "Connecting", btConnected: "✓ Printer connected successfully.", btNoChar: "Characteristic not found.", btFailed: "Connection failed", prNotConnected: "Printer not connected. Please pair it in settings.", prBuilding: "Building receipt image...", prDone: "✓ Receipt printed successfully.", prFailed: "Print failed" },
  ko: { panelTitle: "비밀 설정", language: "언어", forceTarget: "포스 대상 값", staticNum: "고정 숫자", timeBased: "시간 기반", forcedNumber: "포스할 숫자", timeFormat: "시간 형식", minutesOffset: "분 오프셋", minUnit: "분", forceBehavior: "포스 동작 모드", oneTime: "1회성", continuous: "지속", camouflage: "계산기 위장 테마", printerSettings: "감열 프린터 설정", scanPair: "블루투스 프린터 검색·연결", receiptTemplate: "영수증 템플릿", variables: "변수", printFont: "인쇄 글꼴", fontCursive: "필기체", fontMyeongjo: "명조체", fontGothic: "고딕체", printing: "인쇄 중...", testPrint: "테스트 인쇄", clearLogs: "백그라운드 로그 지우기", btScanning: "블루투스 검색 중...", btConnecting: "연결 시도 중", btConnected: "✓ 프린터가 성공적으로 연결되었습니다.", btNoChar: "특성(Characteristic)을 찾을 수 없습니다.", btFailed: "연결 실패", prNotConnected: "프린터가 연결되지 않았습니다. 설정에서 연결해 주세요.", prBuilding: "영수증 이미지 생성 중...", prDone: "✓ 영수증 출력이 완료되었습니다.", prFailed: "인쇄 실패" },
  ja: { panelTitle: "シークレット設定", language: "言語", forceTarget: "フォース対象の値", staticNum: "固定数字", timeBased: "時間ベース", forcedNumber: "フォースする数字", timeFormat: "時間フォーマット", minutesOffset: "分オフセット", minUnit: "分", forceBehavior: "フォース動作モード", oneTime: "1回のみ", continuous: "継続", camouflage: "電卓カモフラージュ", printerSettings: "感熱プリンター設定", scanPair: "Bluetoothプリンターを検索・接続", receiptTemplate: "レシートテンプレート", variables: "変数", printFont: "印刷フォント", fontCursive: "筆記体", fontMyeongjo: "明朝体", fontGothic: "ゴシック体", printing: "印刷中...", testPrint: "テスト印刷", clearLogs: "バックグラウンドログを消去", btScanning: "Bluetoothを検索中...", btConnecting: "接続を試行中", btConnected: "✓ プリンターが正常に接続されました。", btNoChar: "Characteristicが見つかりません。", btFailed: "接続失敗", prNotConnected: "プリンターが接続されていません。設定から接続してください。", prBuilding: "レシート画像を生成中...", prDone: "✓ レシートの印刷が完了しました。", prFailed: "印刷失敗" },
  "zh-CN": { panelTitle: "秘密设置", language: "语言", forceTarget: "强迫目标值", staticNum: "固定数字", timeBased: "基于时间", forcedNumber: "强迫的数字", timeFormat: "时间格式", minutesOffset: "分钟偏移", minUnit: "分", forceBehavior: "强迫行为模式", oneTime: "一次性", continuous: "持续", camouflage: "计算器伪装主题", printerSettings: "热敏打印机设置", scanPair: "扫描并配对蓝牙打印机", receiptTemplate: "小票模板", variables: "变量", printFont: "打印字体", fontCursive: "手写体", fontMyeongjo: "明体", fontGothic: "黑体", printing: "打印中...", testPrint: "测试打印", clearLogs: "清除后台记录", btScanning: "正在扫描蓝牙...", btConnecting: "正在尝试连接", btConnected: "✓ 打印机已成功连接。", btNoChar: "未找到特征(Characteristic)。", btFailed: "连接失败", prNotConnected: "打印机未连接。请在设置中连接。", prBuilding: "正在生成小票图像...", prDone: "✓ 小票打印完成。", prFailed: "打印失败" },
  es: { panelTitle: "Configuración Secreta", language: "Idioma", forceTarget: "Valor Forzado", staticNum: "Número Fijo", timeBased: "Basado en Tiempo", forcedNumber: "Número a Forzar", timeFormat: "Formato de Hora", minutesOffset: "Desfase de Minutos", minUnit: "min", forceBehavior: "Modo de Forzaje", oneTime: "Una vez", continuous: "Continuo", camouflage: "Tema de Camuflaje", printerSettings: "Impresora Térmica", scanPair: "Buscar y Vincular Impresora Bluetooth", receiptTemplate: "Plantilla de Recibo", variables: "Variables", printFont: "Fuente de Impresión", fontCursive: "Cursiva", fontMyeongjo: "Serif", fontGothic: "Sans-serif", printing: "Imprimiendo...", testPrint: "Imprimir Prueba", clearLogs: "Borrar Registros de Fondo", btScanning: "Buscando Bluetooth...", btConnecting: "Conectando", btConnected: "✓ Impresora conectada correctamente.", btNoChar: "Característica no encontrada.", btFailed: "Conexión fallida", prNotConnected: "Impresora no conectada. Vincúlela en ajustes.", prBuilding: "Generando imagen del recibo...", prDone: "✓ Recibo impreso correctamente.", prFailed: "Error de impresión" },
  fr: { panelTitle: "Configuration Secrète", language: "Langue", forceTarget: "Valeur Forcée", staticNum: "Nombre Fixe", timeBased: "Basé sur l'Heure", forcedNumber: "Nombre à Forcer", timeFormat: "Format de l'Heure", minutesOffset: "Décalage en Minutes", minUnit: "min", forceBehavior: "Mode de Forçage", oneTime: "Une fois", continuous: "Continu", camouflage: "Thème de Camouflage", printerSettings: "Imprimante Thermique", scanPair: "Rechercher et Associer l'Imprimante Bluetooth", receiptTemplate: "Modèle de Reçu", variables: "Variables", printFont: "Police d'Impression", fontCursive: "Cursive", fontMyeongjo: "Serif", fontGothic: "Sans-serif", printing: "Impression...", testPrint: "Imprimer un Test", clearLogs: "Effacer les Journaux", btScanning: "Recherche Bluetooth...", btConnecting: "Connexion en cours", btConnected: "✓ Imprimante connectée.", btNoChar: "Caractéristique introuvable.", btFailed: "Échec de la connexion", prNotConnected: "Imprimante non connectée. Associez-la dans les réglages.", prBuilding: "Génération de l'image du reçu...", prDone: "✓ Reçu imprimé.", prFailed: "Échec de l'impression" },
  de: { panelTitle: "Geheime Einstellungen", language: "Sprache", forceTarget: "Forcier-Zielwert", staticNum: "Feste Zahl", timeBased: "Zeitbasiert", forcedNumber: "Zu forcierende Zahl", timeFormat: "Zeitformat", minutesOffset: "Minuten-Versatz", minUnit: "Min", forceBehavior: "Forcier-Modus", oneTime: "Einmalig", continuous: "Dauerhaft", camouflage: "Rechner-Tarnung", printerSettings: "Thermodrucker", scanPair: "Bluetooth-Drucker suchen & koppeln", receiptTemplate: "Beleg-Vorlage", variables: "Variablen", printFont: "Druckschrift", fontCursive: "Schreibschrift", fontMyeongjo: "Serif", fontGothic: "Sans-serif", printing: "Druckt...", testPrint: "Testdruck", clearLogs: "Hintergrund-Logs löschen", btScanning: "Bluetooth wird gesucht...", btConnecting: "Verbindung wird hergestellt", btConnected: "✓ Drucker erfolgreich verbunden.", btNoChar: "Characteristic nicht gefunden.", btFailed: "Verbindung fehlgeschlagen", prNotConnected: "Drucker nicht verbunden. Bitte in den Einstellungen koppeln.", prBuilding: "Beleg-Bild wird erstellt...", prDone: "✓ Beleg erfolgreich gedruckt.", prFailed: "Druck fehlgeschlagen" },
};

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
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false); // 햅틱 대체 미세 디밍 피드백
  
  // 드래그 Peeking 상태
  const [isPeekingActive, setIsPeekingActive] = useState(false); // 피킹 모드 ON(드래그 중 또는 열림 고정)
  const [peekDragging, setPeekDragging] = useState(false);       // 손가락으로 끄는 중(1:1 추종, transition 끔)
  const [dragOffset, setDragOffset] = useState(0);
  const peekStartXRef = useRef<number | null>(null);

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
    instaTriggerCode: "0000",
    stealthIndicatorMode: "label",
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
    setMounted(true);
  }, [config.osTheme]);

  // 기기 인증 및 쿠키 복원 처리
  useEffect(() => {
    if (!productId) return;

    // 1. localStorage에서 토큰 찾아 쿠키 유실 시 복원
    let token = localStorage.getItem("ml_calc_device_token");
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ml_dt_")) {
          token = localStorage.getItem(key);
          break;
        }
      }
    }
    if (token) {
      const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `ml_calc_device_token=${token}; path=/; max-age=2592000; SameSite=Lax${secureSuffix}`;
      document.cookie = `ml_dt_${productId}=${token}; path=/; max-age=2592000; SameSite=Lax${secureSuffix}`;
    }

    // 2. 로컬스토리지 플래그 기반 낙관적(즉시) 인증 처리
    const localActive = localStorage.getItem("ml_app_activated_magic-calculator") === "1";
    if (localActive) {
      setAuthorized(true);
    } else {
      setAuthorized(false);
    }

    // 3. 백그라운드 라이선스 세션 검증 API 호출
    fetch(`/api/magic/verify-session?slug=magic-calculator`)
      .then((res) => res.json())
      .then((data) => {
        if (data.authorized) {
          setAuthorized(true);
          localStorage.setItem("ml_app_activated_magic-calculator", "1");
          if (data.deviceToken) {
            localStorage.setItem("ml_calc_device_token", data.deviceToken);
            localStorage.setItem(`ml_dt_${productId}`, data.deviceToken);
          }
        } else {
          setAuthorized(false);
          localStorage.removeItem("ml_app_activated_magic-calculator");
        }
      })
      .catch(() => {
        // 네트워크 오프라인 상태일 때는 로컬스토리지 인증 성공 상태를 유지
      });
  }, [productId]);

  // 로컬 스토리지에서 마술 설정 복원 (기기별 저장 → 사용자마다 각자 설정 유지)
  // 기본값과 병합해 과거 저장본에 없던 새 필드도 안전하게 채운다
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("ml_calc_config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig) as Partial<MagicConfig>;
        setConfig((prev) => ({ ...prev, ...parsed }));
        // 설정에서 고른 언어를 앱 진입 시 적용·유지 (PWA가 기본 로케일로 열려도 저장 언어로 이동)
        if (parsed.appLocale && parsed.appLocale !== locale) {
          router.replace(`/${parsed.appLocale}/calc`);
        }
      }
    } catch { /* ignore */ }
  }, [locale, router]);

  const saveConfig = (newConfig: MagicConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem("ml_calc_config", JSON.stringify(newConfig));
    } catch { /* ignore */ }
  };

  // 설정창 라벨 (현재 앱 언어 기준)
  const st = SETTINGS_TEXTS[config.appLocale] ?? SETTINGS_TEXTS[locale] ?? SETTINGS_TEXTS.en;

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
    const triggerCode = config.instaTriggerCode || "0000";
    if (equation === triggerCode) {
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
      // 관객 입력 숫자는 피킹 로그에 기록 후 비움 (배경에 남아 비쳐 보이지 않도록)
      if (currentInputNumber) {
        appendToPeekLog(currentInputNumber);
        setCurrentInputNumber("");
      }
      // 디밍 없이 즉시 교체 → 직전 숫자가 비쳐 겹쳐 보이는 현상 방지
      setDisplay(forcedVal);
      setEquation("");
      setIsCalculated(true);
      setLastResult(forcedVal);

      // 1회성 포스 설정 시 즉시 해제
      if (config.forceMode === "one-time") {
        setIsForceActive(false);
      }
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

      // 간단한 사칙연산 수식만 평가 (eval 대신 안전한 파서 사용)
      let res = safeEval(expr);
      if (typeof res !== "number" || isNaN(res) || !isFinite(res)) {
        setDisplay("Error");
      } else {
        // 부동소수점 오차 보정 (예: 0.1+0.2 → 0.3)
        res = Math.round((res + Number.EPSILON) * 1e10) / 1e10;
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
      case "YYMMDD":
        return `${YY}${MM}${DD}`;       // 예: 250603
      case "YYYYMMDD":
        return `${YYYY}${MM}${DD}`;     // 예: 20250603
      case "MMDDYY":
        return `${MM}${DD}${YY}`;       // 예: 060325
      case "DDMMYY":
        return `${DD}${MM}${YY}`;       // 예: 030625
      case "MMDD":
        return `${MM}${DD}`;            // 예: 0603
      case "HHMM":
        return `${HH}${Min}`;
      default:
        return `${YYYY}${MM}${DD}${HH}${Min}`;
    }
  };

  // 독립 인스타 앱 연동 — 관객 피킹값/포스값을 공유 키에 지속 저장한다.
  // 인스타 앱(/insta)이 이 값을 읽어 게시물 캡션의 {force}/{num1}/{num2}/{result} 토큰을 치환.
  useEffect(() => {
    try {
      localStorage.setItem("ml_calc_instagram_prediction", JSON.stringify({
        num1: peekLogs[0] ?? "",
        num2: peekLogs[1] ?? "",
        result: isForceActive ? getForceValue() : display,
      }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peekLogs, display, isForceActive]);

  // 키패드 입력 핸들러 (touchend 릴리즈 감지)
  const handleKeyPress = (val: string) => {
    setIsCalculated(false);

    if (val >= "0" && val <= "9") {
      const fresh = display === "0" || display === "Error" || isCalculated; // 새 숫자 시작
      setCurrentInputNumber((prev) => (isCalculated ? val : prev + val));
      setDisplay((prev) => (fresh ? val : prev + val));
      setEquation((prev) => (isCalculated ? val : prev + val));
    } else if (val === ".") {
      if (isCalculated || display === "Error") {
        // 결과/에러 직후 소수점 → 새 숫자 "0."로 시작
        setDisplay("0.");
        setEquation("0.");
        setCurrentInputNumber("0.");
      } else if (!display.includes(".")) {
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
        let base = prev === "" ? display : prev;
        if (!/\d/.test(base)) base = "0"; // Error 등 숫자 없는 값 방지
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
      // 디밍 없이 즉시 복원 → 뒤 히스토리가 비쳐 겹쳐 보이는 현상 방지
      setDisplay(lastResult);
      setEquation(lastResult);
    } else {
      calculateResult();
    }
  };

  // 9번 버튼 홀드 (2초) - Peeking 활성화 / 짧게 누르면 숫자 9 입력
  const handle9Start = () => {
    isPressingKeyRef.current = "9";
    holdTimerRef.current = setTimeout(() => {
      // 1초 도달 → Peeking 모드 ON + 드래그 시작(손가락이 아직 닿아 있으므로 1:1 추종)
      setIsPeekingActive(true);
      setPeekDragging(true);
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

  // ( ) 버튼 (삼성 레이아웃) - 직전 문맥에 따라 여는/닫는 괄호 자동 선택. eval이 괄호를 처리한다.
  const handleParen = () => {
    setIsCalculated(false);
    setEquation((prev) => {
      const opens = (prev.match(/\(/g) || []).length;
      const closes = (prev.match(/\)/g) || []).length;
      const last = prev.slice(-1);
      const shouldClose = opens > closes && /[0-9)]/.test(last);
      return prev + (shouldClose ? ")" : "(");
    });
  };

  // 백스페이스(⌫, 삼성 툴바) - 마지막 글자 1개 삭제
  const handleBackspace = () => {
    setIsCalculated(false);
    setEquation((prev) => prev.slice(0, -1));
    setCurrentInputNumber((prev) => prev.slice(0, -1));
    setDisplay((prev) => {
      if (prev === "Error") return "0";
      const next = prev.slice(0, -1);
      return next === "" ? "0" : next;
    });
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

  // -/+ 모드: 디스플레이에 손이 닿는 즉시 맨 앞(왼쪽) 글자부터 1개씩 제거 (함수형 업데이트로 연타 안전)
  const eraseFrontChar = () => {
    setDisplay((prev) => (prev.length > 1 && prev !== "Error" ? prev.substring(1) : "0"));
    setEquation((prev) => (prev.length > 1 ? prev.substring(1) : ""));
  };

  // 일반 모드 디스플레이 스와이프 삭제 (오른쪽 → 마지막 글자)
  const handleDisplaySwipe = (direction: "left" | "right") => {
    if (isEraseLeftActive) {
      // -/+ 모드 삭제는 touchstart/move에서 즉시 처리하므로 여기선 무시
      return;
    } else {
      // 일반 모드: 오른쪽 드래그 → 뒤(마지막) 한 글자씩 삭제 (예전 계산기 백스페이스)
      if (direction !== "right") return;
      const nextVal = display.length > 1 && display !== "Error" ? display.slice(0, -1) : "0";
      setDisplay(nextVal);
      setEquation(nextVal === "0" ? "" : nextVal);
    }
  };

  // 드래그 Peeking 터치 제어
  const handleTouchStart = (e: React.TouchEvent) => {
    // 피킹은 9번 1초 홀드 '도중'에 켜지므로 시작 좌표는 항상 기록해 둔다
    peekStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 끄는 중일 때만 앞 화면이 손가락을 1:1로 따라온다 (열림 고정 상태에선 히스토리 스크롤 허용)
    if (!isPeekingActive || !peekDragging) return;
    const x = e.touches[0].clientX;
    const start = peekStartXRef.current ?? x;
    setDragOffset(Math.min(0, x - start)); // 왼쪽으로 끌 때만 이동
  };

  const handleTouchEnd = () => {
    if (!isPeekingActive) return;
    // 손가락을 떼면 스프링 모션으로 즉시 원위치 복귀 + 피킹 종료 (기존 momentary 방식)
    setPeekDragging(false);
    setDragOffset(0);
    setIsPeekingActive(false);
  };

  // ── Web Bluetooth 감열 프린터 래스터화 인쇄 모듈 ──

  // 감열 프린터 연결
  const handleConnectPrinter = async () => {
    setPrinterStatus(st.btScanning);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"], // 일반 BLE SPP 서비스 UUID
      });

      setPrinterStatus(`${st.btConnecting}: ${device.name}...`);
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
      const char = await service?.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");

      if (char) {
        setPrinterDevice(device);
        setPrinterChar(char);
        setPrinterStatus(st.btConnected);
      } else {
        setPrinterStatus(st.btNoChar);
      }
    } catch (e: any) {
      setPrinterStatus(`${st.btFailed}: ${e.message}`);
    }
  };

  // 영수증 비트맵 이미지 생성 및 전송
  const handlePrintReceipt = async () => {
    if (!printerChar) {
      setPrinterStatus(st.prNotConnected);
      return;
    }

    setIsPrinting(true);
    setPrinterStatus(st.prBuilding);

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

      setPrinterStatus(st.prDone);
    } catch (e: any) {
      setPrinterStatus(`${st.prFailed}: ${e.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // 다국어 매뉴얼 리소스 가져오기
  const manual = MANUAL_TEXTS[locale] ?? MANUAL_TEXTS.en;

  if (!mounted || authorized === null) {
    return (
      <div
        className="fixed inset-0 w-full h-full"
        style={{ background: "#000000" }}
      />
    );
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
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              {bt.blockBody}
            </p>
          </div>

          <AppUnlockForm
            productId={productId}
            locale={locale}
            slug="magic-calculator"
            productUrl={productId ? `/${locale}/products/magic-calculator` : `/${locale}/products`}
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

  return (
    <div
      id="calc-root"
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
        <div className="w-full h-full px-6 pt-6 pb-6 flex flex-col justify-start">
          <div
            className="flex-1 overflow-y-auto space-y-3 select-text text-right"
            style={{ touchAction: "pan-y", overscrollBehavior: "contain" }}
          >
            {/* = 결과값은 표시하지 않음. 입력값 목록 중 '최종 입력값'만 다른 색으로 강조 */}
            {peekLogs.map((log, index) => {
              const isLatest = !currentInputNumber && index === peekLogs.length - 1;
              return (
                <div
                  key={index}
                  className="text-3xl font-bold font-mono whitespace-nowrap leading-tight"
                  style={{ color: isLatest ? "#C4B5FD" : "#FFFFFF" }}
                >
                  {log}
                </div>
              );
            })}
            {currentInputNumber && (
              <div className="text-3xl font-bold font-mono whitespace-nowrap leading-tight" style={{ color: "#C4B5FD" }}>
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
          background: "#000000",
          x: dragOffset, // Peeking 시 손가락을 따라 이동 / 열림 고정
        }}
        // 끄는 중엔 transition 없이 손가락 1:1 추종, 놓으면 스프링으로 복귀
        transition={peekDragging ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }}
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
            // 시작 좌표만 기록 — 삭제는 손을 뗄 때(스와이프 1회) 1글자만 처리
            (window as any).displayStartX = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const touch = e.changedTouches[0];
            const startX = (window as any).displayStartX;
            if (startX === undefined) return;
            const diffX = touch.clientX - startX;
            if (Math.abs(diffX) <= 40) return; // 작은 움직임은 무시 (오작동 방지)
            if (isEraseLeftActive) {
              // -/+ 삭제 모드: 왼쪽 스와이프 1회당 맨 앞 글자 1개만 제거
              if (diffX < 0) eraseFrontChar();
            } else {
              handleDisplaySwipe(diffX > 0 ? "right" : "left");
            }
          }}
        >
          <div
            className="w-full text-right font-light text-white select-none whitespace-nowrap overflow-hidden flex items-center justify-end"
            style={{
              fontFamily: theme === "android" ? "Roboto, sans-serif" : "-apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: `${Math.max(2, 5.5 - (display.length > 6 ? (display.length - 6) * 0.5 : 0))}rem`,
              lineHeight: "1.2",
            }}
          >
            {/* 삼성 위장: 입력 전(빈 상태)엔 숫자 대신 가는 커서만 표시 */}
            {theme === "android" && display === "0" && !equation && !currentInputNumber ? (
              <span className="inline-block w-[3px] h-[3.5rem] bg-[#8E8E93] animate-pulse" />
            ) : (
              display
            )}
          </div>
        </div>

        {/* ── 삼성 One UI 상단 툴바 (Android 전용 위장) ── */}
        {theme === "android" && (
          <>
            <div className="flex items-center px-6 pb-3">
              <div className="flex items-center gap-10">
                <Clock className="w-[26px] h-[26px] text-[#9A9A9F]" strokeWidth={2} />
                <Ruler className="w-[26px] h-[26px] text-[#9A9A9F]" strokeWidth={2} />
                <div className="w-[26px] h-[26px] rounded-md border-[1.5px] border-[#9A9A9F] flex items-center justify-center text-[#9A9A9F] text-[8px] font-semibold leading-[1.05] text-center">
                  <span>√π<br />e=</span>
                </div>
              </div>
              <button
                onTouchStart={(e) => { e.preventDefault(); handleBackspace(); }}
                onClick={handleBackspace}
                className="ml-auto w-10 h-10 rounded-full flex items-center justify-center text-[#9A9A9F] active:bg-[#2E2E30] transition-colors"
                aria-label="backspace"
              >
                <Delete className="w-[27px] h-[27px]" strokeWidth={2} />
              </button>
            </div>
            <div className="mx-7 mb-3 h-px bg-[#2E2E30]" />
          </>
        )}

        {/* ── 계산기 키패드 키보드 영역 ── */}
        <div
          className={`grid grid-cols-4 ${theme === "android" ? "gap-x-4 gap-y-2.5 px-3.5" : "gap-3.5 px-5"}`}
          style={theme === "android"
            ? { paddingBottom: "max(24px, env(safe-area-inset-bottom))" }
            : { height: "60vh", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        >
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
                <span className={config.stealthIndicatorMode === "shift" && isEraseLeftActive ? "inline-block -translate-y-1 scale-95" : "inline-block"}>
                  {config.stealthIndicatorMode === "label" && isEraseLeftActive ? "-/+" : "+/-"}
                </span>
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
                <span className={config.stealthIndicatorMode === "shift" && isForceActive ? "inline-block translate-x-1 font-bold" : "inline-block"}>
                  {config.stealthIndicatorMode === "label" && isForceActive ? "·" : "."}
                </span>
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
            // ── Android 계산기 디자인 키패드 (삼성 One UI · 원형 버튼) ──
            <>
              {/* Row 1 — C, ( ), %, ÷ */}
              <button
                onTouchStart={handleCStart}
                onTouchEnd={handleCEnd}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#2E2E30] text-[#E6E6E6] active:bg-[#3A3A3C] transition-colors"
              >
                C
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "()")}
                onTouchEnd={() => isPressingKeyRef.current === "()" && handleParen()}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#2E2E30] text-[#E6E6E6] active:bg-[#3A3A3C] transition-colors"
              >
                ( )
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "%")}
                onTouchEnd={() => isPressingKeyRef.current === "%" && handlePercent()}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#2E2E30] text-[#E6E6E6] active:bg-[#3A3A3C] transition-colors"
              >
                %
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "÷")}
                onTouchEnd={() => isPressingKeyRef.current === "÷" && handleKeyPress("÷")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#E6C99B] text-[#1C1C1E] active:bg-[#D9B884] transition-colors"
              >
                ÷
              </button>

              {/* Row 2 — 7, 8, 9, × */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "7")}
                onTouchEnd={() => isPressingKeyRef.current === "7" && handleKeyPress("7")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                7
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "8")}
                onTouchEnd={() => isPressingKeyRef.current === "8" && handleKeyPress("8")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                8
              </button>
              <button
                onTouchStart={handle9Start}
                onTouchEnd={handle9End}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                9
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "×")}
                onTouchEnd={() => isPressingKeyRef.current === "×" && handleKeyPress("×")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#E6C99B] text-[#1C1C1E] active:bg-[#D9B884] transition-colors"
              >
                ×
              </button>

              {/* Row 3 — 4, 5, 6, − */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "4")}
                onTouchEnd={() => isPressingKeyRef.current === "4" && handleKeyPress("4")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                4
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "5")}
                onTouchEnd={() => isPressingKeyRef.current === "5" && handleKeyPress("5")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                5
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "6")}
                onTouchEnd={() => isPressingKeyRef.current === "6" && handleKeyPress("6")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                6
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "-")}
                onTouchEnd={() => isPressingKeyRef.current === "-" && handleKeyPress("-")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#E6C99B] text-[#1C1C1E] active:bg-[#D9B884] transition-colors"
              >
                −
              </button>

              {/* Row 4 — 1, 2, 3, + */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "1")}
                onTouchEnd={() => isPressingKeyRef.current === "1" && handleKeyPress("1")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                1
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "2")}
                onTouchEnd={() => isPressingKeyRef.current === "2" && handleKeyPress("2")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                2
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "3")}
                onTouchEnd={() => isPressingKeyRef.current === "3" && handleKeyPress("3")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                3
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "+")}
                onTouchEnd={() => isPressingKeyRef.current === "+" && handleKeyPress("+")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#E6C99B] text-[#1C1C1E] active:bg-[#D9B884] transition-colors"
              >
                +
              </button>

              {/* Row 5 — +/−, 0, ., = */}
              <button
                onTouchStart={() => (isPressingKeyRef.current = "+/-")}
                onTouchEnd={() => isPressingKeyRef.current === "+/-" && handlePlusMinusClick()}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#2E2E30] text-[#E6E6E6] active:bg-[#3A3A3C] transition-colors"
              >
                <span className={config.stealthIndicatorMode === "shift" && isEraseLeftActive ? "inline-block -translate-y-1 scale-95" : "inline-block"}>
                  {config.stealthIndicatorMode === "label" && isEraseLeftActive ? "-/+" : "+/−"}
                </span>
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = "0")}
                onTouchEnd={() => isPressingKeyRef.current === "0" && handleKeyPress("0")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                0
              </button>
              <button
                onTouchStart={() => (isPressingKeyRef.current = ".")}
                onTouchEnd={() => isPressingKeyRef.current === "." && handleKeyPress(".")}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl bg-[#2E2E30] text-white active:bg-[#3A3A3C] transition-colors"
              >
                <span className={config.stealthIndicatorMode === "shift" && isForceActive ? "inline-block translate-x-1 font-bold" : "inline-block"}>
                  {config.stealthIndicatorMode === "label" && isForceActive ? "·" : "."}
                </span>
              </button>
              <button
                onTouchStart={handleEqualStart}
                onTouchEnd={handleEqualEnd}
                className="w-full aspect-square rounded-full flex items-center justify-center text-3xl font-medium bg-[#988E73] text-[#1C1C1E] active:bg-[#847B63] transition-colors"
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
                  <h2 className="text-lg font-bold text-[#F0E6FF]">{st.panelTitle}</h2>
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
                <label className="text-xs font-semibold text-[#9CA3AF] uppercase">{st.language}</label>
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
                <h3 className="text-sm font-semibold text-[#A855F7]">{st.forceTarget}</h3>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                    <input
                      type="radio"
                      name="forceType"
                      checked={config.forceType === "static"}
                      onChange={() => saveConfig({ ...config, forceType: "static" })}
                      className="accent-[#7C3AED]"
                    />
                    {st.staticNum}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                    <input
                      type="radio"
                      name="forceType"
                      checked={config.forceType === "time"}
                      onChange={() => saveConfig({ ...config, forceType: "time" })}
                      className="accent-[#7C3AED]"
                    />
                    {st.timeBased}
                  </label>
                </div>

                {config.forceType === "static" ? (
                  <div className="space-y-2">
                    <label className="text-xs text-[#9CA3AF]">{st.forcedNumber}</label>
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
                      <label className="text-xs text-[#9CA3AF]">{st.timeFormat}</label>
                      <select
                        value={config.timeFormat}
                        onChange={(e) => saveConfig({ ...config, timeFormat: e.target.value as any })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white px-3 py-2 text-sm focus:outline-none"
                      >
                        <option value="YYYYMMDDHHMM">YYYYMMDDHHMM (ex: 202506031530)</option>
                        <option value="MMDDYYYYHHMM">MMDDYYYYHHMM (ex: 060320251530)</option>
                        <option value="DDMMYYYYHHMM">DDMMYYYYHHMM (ex: 030620251530)</option>
                        <option value="YYMMDDHHMM">YYMMDDHHMM (ex: 2506031530)</option>
                        <option value="YYYYMMDD">YYYYMMDD (ex: 20250603)</option>
                        <option value="YYMMDD">YYMMDD (ex: 250603)</option>
                        <option value="MMDDYY">MMDDYY (ex: 060325)</option>
                        <option value="DDMMYY">DDMMYY (ex: 030625)</option>
                        <option value="MMDD">MMDD (ex: 0603)</option>
                        <option value="HHMM">HHMM (ex: 1530)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-[#9CA3AF] flex items-center justify-between">
                        <span>{st.minutesOffset}</span>
                        <span className="text-[#A855F7] font-semibold">+{config.timeOffset} {st.minUnit}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={Math.min(10, Math.max(0, config.timeOffset))}
                        onChange={(e) => saveConfig({ ...config, timeOffset: parseInt(e.target.value, 10) || 0 })}
                        className="w-full accent-[#7C3AED]"
                      />
                      <div className="flex justify-between text-[10px] text-[#6B7280]">
                        <span>0</span><span>5</span><span>10</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-[#2D2D4E]">
                  <label className="text-xs text-[#9CA3AF] uppercase">{st.forceBehavior}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                      <input
                        type="radio"
                        name="forceMode"
                        checked={config.forceMode === "one-time"}
                        onChange={() => saveConfig({ ...config, forceMode: "one-time" })}
                        className="accent-[#7C3AED]"
                      />
                      {st.oneTime}
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-[#F0E6FF] cursor-pointer">
                      <input
                        type="radio"
                        name="forceMode"
                        checked={config.forceMode === "continuous"}
                        onChange={() => saveConfig({ ...config, forceMode: "continuous" })}
                        className="accent-[#7C3AED]"
                      />
                      {st.continuous}
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. 위장 테마 설정 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF] uppercase">{st.camouflage}</label>
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

              {/* 3-2. 마술 트릭 및 연동 설정 */}
              <div className="space-y-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4">
                <h3 className="text-sm font-semibold text-[#A855F7]">
                  {config.appLocale === "ko" ? "트릭 및 연동 설정" : "Trick & Morph Settings"}
                </h3>

                {/* 인스타 진입 코드 */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#9CA3AF]">
                    {config.appLocale === "ko" ? "인스타그램 연동 비밀번호" : "Instagram Trigger Code"}
                  </label>
                  <input
                    type="text"
                    value={config.instaTriggerCode || "0000"}
                    onChange={(e) => saveConfig({ ...config, instaTriggerCode: e.target.value.replace(/[^0-9]/g, "") })}
                    maxLength={10}
                    className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white text-xs px-3 py-2"
                    placeholder="예: 0000"
                  />
                  <p className="text-[9px] text-gray-500">
                    {config.appLocale === "ko"
                      ? "• 계산기 화면에서 이 숫자를 치고 '='을 누르면 인스타그램으로 전환됩니다."
                      : "• Enter this code and press '=' to transition to Instagram."}
                  </p>
                </div>

                {/* 비밀 상태 표시 방식 */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#9CA3AF]">
                    {config.appLocale === "ko" ? "비밀 상태 표시 방식" : "Stealth Indicator Mode"}
                  </label>
                  <select
                    value={config.stealthIndicatorMode || "label"}
                    onChange={(e) => saveConfig({ ...config, stealthIndicatorMode: e.target.value as any })}
                    className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white text-xs px-3 py-2 focus:outline-none"
                  >
                    <option value="label">
                      {config.appLocale === "ko" ? "심볼 변경 ( . → · , +/- → -/+ )" : "Symbol Change"}
                    </option>
                    <option value="shift">
                      {config.appLocale === "ko" ? "미세 위치 이동 (1px 시프트)" : "Micro Position Shift"}
                    </option>
                    <option value="none">
                      {config.appLocale === "ko" ? "표시 안 함 (완전 비밀)" : "No Visual Indicator"}
                    </option>
                  </select>
                </div>
              </div>

              {/* 4. 감열 프린터 연동 설정 */}
              <div className="space-y-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E] p-4">
                <h3 className="text-sm font-semibold text-[#A855F7] flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" /> {st.printerSettings}
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={handleConnectPrinter}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-90 active:scale-95 transition-all duration-150"
                  >
                    {st.scanPair}
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
                      <label className="text-xs text-[#9CA3AF]">{st.receiptTemplate}</label>
                      <textarea
                        rows={5}
                        value={config.receiptTemplate}
                        onChange={(e) => saveConfig({ ...config, receiptTemplate: e.target.value })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white text-xs px-3 py-2 resize-none"
                      />
                      <p className="text-[9px] text-gray-500">{st.variables}: {"{num1}, {num2}, {num3}, {result}"}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-[#9CA3AF]">{st.printFont}</label>
                      <select
                        value={config.receiptFont}
                        onChange={(e) => saveConfig({ ...config, receiptFont: e.target.value as any })}
                        className="w-full rounded-lg bg-[#13131F] border border-[#2D2D4E] text-white text-xs px-3 py-2 focus:outline-none"
                      >
                        <option value="cursive">{st.fontCursive}</option>
                        <option value="myeongjo">{st.fontMyeongjo}</option>
                        <option value="gothic">{st.fontGothic}</option>
                      </select>
                    </div>

                    <button
                      onClick={handlePrintReceipt}
                      disabled={isPrinting}
                      className="w-full py-2 rounded-lg text-xs font-semibold border border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      {isPrinting ? st.printing : st.testPrint}
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
                  {st.clearLogs}
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
  timeFormat: "YYYYMMDDHHMM" | "MMDDYYYYHHMM" | "DDMMYYYYHHMM" | "YYMMDDHHMM" | "YYMMDD" | "YYYYMMDD" | "MMDDYY" | "DDMMYY" | "MMDD" | "HHMM";
  timeOffset: number;
  forceMode: "one-time" | "continuous";
  osTheme: "auto" | "ios" | "android";
  receiptTemplate: string;
  receiptFont: "gothic" | "myeongjo" | "cursive";
  appLocale: "ko" | "en" | "ja" | "zh-CN" | "es" | "fr" | "de";
  instaTriggerCode?: string;
  stealthIndicatorMode?: "label" | "shift" | "none";
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
