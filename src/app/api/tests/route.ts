import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Test } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, title, description, questions, source_filename, created_at FROM tests ORDER BY created_at DESC`)
    .all() as Array<Omit<Test, "questions"> & { questions: string }>;

  const tests = rows.map((r) => ({
    ...r,
    questions: JSON.parse(r.questions),
  }));

  return NextResponse.json(tests);
}

export async function DELETE() {
  return NextResponse.json({ error: "Use /api/tests/[id]" }, { status: 405 });
}
