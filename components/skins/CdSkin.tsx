"use client";

type Props = {
  color: string;
  accent: string;
  playing: boolean;
  label?: string;
};

/**
 * CD player / disc skin. The disc spins while playing.
 */
export default function CdSkin({ color, accent, playing, label }: Props) {
  return (
    <div
      className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -10)} 100%)`,
        boxShadow: "inset 0 4px 14px rgba(0,0,0,0.15), 0 10px 30px -10px rgba(0,0,0,0.3)",
      }}
    >
      {/* disc */}
      <div
        className={`relative w-[70%] aspect-square rounded-full ${playing ? "animate-spin-slow" : ""}`}
        style={{
          background:
            "conic-gradient(from 0deg, #e9e3f5, #b9a8dc, #e9e3f5, #b9a8dc, #e9e3f5)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(0,0,0,0.08)",
        }}
      >
        {/* rainbow ring */}
        <div
          className="absolute inset-[14%] rounded-full"
          style={{
            background:
              "conic-gradient(from 30deg, #ffd6a5, #c7f0d2, #b6dff9, #e6d4ff, #ffd6a5)",
            filter: "saturate(0.8) brightness(1.05)",
          }}
        />
        {/* center hub */}
        <div
          className="absolute inset-[40%] rounded-full flex items-center justify-center"
          style={{ background: accent }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: "#fff" }} />
        </div>
      </div>

      {/* label card */}
      <div
        className="absolute bottom-3 left-3 right-3 md:left-6 md:right-6 rounded-xl px-3 py-1.5 text-center"
        style={{ background: "rgba(255,255,255,0.88)", color: "var(--ink)" }}
      >
        <span className="truncate font-display text-sm md:text-base font-bold">
          {label || "Now spinning"}
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
