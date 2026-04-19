"use client";

type Props = {
  message: string;
  onDismiss?: () => void;
};

/**
 * Every error shown to the user is explained in plain language — no stack
 * traces, no HTTP codes, no server internals.
 */
export default function FriendlyError({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className="card p-4 border-2 flex items-start gap-3"
      style={{ borderColor: "#e89ba0", background: "rgba(255, 220, 224, 0.6)" }}
    >
      <div className="text-2xl" aria-hidden>🎶</div>
      <div className="flex-1">
        <p className="font-bold text-ink">Hmm, something tripped us up.</p>
        <p className="text-sm text-plum/80 mt-0.5">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-plum/60 hover:text-plum text-xl leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
