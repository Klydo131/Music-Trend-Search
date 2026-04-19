"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A tiny "tap the beat" micro-game for the <5s loading window.
 * Pure fun, no network, no state persistence.
 */
const TIPS = [
  "Did you know? LRCLIB hosts open lyrics, and we're using it for free.",
  "Pro tip: tap the skin selector to switch between tape, CD, and VHS looks.",
  "Drag any MP3 onto the page — we'll play it, no uploads, no servers.",
  "Your playlists live on your device. Nothing leaves unless you say so.",
  "YouTube fills in full-length playback when Spotify gives us a preview.",
];

export default function FunLoader() {
  const [taps, setTaps] = useState(0);
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const rotateRef = useRef<number | null>(null);

  useEffect(() => {
    rotateRef.current = window.setInterval(
      () => setTipIdx((i) => (i + 1) % TIPS.length),
      2800,
    );
    return () => {
      if (rotateRef.current) clearInterval(rotateRef.current);
    };
  }, []);

  return (
    <div className="card p-4 md:p-5 text-center">
      <div className="flex items-center justify-center gap-1 mb-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="inline-block w-1.5 h-6 rounded-full bg-grape"
            style={{
              animation: `barPulse 1s ${i * 0.1}s ease-in-out infinite`,
              transformOrigin: "bottom",
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTaps((n) => n + 1)}
        className="btn-ghost"
      >
        Tap the beat while we load · {taps}
      </button>
      <p className="text-xs text-plum/70 mt-3">{TIPS[tipIdx]}</p>

      <style jsx>{`
        @keyframes barPulse {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
