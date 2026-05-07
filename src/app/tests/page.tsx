import { getDb } from "@/lib/db";
import { Test, TestSession } from "@/lib/types";
import { formatDate, scorePercent } from "@/lib/utils";
import Link from "next/link";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { DeleteTestButton } from "@/components/DeleteTestButton";

function getTests() {
  const db = getDb();
  const tests = db
    .prepare(`SELECT id, title, description, source_filename, created_at,
               (SELECT COUNT(*) FROM test_sessions WHERE test_id = tests.id) as session_count,
               (SELECT questions FROM tests t2 WHERE t2.id = tests.id) as questions_json
             FROM tests ORDER BY created_at DESC`)
    .all() as Array<Test & { session_count: number; questions_json: string }>;

  return tests.map((t) => {
    const lastSession = db
      .prepare(
        `SELECT score, max_score FROM test_sessions WHERE test_id = ? ORDER BY completed_at DESC LIMIT 1`
      )
      .get(t.id) as Pick<TestSession, "score" | "max_score"> | undefined;

    const questionCount = (() => {
      try { return JSON.parse(t.questions_json).length; } catch { return 0; }
    })();

    return { ...t, lastSession, questionCount };
  });
}

export default function TestsPage() {
  const tests = getTests();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mis Tests</h2>
          <p className="text-slate-400 text-sm mt-1">{tests.length} tests guardados</p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nuevo Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">No tienes tests todavía</p>
          <Link href="/upload" className="text-indigo-400 hover:underline text-sm mt-2 inline-block">
            Crear tu primer test →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between group hover:border-slate-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link href={`/tests/${test.id}`} className="hover:text-indigo-300 transition-colors">
                  <h3 className="font-semibold truncate">{test.title}</h3>
                </Link>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  <span>{test.questionCount} preguntas</span>
                  <span>{test.session_count} intentos</span>
                  {test.source_filename && <span>📄 {test.source_filename}</span>}
                  <span>{formatDate(test.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                {test.lastSession && (
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Último</p>
                    <p
                      className={`text-sm font-bold ${
                        scorePercent(test.lastSession.score, test.lastSession.max_score) >= 70
                          ? "text-green-400"
                          : scorePercent(test.lastSession.score, test.lastSession.max_score) >= 40
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {scorePercent(test.lastSession.score, test.lastSession.max_score)}%
                    </p>
                  </div>
                )}
                <Link
                  href={`/tests/${test.id}`}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Empezar
                </Link>
                <DeleteTestButton id={test.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
