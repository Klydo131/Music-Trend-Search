"use client";

import { useState } from "react";
import { submitFeedback } from "@/lib/feedback";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "queued">("idle");

  const send = async () => {
    if (rating === 0) return;
    setStatus("sending");
    const result = await submitFeedback(rating, comment);
    setStatus(result === "remote" ? "done" : "queued");
    setTimeout(() => {
      setOpen(false);
      setStatus("idle");
      setRating(0);
      setComment("");
    }, 2000);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 btn-primary shadow-pop"
      >
        Rate Loopline
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Feedback"
      className="fixed bottom-5 right-5 z-50 card p-4 w-[320px] animate-fade-up"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg font-bold text-plum">How's it going?</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-plum/60 hover:text-plum text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="text-3xl leading-none transition"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <span style={{ color: (hover || rating) >= n ? "#FFB584" : "#d9d1e8" }}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        className="input min-h-[72px] text-sm"
        placeholder="What would make Loopline better? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
      />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-plum/60">
          {status === "done"
            ? "Thanks! Sent."
            : status === "queued"
              ? "Saved locally — we'll sync later."
              : `${comment.length}/2000`}
        </span>
        <button
          type="button"
          className="btn-primary"
          disabled={rating === 0 || status === "sending"}
          onClick={send}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
