"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, X, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

interface Step {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  number: number;
}

interface Job {
  name: string;
  status: string;
  conclusion: string | null;
  steps: Step[];
}

interface BuildStatus {
  id: number;
  status: "queued" | "in_progress" | "completed" | "waiting";
  conclusion: "success" | "failure" | "cancelled" | null;
  html_url: string;
  updated_at: string;
  jobs: Job[];
}

interface Props {
  onClose: () => void;
}

export default function BuildMonitorTerminal({ onClose }: Props) {
  const [status, setStatus] = useState<BuildStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Web Audio API 비프 사운드 피드백
  const playSound = (type: "success" | "error" | "tick") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else {
        // tick
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // ignore
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/admin/firmware/build-status?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error("GitHub Actions 정보를 불러올 수 없습니다.");
      }
      const data: BuildStatus = await res.json();
      setStatus(data);
      setError(null);

      // 로그 정제 및 실시간 추가
      const newLogs: string[] = [];
      newLogs.push(`[SYSTEM] 모니터링 연동 완료. Run ID: ${data.id}`);
      newLogs.push(`[SYSTEM] 워크플로 상태: ${data.status.toUpperCase()}`);

      let completedSteps = 0;
      let totalSteps = 0;

      data.jobs.forEach((job) => {
        job.steps.forEach((step) => {
          totalSteps++;
          let stepStatus = step.status.toUpperCase();
          if (step.conclusion) {
            stepStatus += ` (${step.conclusion.toUpperCase()})`;
          }
          newLogs.push(`  > [Job: ${job.name}] ${step.name} ... ${stepStatus}`);
          if (step.status === "completed") {
            completedSteps++;
          }
        });
      });

      if (totalSteps > 0) {
        const percent = Math.floor((completedSteps / totalSteps) * 100);
        newLogs.push(`[PROGRESS] 전체 컴파일 진행도: ${percent}% (${completedSteps}/${totalSteps})`);
      }

      setLogs(newLogs);

      // 상태 변화 감지 및 효과음 재생
      if (lastStatusRef.current !== (data.status as any) || (data.conclusion && lastStatusRef.current !== (data.conclusion as any))) {
        const nextState = data.conclusion || data.status;
        if (nextState === "success") {
          playSound("success");
        } else if (nextState === "failure" || nextState === "cancelled") {
          playSound("error");
        } else {
          playSound("tick");
        }
        lastStatusRef.current = nextState;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // 3초 주기로 빌드 상태 폴링
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  // 터미널 스크롤 하단 고정
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      className="fixed bottom-6 right-6 w-96 md:w-[480px] rounded-2xl overflow-hidden shadow-2xl z-50 transition-all duration-300 border"
      style={{
        background: "rgba(13, 13, 26, 0.95)",
        borderColor: error ? "#EF4444" : status?.conclusion === "success" ? "#10B981" : "#2D2D4E",
        backdropFilter: "blur(12px)",
        boxShadow: error
          ? "0 0 30px rgba(239, 68, 68, 0.15)"
          : status?.conclusion === "success"
          ? "0 0 30px rgba(16, 185, 129, 0.15)"
          : "0 0 30px rgba(124, 58, 237, 0.15)",
      }}
    >
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#2D2D4E]" style={{ background: "rgba(26,26,46,0.5)" }}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#A855F7]" />
          <span className="text-xs font-bold font-mono tracking-wide text-[#F0E6FF]">
            FIRMWARE COMPILER MONITOR
          </span>
          {status?.status === "in_progress" && (
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {status?.html_url && (
            <a
              href={status.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9CA3AF] hover:text-white transition-colors"
              title="GitHub Action 원본 보기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={onClose} className="text-[#6B7280] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 터미널 로그 콘솔 */}
      <div className="p-4 h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-[#2D2D4E] scrollbar-track-transparent">
        {loading && (
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#A855F7]" />
            <span>Connecting to GitHub Actions status service...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-[#EF4444]">
            <AlertTriangle className="w-4 h-4" />
            <span>Error: {error}</span>
          </div>
        )}

        {!loading && !error && logs.map((log, idx) => {
          let color = "#9CA3AF";
          if (log.includes("[SYSTEM]")) color = "#A855F7";
          else if (log.includes("[PROGRESS]")) color = "#3B82F6";
          else if (log.includes("COMPLETED (SUCCESS)")) color = "#10B981";
          else if (log.includes("FAILURE")) color = "#EF4444";
          else if (log.includes("IN_PROGRESS")) color = "#EAB308";

          return (
            <div key={idx} className="leading-relaxed" style={{ color }}>
              {log}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* 하단 요약 바 */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-[#2D2D4E]" style={{ background: "rgba(26,26,46,0.3)" }}>
        <div className="flex items-center gap-1.5">
          {status?.conclusion === "success" ? (
            <span className="flex items-center gap-1 text-[10px] text-[#10B981] font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> BUILD SUCCESS
            </span>
          ) : status?.conclusion === "failure" ? (
            <span className="flex items-center gap-1 text-[10px] text-[#EF4444] font-bold">
              <AlertTriangle className="w-3.5 h-3.5" /> BUILD FAILED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF] font-bold font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-[#A855F7]" /> COMPILING...
            </span>
          )}
        </div>
        <span className="text-[9px] text-[#6B7280] font-mono">
          Last sync: {status ? new Date(status.updated_at).toLocaleTimeString() : "-"}
        </span>
      </div>
    </div>
  );
}
