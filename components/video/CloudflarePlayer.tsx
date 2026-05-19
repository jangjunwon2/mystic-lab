"use client";

import { useState, useRef, useEffect } from "react";
import { Play, RefreshCw, Lock, Loader2 } from "lucide-react";

interface Props {
  /** Pre-computed iframe URL (direct or signed). */
  src: string;
  title?: string;
  /** When true, shows a "mock / dev preview" overlay instead of actually embedding. */
  mock?: boolean;
  /** Autoplay the video. Browsers usually require muted for autoplay. */
  autoplay?: boolean;
  /** Additional className applied to the outer wrapper. */
  className?: string;
}

/**
 * Cloudflare Stream embeds a bit differently from standard iframes:
 * – Supports `autoplay`, `muted`, `loop`, `controls` query params
 * – src = `https://iframe.cloudflarestream.com/{streamId or signedToken}`
 *
 * Mock mode renders a placeholder that matches the stream player's proportions
 * so layouts don't break during development without real Cloudflare credentials.
 */
export default function CloudflarePlayer({ src, title, mock = false, autoplay = false, className = "" }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [retries, setRetries] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the final src with optional query params
  const iframeSrc = (() => {
    try {
      const url = new URL(src);
      if (autoplay) url.searchParams.set("autoplay", "true");
      url.searchParams.set("controls", "true");
      return url.toString();
    } catch {
      return src;
    }
  })();

  // Detect if src looks like a mock (not a real CF stream URL or contains mock/test tokens)
  const isMockUrl =
    mock ||
    !src ||
    src.includes("mock") ||
    src.includes("undefined") ||
    src === "https://iframe.cloudflarestream.com/";

  useEffect(() => {
    if (!isMockUrl) setStatus("loading");
  }, [isMockUrl]);

  function handleLoad() {
    setStatus("ready");
  }

  function handleError() {
    setStatus("error");
  }

  function retry() {
    setRetries((r) => r + 1);
    setStatus("loading");
  }

  if (isMockUrl) {
    return (
      <MockPlayer title={title} className={className} />
    );
  }

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${className}`} style={{ aspectRatio: "16/9" }}>
      {/* Loading shimmer */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
          style={{ background: "#0D0D1A" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#A855F7" }} />
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Loading video…</p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
          style={{ background: "#0D0D1A" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#EF444422", border: "1px solid #EF4444" }}>
            <Lock className="w-6 h-6" style={{ color: "#EF4444" }} />
          </div>
          <div className="text-center px-6">
            <p className="text-sm font-medium mb-1" style={{ color: "#F0E6FF" }}>Unable to load video</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Check your connection or Cloudflare Stream configuration.
            </p>
          </div>
          {retries < 3 && (
            <button
              onClick={retry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "#2D2D4E", color: "#A855F7" }}
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Actual iframe */}
      <iframe
        key={retries}
        ref={iframeRef}
        src={iframeSrc}
        title={title ?? "Video Tutorial"}
        className="w-full h-full"
        style={{ opacity: status === "ready" ? 1 : 0, transition: "opacity 0.3s" }}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Purple glow border */}
      <div className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 1px rgba(124,58,237,0.3)" }} />
    </div>
  );
}

// ─── Mock / development placeholder ──────────────────────────────────────────

function MockPlayer({ title, className = "" }: { title?: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className={`relative rounded-xl overflow-hidden flex items-center justify-center ${className}`}
      style={{
        aspectRatio: "16/9",
        background: "linear-gradient(135deg, #13131F 0%, #1A1A2E 50%, #13131F 100%)",
        border: "1px solid rgba(124,58,237,0.3)",
        boxShadow: "0 0 30px rgba(124,58,237,0.15)",
      }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Shimmer lines */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #A855F7, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #7C3AED, transparent)" }} />

      {!playing ? (
        /* Play button overlay */
        <div className="relative z-10 flex flex-col items-center gap-4">
          <button
            onClick={() => setPlaying(true)}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #A855F7)",
              boxShadow: "0 0 30px rgba(168,85,247,0.5), 0 0 60px rgba(124,58,237,0.3)",
            }}
            aria-label="Play video"
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </button>
          <div className="text-center">
            {title && (
              <p className="text-sm font-medium mb-1" style={{ color: "#F0E6FF" }}>
                {title}
              </p>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
              style={{ background: "rgba(124,58,237,0.2)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.3)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Development Preview
            </span>
          </div>
        </div>
      ) : (
        /* "Playing" state — shows mock progress bar */
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6 p-8">
          {/* Fake waveform */}
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full animate-pulse"
                style={{
                  background: `linear-gradient(to top, #7C3AED, #A855F7)`,
                  height: `${20 + Math.sin(i * 0.8) * 40 + 20}%`,
                  animationDelay: `${i * 50}ms`,
                  animationDuration: `${600 + (i % 5) * 200}ms`,
                }}
              />
            ))}
          </div>

          {title && (
            <p className="text-sm font-medium" style={{ color: "#F0E6FF" }}>
              {title}
            </p>
          )}

          {/* Fake progress bar */}
          <div className="w-full max-w-sm">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#2D2D4E" }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #7C3AED, #A855F7)",
                  width: "35%",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs" style={{ color: "#6B7280" }}>
              <span>2:14</span>
              <span>6:32</span>
            </div>
          </div>

          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{ background: "rgba(124,58,237,0.2)", color: "#A855F7", border: "1px solid rgba(168,85,247,0.3)" }}
          >
            Development Preview — Connect Cloudflare Stream to play real video
          </span>
        </div>
      )}
    </div>
  );
}
