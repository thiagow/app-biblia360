import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, analyticsEvents, projects } from "@/db/schema";
import { eq, gte, sql, and, count } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7 = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  const last30 = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);

  const projectFilter = projectId ? eq(leads.projectId, projectId) : undefined;
  const eventProjectFilter = projectId ? eq(analyticsEvents.projectId, projectId) : undefined;

  const [leadsToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(projectFilter ? and(projectFilter, gte(leads.createdAt, today)) : gte(leads.createdAt, today));

  const [leads7d] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(projectFilter ? and(projectFilter, gte(leads.createdAt, last7)) : gte(leads.createdAt, last7));

  const [leads30d] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(projectFilter ? and(projectFilter, gte(leads.createdAt, last30)) : gte(leads.createdAt, last30));

  const [pageViews7d] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eventProjectFilter ?? undefined,
        eq(analyticsEvents.eventType, "page_view"),
        gte(analyticsEvents.createdAt, last7)
      )
    );

  const [ctaClicks7d] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(analyticsEvents)
    .where(
      and(
        eventProjectFilter ?? undefined,
        eq(analyticsEvents.eventType, "cta_click"),
        gte(analyticsEvents.createdAt, last7)
      )
    );

  // Funnel: count unique sessions per event type
  const funnelEvents = ["page_view", "quiz_start", "quiz_complete", "lead_capture", "cta_click"];
  const funnelData = await Promise.all(
    funnelEvents.map(async (et) => {
      const [{ count: c }] = await db
        .select({ count: sql<number>`count(distinct session_id)::int` })
        .from(analyticsEvents)
        .where(
          and(
            eventProjectFilter ?? undefined,
            eq(analyticsEvents.eventType, et),
            gte(analyticsEvents.createdAt, last30)
          )
        );
      return { event: et, sessions: c };
    })
  );

  // Profile distribution
  const profileDist = await db
    .select({
      profileId: leads.profileId,
      count: sql<number>`count(*)::int`,
    })
    .from(leads)
    .where(projectFilter ? and(projectFilter, gte(leads.createdAt, last30)) : gte(leads.createdAt, last30))
    .groupBy(leads.profileId);

  // Score distribution (buckets 0-5, 6-10, 11-21)
  const scoreDist = await db
    .select({
      bucket: sql<string>`case when score <= 5 then '0-5' when score <= 10 then '6-10' else '11-21' end`,
      count: sql<number>`count(*)::int`,
    })
    .from(leads)
    .where(projectFilter ? and(projectFilter, gte(leads.createdAt, last30)) : gte(leads.createdAt, last30))
    .groupBy(sql`case when score <= 5 then '0-5' when score <= 10 then '6-10' else '11-21' end`);

  const allProjects = await db.select({ id: projects.id, name: projects.name, slug: projects.slug }).from(projects);

  return NextResponse.json({
    leadsToday: leadsToday.count,
    leads7d: leads7d.count,
    leads30d: leads30d.count,
    pageViews7d: pageViews7d.count,
    ctaClicks7d: ctaClicks7d.count,
    conversionRate: pageViews7d.count > 0
      ? Math.round((ctaClicks7d.count / pageViews7d.count) * 1000) / 10
      : 0,
    funnel: funnelData,
    profileDistribution: profileDist,
    scoreDistribution: scoreDist,
    projects: allProjects,
  });
}
