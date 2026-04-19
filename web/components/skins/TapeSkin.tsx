"use client";

type Props = {
  color: string;
  accent: string;
  playing: boolean;
  label?: string;
};

/**
 * Retro cassette tape skin. Reels spin while playing.
 */
export default function TapeSkin({ color, accent, playing, label }: Props) {
  return (
    <div
      className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${color} 0%, ${shade(color, -8)} 100%)`,
        boxShadow: "inset 0 6px 18px rgba(0,0,0,0.15), 0 10px 30px -10px rgba(0,0,0,0.3)",
      }}
    >
      {/* label */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 w-[70%] h-[28%] rounded-md flex items-center justify-center px-3 text-center"
        style={{ background: "rgba(255,255,255,0.92)", color: "var(--ink)" }}
      >
        <span className="truncate font-display font-bold text-sm md:text-base">
          {label || "Side A · Mixtape"}
        </span>
      </div>

      {/* tape window */}
      <div
        className="absolute inset-x-6 bottom-5 top-[45%] rounded-xl flex items-center justify-around px-6"
        style={{ background: "rgba(20,10,30,0.85)" }}
      >
        <Reel playing={playing} accent={accent} />
        <div className="flex-1 h-[6px] mx-4 rounded-full" style={{ background: "#5c4a2e", opacity: 0.8 }} />
        <Reel playing={playing} accent={accent} />
      </div>
    </div>
  );
}

function Reel({ playing, accent }: { playing: boolean; accent: string }) {
  return (
    <div
      className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center ${playing ? "animate-spin" : ""}`}
      style={{ background: "#2a1b3d", border: `3px solid ${accent}` }}
    >
      <div className="w-6 h-6 rounded-full" style={{ background: accent }} />
      <div className="absolute w-1 h-10 md:h-12" style={{ background: accent, opacity: 0.35 }} />
      <div
        className="absolute w-1 h-10 md:h-12"
        style={{ background: accent, opacity: 0.35, transform: "rotate(60deg)" }}
      />
      <div
        className="absolute w-1 h-10 md:h-12"
        style={{ background: accent, opacity: 0.35, transform: "rotate(120deg)" }}
      />
    </div>
  );
}

function shade(hex: string, amt: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
