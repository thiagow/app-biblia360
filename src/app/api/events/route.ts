import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

const schema = z.object({
  projectSlug: z.string().min(1),
  sessionId: z.string().min(1).max(100),
  eventType: z.enum([
    "page_view",
    "quiz_start",
    "question_answer",
    "quiz_complete",
    "lead_capture",
    "result_view",
    "cta_click",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  leadId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  // Respond immediately — fire-and-forget from client perspective
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 202 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 202 });

  const { projectSlug, sessionId, eventType, metadata, leadId } = parsed.data;
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? null;
  const userAgent = hdrs.get("user-agent") ?? null;

  // Non-blocking insert — don't await in the response path
  (async () => {
    try {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, projectSlug))
        .limit(1);

      if (!project) return;

      await db.insert(analyticsEvents).values({
        projectId: project.id,
        leadId: leadId ?? null,
        sessionId,
        eventType,
        metadata: metadata ?? null,
        ipAddress: ip,
        userAgent,
      });
    } catch {
      // silently swallow analytics errors
    }
  })();

  return new NextResponse(null, { status: 202 });
}
