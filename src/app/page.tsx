import { getDb } from "@/lib/db";
import { Test, TestSession } from "@/lib/types";
import { formatDate, scorePercent } from "@/lib/utils";
import Link from "next/link";
import { ScoreChart } from "@/components/ScoreChart";

function getDashboardData() {
  const db = getDb();

  const tests = db
    .prepare(`SELECT id, title, created_at FROM tests ORDER BY created_at DESC LIMIT 5`)
    .all() as Test[];

  const sessions = db
    .prepare(
      `SELECT ts.*, t.title as test_title
       FROM test_sessions ts
       JOIN tests t ON ts.test_id = t.id
       ORDER BY ts.completed_at DESC
       LIMIT 20`
    )
    .all() as (TestSession & { test_title: string })[];

  const totalTests = (db.prepare(`SELECT COUNT(*) as c FROM tests`).get() as { c: number }).c;
  const totalSessions = (db.prepare(`SELECT COUNT(*) as c FROM test_sessions`).get() as { c: number }).c;
  const avgScore =
    totalSessions > 0
      ? (
          db
            .prepare(`SELECT AVG(score * 1.0 / max_score) as avg FROM test_sessions WHERE max_score > 0`)
            .get() as { avg: number }
        ).avg
      : 0;

  return { tests, sessions, totalTests, totalSessions, avgScore };
}

export default function DashboardPage() {
  const { tests, sessions, totalTests, totalSessions, avgScore } = getDashboardData();

  const chartData = sessions
    .slice()
    .reverse()
    .map((s) => ({
      date: formatDate(s.completed_at),
      pct: scorePercent(s.score, s.max_score),
      title: s.test_title,
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Resumen de tu progreso</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Tests creados" value={totalTests} />
        <StatCard label="Sesiones completadas" value={totalSessions} />
        <StatCard label="Nota media" value={`${Math.round((avgScore ?? 0) * 100)}%`} />
      </div>

      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="font-semibold mb-4">Evolución de puntuaciones</h3>
          <ScoreChart data={chartData} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Tests recientes</h3>
            <Link href="/tests" className="text-xs text-indigo-400 hover:underline">
              Ver todos →
            </Link>
          </div>
          {tests.length === 0 ? (
            <p className="text-slate-400 text-sm">
              Sin tests.{" "}
              <Link href="/upload" className="text-indigo-400 hover:underline">
                Crear uno
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {tests.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tests/${t.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{formatDate(t.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="font-semibold mb-4">Últimas sesiones</h3>
          {sessions.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin sesiones aún.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50">
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]">{s.test_title}</p>
                    <p className="text-xs text-slate-400">{formatDate(s.completed_at)}</p>
                  </div>
                  <ScoreBadge score={s.score} maxScore={s.max_score} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1 text-indigo-400">{value}</p>
    </div>
  );
}

function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = scorePercent(score, maxScore);
  const color = pct >= 70 ? "text-green-400" : pct >= 40 ? "text-yellow-400" : "text-red-400";
  return (
    <span className={`text-sm font-bold ${color}`}>
      {score.toFixed(1)}/{maxScore.toFixed(1)}
    </span>
  );
}
