"use client";

import { useCallback, useRef, useState } from "react";
import { detectSource, humanizeSourceError, type Source } from "@/lib/safeUrl";

type Props = {
  onLoad: (source: Source) => void;
  onError: (message: string) => void;
};

export default function UrlInput({ onLoad, onError }: Props) {
  const [value, setValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(() => {
    const source = detectSource(value);
    if (source.kind === "unknown") {
      onError(humanizeSourceError(value));
      return;
    }
    onLoad(source);
  }, [value, onLoad, onError]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!/audio\/(mpeg|mp3|wav|ogg|x-m4a|mp4)/i.test(file.type) &&
          !/\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
        onError(`"${file.name}" isn't a format we play yet. Try MP3, WAV, OGG, or M4A.`);
        return;
      }
      onLoad({ kind: "mp3", file });
    },
    [onLoad, onError],
  );

  return (
    <div
      className={`card p-4 md:p-5 transition ${dragging ? "ring-4 ring-grape/40 scale-[1.01]" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <label className="block text-sm font-bold text-plum/80 mb-2">
        Paste a link or drop a song
      </label>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="url"
          className="input flex-1"
          placeholder="https://youtube.com/... or https://open.spotify.com/track/..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          aria-label="Music link"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" className="btn-primary" onClick={submit}>
          Play
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => fileRef.current?.click()}
        >
          Upload MP3
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <p className="mt-2 text-xs text-plum/60">
        Works with YouTube and Spotify links. Or drag your own song right onto this card.
      </p>
    </div>
  );
}
