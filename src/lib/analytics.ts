"use client";

import type { EventType } from "@/db/schema";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getSessionId(): string {
  const key = "quiz_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function track(
  projectSlug: string,
  eventType: EventType,
  metadata?: Record<string, unknown>,
  leadId?: string
) {
  const payload = {
    projectSlug,
    eventType,
    metadata,
    leadId,
    sessionId: getSessionId(),
  };

  // fire-and-forget — never await in the critical path
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // analytics failures are silent
  });
}
