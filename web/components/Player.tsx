"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Source } from "@/lib/safeUrl";
import { loadYouTubeApi, type YTPlayer } from "@/lib/youtube";
import { formatTime } from "@/lib/format";
import TapeSkin from "./skins/TapeSkin";
import CdSkin from "./skins/CdSkin";
import VhsSkin from "./skins/VhsSkin";
import SkinPicker, { colorById, type SkinId } from "./SkinPicker";
import LyricsKaraoke from "./LyricsKaraoke";
import FunLoader from "./FunLoader";

type Props = {
  source: Source;
  onError: (msg: string) => void;
  label?: string;
  onTrackInfo?: (info: { title?: string; artist?: string }) => void;
};

export default function Player({ source, onError, label, onTrackInfo }: Props) {
  const [skin, setSkin] = useState<SkinId>("tape");
  const [colorId, setColorId] = useState("peach");
  const color = colorById(colorId);

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(source.kind !== "spotify");
  const [karaoke, setKaraoke] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytRef = useRef<YTPlayer | null>(null);
  const ytTickRef = useRef<number | null>(null);

  // ── MP3 engine ──
  useEffect(() => {
    if (source.kind !== "mp3") return;
    const audio = new Audio();
    audio.preload = "auto";
    const url = URL.createObjectURL(source.file);
    audio.src = url;
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration);
      setLoading(false);
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => setPlaying(false);
    const onErr = () =>
      onError("Couldn't play that file. It might be corrupted or an unsupported codec.");

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);

    // hint title from filename
    const guessTitle = source.file.name.replace(/\.[^.]+$/, "");
    onTrackInfo?.({ title: guessTitle });

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [source, onError, onTrackInfo]);

  // ── YouTube engine ──
  useEffect(() => {
    if (source.kind !== "youtube") return;
    let cancelled = false;

    const mount = document.getElementById("yt-mount");
    if (!mount) return;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      const player = new window.YT.Player(mount, {
        videoId: source.id,
        width: "100%",
        height: "100%",
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            ytRef.current = e.target;
            setDuration(e.target.getDuration());
            setLoading(false);
          },
          onStateChange: (e) => {
            if (!window.YT) return;
            const s = e.data;
            if (s === window.YT.PlayerState.PLAYING) {
              setPlaying(true);
              ytTickRef.current = window.setInterval(() => {
                if (ytRef.current) {
                  setCurrentTime(ytRef.current.getCurrentTime());
                  setDuration(ytRef.current.getDuration());
                }
              }, 250);
            } else if (
              s === window.YT.PlayerState.PAUSED ||
              s === window.YT.PlayerState.ENDED
            ) {
              setPlaying(false);
              if (ytTickRef.current) {
                clearInterval(ytTickRef.current);
                ytTickRef.current = null;
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (ytTickRef.current) clearInterval(ytTickRef.current);
      ytTickRef.current = null;
      try {
        ytRef.current?.destroy();
      } catch {
        /* no-op */
      }
      ytRef.current = null;
    };
  }, [source]);

  // ── Controls ──
  const play = useCallback(() => {
    if (source.kind === "mp3") {
      audioRef.current?.play().catch(() => {
        onError("Your browser blocked autoplay. Tap play again to start.");
      });
      setPlaying(true);
    } else if (source.kind === "youtube") {
      ytRef.current?.playVideo();
    }
  }, [source, onError]);

  const pause = useCallback(() => {
    if (source.kind === "mp3") {
      audioRef.current?.pause();
      setPlaying(false);
    } else if (source.kind === "youtube") {
      ytRef.current?.pauseVideo();
    }
  }, [source]);

  const seek = useCallback(
    (t: number) => {
      if (source.kind === "mp3" && audioRef.current) {
        audioRef.current.currentTime = t;
        setCurrentTime(t);
      } else if (source.kind === "youtube" && ytRef.current) {
        ytRef.current.seekTo(t, true);
        setCurrentTime(t);
      }
    },
    [source],
  );

  const sourceLabel = useMemo(() => {
    if (label) return label;
    if (source.kind === "mp3") return source.file.name.replace(/\.[^.]+$/, "");
    if (source.kind === "youtube") return "YouTube track";
    if (source.kind === "spotify") return "Spotify preview";
    return "No track";
  }, [source, label]);

  // ── Render ──
  return (
    <div className="flex flex-col gap-4">
      <SkinPicker
        skin={skin}
        colorId={colorId}
        onSkinChange={setSkin}
        onColorChange={setColorId}
      />

      <div className="relative">
        {/* skin visuals */}
        <div className="relative">
          {skin === "tape" && (
            <TapeSkin
              color={color.value}
              accent={color.accent}
              playing={playing}
              label={sourceLabel}
            />
          )}
          {skin === "cd" && (
            <CdSkin
              color={color.value}
              accent={color.accent}
              playing={playing}
              label={sourceLabel}
            />
          )}
          {skin === "vhs" && (
            <VhsSkin
              color={color.value}
              accent={color.accent}
              playing={playing}
              label={sourceLabel}
            />
          )}
        </div>

        {/* YouTube invisible mount — iframe plays audio but we hide video */}
        {source.kind === "youtube" && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-0"
          >
            <div id="yt-mount" className="w-full h-full" />
          </div>
        )}
      </div>

      {/* Spotify embed path — lives separately because the SDK is closed */}
      {source.kind === "spotify" && (
        <div className="card overflow-hidden p-0">
          <iframe
            title="Spotify preview"
            src={`https://open.spotify.com/embed/${source.kindOf}/${source.id}?utm_source=loopline`}
            width="100%"
            height="152"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            loading="lazy"
            style={{ border: 0 }}
          />
          <div className="p-3 text-xs text-plum/70 bg-white/60">
            Spotify only plays a 30-second preview for free accounts.{" "}
            <a
              className="font-bold text-grape underline"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                (label || "music").slice(0, 120),
              )}`}
            >
              Find the full version on YouTube →
            </a>
          </div>
        </div>
      )}

      {/* transport controls (mp3 + youtube) */}
      {source.kind !== "spotify" && (
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={playing ? pause : play}
              disabled={loading}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <div className="text-sm tabular-nums text-plum/80 font-semibold">
              {formatTime(currentTime)} <span className="opacity-50">/</span> {formatTime(duration)}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-bold text-plum/70">
                <input
                  type="checkbox"
                  className="mr-1 accent-grape"
                  checked={karaoke}
                  onChange={(e) => setKaraoke(e.target.checked)}
                />
                Karaoke
              </label>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full accent-grape"
            aria-label="Seek"
            disabled={loading || duration <= 0}
          />
        </div>
      )}

      {loading && source.kind !== "spotify" && <FunLoader />}

      {karaoke && source.kind !== "spotify" && (
        <LyricsKaraoke
          source={source}
          currentTime={currentTime}
          label={label}
        />
      )}
    </div>
  );
}
