"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WakeLockSentinel {
  release(): Promise<void>;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
}

interface WindowWithWebAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function PeekContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room") || "";

  const [roomId, setRoomId] = useState(roomParam);
  const [isConnected, setIsConnected] = useState(!!roomParam);
  const [errorMsg, setErrorMsg] = useState("");

  const [display, setDisplay] = useState("0");
  const [peekLogs, setPeekLogs] = useState<string[]>([]);
  const [isForceActive, setIsForceActive] = useState(false);

  // 설정 옵션
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  const prevDisplayRef = useRef("0");
  const prevLogsLengthRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Screen Wake Lock API로 화면 꺼짐 방지
  useEffect(() => {
    if (!isConnected) return;

    async function requestWakeLock() {
      try {
        const nav = navigator as NavigatorWithWakeLock;
        if (nav.wakeLock) {
          wakeLockRef.current = await nav.wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Wake Lock request failed:", err);
      }
    }

    requestWakeLock();

    // 포커스 복귀 시 다시 요청
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        }).catch(() => { /* ignore */ });
      }
    };
  }, [isConnected]);

  // 오디오 비프음 생성 (Web Audio API 사용, 에셋 다운로드 불필요)
  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        const WinClass = window as unknown as WindowWithWebAudio;
        const AudioCtxClass = window.AudioContext || WinClass.webkitAudioContext;
        if (AudioCtxClass) {
          audioContextRef.current = new AudioCtxClass();
        }
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz 명료한 비프음
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Beep failed:", e);
    }
  };

  // Supabase Realtime 채널 구독 연동
  useEffect(() => {
    if (!isConnected || !roomId) return;

    const supabase = createClient();
    const channel = supabase.channel(`ml_peek_${roomId}`);

    channel
      .on("broadcast", { event: "calc_peek" }, ({ payload }) => {
        setDisplay(payload.display ?? "0");
        setPeekLogs(payload.peekLogs ?? []);
        setIsForceActive(!!payload.isForceActive);

        // 변경 사항이 발생하면 햅틱 및 비프 피드백 발동
        const changed =
          payload.display !== prevDisplayRef.current ||
          (payload.peekLogs && payload.peekLogs.length !== prevLogsLengthRef.current);

        if (changed) {
          prevDisplayRef.current = payload.display ?? "0";
          prevLogsLengthRef.current = (payload.peekLogs && payload.peekLogs.length) ?? 0;

          if (vibrateEnabled && navigator.vibrate) {
            navigator.vibrate(60); // 60ms 가벼운 알림 진동
          }
          if (soundEnabled) {
            playBeep();
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setErrorMsg("");
        } else if (status === "TIMED_OUT" || status === "CLOSED") {
          setErrorMsg("Connection lost. Retrying...");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConnected, roomId, soundEnabled, vibrateEnabled]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    setIsConnected(true);
  };

  // 비활성 시 오디오 활성화 잠금 해제용 터치
  const handleTouchScreen = () => {
    if (soundEnabled && audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume().catch(() => { /* ignore */ });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-[#F0E6FF] flex items-center justify-center p-6 select-text">
        <form onSubmit={handleConnect} className="max-w-xs w-full bg-[#13131F] border border-[#2D2D4E] p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-[#A855F7] tracking-wider text-center uppercase">Mystic Calculator Peek</h2>
          <div className="space-y-1.5">
            <label className="text-xs text-[#9CA3AF]">Enter Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="e.g. 1004"
              className="w-full text-center rounded-lg bg-[#0D0D1A] border border-[#2D2D4E] text-white text-lg font-bold px-3 py-2 focus:outline-none focus:border-[#7C3AED]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white active:scale-95 transition-transform"
          >
            CONNECT PEEK
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      onClick={handleTouchScreen}
      onTouchStart={handleTouchScreen}
      className="fixed inset-0 w-full h-full bg-black text-white p-4 flex flex-col justify-between select-none"
    >
      {/* 상단 제어 바 (소리 / 햅틱 켜고 끄기) */}
      <div className="flex justify-between items-center bg-[#13131F]/30 p-2 rounded-xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-mono text-[#9CA3AF]">ROOM: {roomId}</span>
          {errorMsg && <span className="text-[10px] text-red-400 font-semibold">{errorMsg}</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
              soundEnabled ? "bg-purple-600 border-purple-500 text-white" : "border-white/20 text-white/50"
            }`}
          >
            SOUND
          </button>
          <button
            onClick={() => setVibrateEnabled(!vibrateEnabled)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
              vibrateEnabled ? "bg-purple-600 border-purple-500 text-white" : "border-white/20 text-white/50"
            }`}
          >
            VIBE
          </button>
          <button
            onClick={() => setIsConnected(false)}
            className="px-2 py-1 rounded text-[10px] font-bold border border-red-500/30 text-red-400"
          >
            EXIT
          </button>
        </div>
      </div>

      {/* 실시간 피킹 메인 디스플레이 (글자 크기 극대화 및 강한 대비) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        {/* 결과 디스플레이 */}
        <div className="text-center space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-purple-400">Calculator Display</div>
          <div className="text-7xl font-bold font-mono tracking-tight text-white select-all break-all">
            {display}
          </div>
          {isForceActive && (
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              [Force Activated]
            </div>
          )}
        </div>

        {/* 관객 입력 히스토리 페이징 */}
        {peekLogs.length > 0 && (
          <div className="w-full max-w-sm bg-[#13131F]/20 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] font-mono text-[#9CA3AF] mb-1.5 uppercase text-center">Spectator Input Logs</div>
            <div className="max-h-[30vh] overflow-y-auto space-y-1.5 text-center">
              {peekLogs.map((log, i) => (
                <div key={i} className="font-mono text-lg text-white/90">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 스마트 브라우저 하단 안전 안내 */}
      <div className="text-center text-[9px] text-[#555555] font-mono pb-2">
        Mystic Lab Remote Peeking Receiver v1.1 • Sleep Disabled
      </div>
    </div>
  );
}

export default function PeekPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-[#F0E6FF] flex items-center justify-center p-6 select-none">Loading...</div>}>
      <PeekContent />
    </Suspense>
  );
}
