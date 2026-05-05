"use client";

import type { EventType } from "@/db/schema";

function getSessionId(): string {
  const key = "quiz_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
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
