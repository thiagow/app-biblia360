import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, questions, questionOptions, resultProfiles, resultProfileBlocks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.projectId, project.id))
    .orderBy(asc(questions.orderIndex));

  const questionsWithOptions = await Promise.all(
    qs.map(async (q) => {
      const opts = await db
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, q.id))
        .orderBy(asc(questionOptions.orderIndex));
      return { ...q, options: opts };
    })
  );

  const profiles = await db
    .select()
    .from(resultProfiles)
    .where(eq(resultProfiles.projectId, project.id));

  const profilesWithBlocks = await Promise.all(
    profiles.map(async (p) => {
      const blocks = await db
        .select()
        .from(resultProfileBlocks)
        .where(eq(resultProfileBlocks.profileId, p.id))
        .orderBy(asc(resultProfileBlocks.orderIndex));
      return { ...p, blocks };
    })
  );

  return NextResponse.json({
    project,
    questions: questionsWithOptions,
    profiles: profilesWithBlocks,
  });
}
