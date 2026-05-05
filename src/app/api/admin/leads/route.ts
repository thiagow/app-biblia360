import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, resultProfiles, projects } from "@/db/schema";
import { eq, desc, and, ilike, sql } from "drizzle-orm";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const projectId = searchParams.get("projectId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const format = searchParams.get("format");

  const conditions = [];
  if (projectId) conditions.push(eq(leads.projectId, projectId));
  if (search) conditions.push(ilike(leads.email, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  if (format === "csv") {
    const rows = await db
      .select({
        name: leads.name,
        email: leads.email,
        score: leads.score,
        profile: resultProfiles.name,
        project: projects.slug,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .leftJoin(resultProfiles, eq(leads.profileId, resultProfiles.id))
      .leftJoin(projects, eq(leads.projectId, projects.id))
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(10000);

    const header = "Nome,Email,Score,Perfil,Projeto,Data\n";
    const csvRows = rows.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.email}"`,
        r.score,
        `"${r.profile ?? ""}"`,
        `"${r.project ?? ""}"`,
        r.createdAt.toISOString(),
      ].join(",")
    );

    return new NextResponse(header + csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"`,
      },
    });
  }

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(leads)
    .where(where);

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      score: leads.score,
      profile: resultProfiles.name,
      badge: resultProfiles.badge,
      project: projects.slug,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .leftJoin(resultProfiles, eq(leads.profileId, resultProfiles.id))
    .leftJoin(projects, eq(leads.projectId, projects.id))
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return NextResponse.json({
    leads: rows,
    total,
    page,
    pages: Math.ceil(total / PAGE_SIZE),
  });
}
