"use client";

export const SKIN_OPTIONS = [
  { id: "tape" as const, label: "Tape" },
  { id: "cd" as const, label: "CD" },
  { id: "vhs" as const, label: "VHS" },
];

export const COLOR_PRESETS = [
  { id: "cream", label: "Cream", value: "#FFF1C7", accent: "#6F4AB7" },
  { id: "peach", label: "Peach", value: "#FFD6A5", accent: "#6F4AB7" },
  { id: "grape", label: "Grape", value: "#C9B8F0", accent: "#3D2466" },
  { id: "mint", label: "Mint", value: "#C7F0D2", accent: "#6F4AB7" },
  { id: "sky", label: "Sky", value: "#B6DFF9", accent: "#3D2466" },
];

export type SkinId = (typeof SKIN_OPTIONS)[number]["id"];
export type ColorPreset = (typeof COLOR_PRESETS)[number];

type Props = {
  skin: SkinId;
  colorId: string;
  onSkinChange: (s: SkinId) => void;
  onColorChange: (c: string) => void;
};

export default function SkinPicker({ skin, colorId, onSkinChange, onColorChange }: Props) {
  return (
    <div className="card p-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-plum/70">Player</span>
        <div className="flex gap-1 p-1 rounded-full bg-white/60">
          {SKIN_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSkinChange(s.id)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                skin === s.id
                  ? "bg-grape text-white shadow"
                  : "text-plum/80 hover:bg-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-plum/70">Color</span>
        <div className="flex gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onColorChange(c.id)}
              aria-label={c.label}
              title={c.label}
              className={`w-7 h-7 rounded-full transition hover:scale-110 ${
                colorId === c.id ? "ring-2 ring-grape ring-offset-2" : ""
              }`}
              style={{ background: c.value }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function colorById(id: string): ColorPreset {
  return COLOR_PRESETS.find((c) => c.id === id) ?? COLOR_PRESETS[0];
}
