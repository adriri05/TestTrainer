import { getDb } from "@/lib/db";
import { Test, TestSession } from "@/lib/types";
import { notFound } from "next/navigation";
import { formatDate, scorePercent } from "@/lib/utils";
import { TestRunner } from "@/components/TestRunner";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";

function getTestData(id: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, title, description, questions, source_filename, created_at FROM tests WHERE id = ?`)
    .get(id) as (Omit<Test, "questions"> & { questions: string }) | undefined;

  if (!row) return null;

  const test: Test = { ...row, questions: JSON.parse(row.questions) };

  const sessions = db
    .prepare(
      `SELECT id, score, max_score, correct_count, wrong_count, skipped_count, completed_at
       FROM test_sessions WHERE test_id = ? ORDER BY completed_at DESC`
    )
    .all(id) as TestSession[];

  return { test, sessions };
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = getTestData(id);
  if (!data) notFound();
  const { test, sessions } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tests" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate">{test.title}</h2>
          <p className="text-slate-400 text-sm">
            {test.questions.length} preguntas · {sessions.length} intentos
            {test.source_filename && ` · ${test.source_filename}`}
          </p>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-indigo-400" />
            <h3 className="font-semibold text-sm">Historial de intentos</h3>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm py-2 border-b border-slate-700 last:border-0"
              >
                <span className="text-slate-400">{formatDate(s.completed_at)}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-400">✓ {s.correct_count}</span>
                  <span className="text-red-400">✗ {s.wrong_count}</span>
                  <span className="text-slate-500">— {s.skipped_count}</span>
                  <span
                    className={`font-bold ${
                      scorePercent(s.score, s.max_score) >= 70
                        ? "text-green-400"
                        : scorePercent(s.score, s.max_score) >= 40
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {s.score.toFixed(1)} / {s.max_score.toFixed(1)} ({scorePercent(s.score, s.max_score)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TestRunner test={test} />
    </div>
  );
}
