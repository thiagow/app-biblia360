import { notFound } from "next/navigation";
import { QuizShell } from "@/components/quiz/QuizShell";
import type { Metadata } from "next";

interface QuizData {
  project: { id: string; slug: string; name: string };
  questions: unknown[];
  profiles: unknown[];
}

async function getQuiz(slug: string): Promise<QuizData | null> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/quiz/${slug}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getQuiz(slug);
  if (!data) return {};
  return {
    title: data.project.name,
    description: "Descubra seu nível de entendimento da Bíblia em 7 perguntas.",
  };
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getQuiz(slug);
  if (!data) notFound();

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <QuizShell data={data as any} />
    </main>
  );
}
