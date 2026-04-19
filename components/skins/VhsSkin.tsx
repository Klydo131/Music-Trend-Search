"use client";

type Props = {
  color: string;
  accent: string;
  playing: boolean;
  label?: string;
};

/**
 * VHS tape skin. Scanlines + glow when playing.
 */
export default function VhsSkin({ color, accent, playing, label }: Props) {
  return (
    <div
      className={`relative w-full aspect-[16/9] rounded-3xl overflow-hidden ${playing ? "animate-vhs-glow" : ""}`}
      style={{
        background: `linear-gradient(160deg, ${color} 0%, ${shade(color, -15)} 100%)`,
        boxShadow: "inset 0 6px 18px rgba(0,0,0,0.25), 0 10px 30px -10px rgba(0,0,0,0.35)",
      }}
    >
      {/* scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.35) 0 2px, transparent 2px 4px)",
        }}
      />
      {/* screen */}
      <div
        className="absolute inset-x-6 top-6 bottom-[40%] rounded-xl flex items-center justify-center px-3"
        style={{
          background: "rgba(10,5,20,0.92)",
          border: `2px solid ${accent}`,
        }}
      >
        <span
          className="font-display font-bold text-2xl md:text-4xl tracking-widest"
          style={{ color: accent, textShadow: `0 0 12px ${accent}` }}
        >
          ▶ REC
        </span>
      </div>
      {/* tape label */}
      <div
        className="absolute inset-x-6 bottom-4 top-[65%] rounded-lg flex items-center justify-center px-3"
        style={{ background: "rgba(255,255,255,0.9)", color: "var(--ink)" }}
      >
        <span className="truncate font-display font-bold text-sm md:text-base">
          {label || "VHS · Home Recording"}
        </span>
      </div>
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
