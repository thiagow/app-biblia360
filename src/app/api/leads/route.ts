import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads, leadAnswers, projects, resultProfiles } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { headers } from "next/headers";

const schema = z.object({
  projectSlug: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  score: z.number().int().min(0).max(100),
  profileId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      optionId: z.string().uuid(),
    })
  ),
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  // Rate limit: 3 leads per IP per hour
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? null;

  if (ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(
        and(
          eq(leads.ipAddress, ip),
          gte(leads.createdAt, oneHourAgo)
        )
      );

    if (count >= 3) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 422 });
  }

  const { projectSlug, name, email, score, profileId, answers } = parsed.data;
  const userAgent = hdrs.get("user-agent") ?? null;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.slug, projectSlug))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [profile] = await db
    .select({ id: resultProfiles.id })
    .from(resultProfiles)
    .where(and(eq(resultProfiles.id, profileId), eq(resultProfiles.projectId, project.id)))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [lead] = await db.transaction(async (tx) => {
    const [newLead] = await tx
      .insert(leads)
      .values({
        projectId: project.id,
        profileId: profile.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        score,
        ipAddress: ip,
        userAgent,
      })
      .returning();

    if (answers.length > 0) {
      await tx.insert(leadAnswers).values(
        answers.map((a) => ({
          leadId: newLead.id,
          questionId: a.questionId,
          optionId: a.optionId,
        }))
      );
    }

    return [newLead];
  });

  return NextResponse.json({ leadId: lead.id }, { status: 201 });
}
