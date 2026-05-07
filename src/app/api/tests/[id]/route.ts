import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Test } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const row = db
    .prepare(`SELECT id, title, description, questions, source_filename, created_at FROM tests WHERE id = ?`)
    .get(id) as (Omit<Test, "questions"> & { questions: string }) | undefined;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...row, questions: JSON.parse(row.questions) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const info = db.prepare(`DELETE FROM tests WHERE id = ?`).run(id);
  if (info.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
