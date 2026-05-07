import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getProviderInfo } from "@/lib/ai-provider";
import { ScoringConfig } from "@/lib/types";

export async function GET() {
  const db = getDb();
  const config = db
    .prepare(`SELECT correct_pts, wrong_pts, unanswered_pts FROM scoring_config WHERE id = 1`)
    .get() as ScoringConfig;

  return NextResponse.json({ scoring: config, ai: getProviderInfo() });
}

export async function PUT(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { correct_pts, wrong_pts, unanswered_pts } = body as ScoringConfig;

  if (typeof correct_pts !== "number" || typeof wrong_pts !== "number" || typeof unanswered_pts !== "number") {
    return NextResponse.json({ error: "Invalid scoring values" }, { status: 400 });
  }

  db.prepare(
    `UPDATE scoring_config SET correct_pts = ?, wrong_pts = ?, unanswered_pts = ? WHERE id = 1`
  ).run(correct_pts, wrong_pts, unanswered_pts);

  return NextResponse.json({ success: true });
}
