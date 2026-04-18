/**
 * Feedback + rating submission.
 *
 * Strategy: try Supabase REST directly (no SDK needed — keeps the bundle
 * tiny). Falls back to localStorage queue if Supabase env vars aren't set
 * or the network fails, so feedback is never lost.
 */

export type Feedback = {
  rating: number;          // 1-5
  comment: string;
  sessionId: string;
  userAgent: string;
  createdAt: string;       // ISO
};

const LOCAL_QUEUE = "loopline.feedback.queue.v1";
const SESSION_KEY = "loopline.session.v1";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function submitFeedback(rating: number, comment: string): Promise<"remote" | "queued"> {
  const payload: Feedback = {
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    comment: comment.trim().slice(0, 2000),
    sessionId: getSessionId(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
    createdAt: new Date().toISOString(),
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    try {
      const res = await fetch(`${url}/rest/v1/feedback`, {
        method: "POST",
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          rating: payload.rating,
          comment: payload.comment,
          session_id: payload.sessionId,
          user_agent: payload.userAgent,
        }),
      });
      if (res.ok) return "remote";
    } catch {
      /* fall through to queue */
    }
  }

  queueLocally(payload);
  return "queued";
}

function queueLocally(fb: Feedback): void {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(window.localStorage.getItem(LOCAL_QUEUE) || "[]");
    existing.push(fb);
    window.localStorage.setItem(LOCAL_QUEUE, JSON.stringify(existing.slice(-50)));
  } catch {
    /* ignore */
  }
}

export function readLocalQueue(): Feedback[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_QUEUE) || "[]");
  } catch {
    return [];
  }
}
