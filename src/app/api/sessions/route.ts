import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { Question, ScoringConfig, TestSession } from "@/lib/types";

export async function GET(req: NextRequest) {
  const db = getDb();
  const testId = req.nextUrl.searchParams.get("testId");

  const query = testId
    ? `SELECT * FROM test_sessions WHERE test_id = ? ORDER BY completed_at DESC`
    : `SELECT * FROM test_sessions ORDER BY completed_at DESC`;

  const rows = testId
    ? (db.prepare(query).all(testId) as Array<TestSession & { answers: string }>)
    : (db.prepare(query).all() as Array<TestSession & { answers: string }>);

  const sessions = rows.map((r) => ({ ...r, answers: JSON.parse(r.answers) }));
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { test_id, answers } = body as { test_id: string; answers: Record<string, number | null> };

  const testRow = db.prepare(`SELECT questions FROM tests WHERE id = ?`).get(test_id) as
    | { questions: string }
    | undefined;
  if (!testRow) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const config = db
    .prepare(`SELECT correct_pts, wrong_pts, unanswered_pts FROM scoring_config WHERE id = 1`)
    .get() as ScoringConfig;

  const questions: Question[] = JSON.parse(testRow.questions);
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === null || answer === undefined) {
      skipped++;
    } else if (answer === q.correctIndex) {
      correct++;
    } else {
      wrong++;
    }
  }

  const score = correct * config.correct_pts + wrong * config.wrong_pts + skipped * config.unanswered_pts;
  const maxScore = questions.length * config.correct_pts;

  const id = uuidv4();
  db.prepare(
    `INSERT INTO test_sessions (id, test_id, answers, score, max_score, correct_count, wrong_count, skipped_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, test_id, JSON.stringify(answers), score, maxScore, correct, wrong, skipped);

  return NextResponse.json({ id, score, maxScore, correct, wrong, skipped });
}
