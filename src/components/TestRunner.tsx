"use client";

import { useState, useCallback } from "react";
import { Test, Question } from "@/lib/types";
import { cn, scorePercent } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle, RotateCcw } from "lucide-react";

interface TestResult {
  id: string;
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
}

export function TestRunner({ test }: { test: Test }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const question = test.questions[current];
  const totalQ = test.questions.length;
  const answered = Object.keys(answers).length;

  function selectAnswer(questionId: string, idx: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: idx }));
  }

  function skipQuestion(questionId: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: null }));
  }

  async function handleSubmit() {
    setLoading(true);
    const allAnswers: Record<string, number | null> = {};
    for (const q of test.questions) {
      allAnswers[q.id] = answers[q.id] ?? null;
    }

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_id: test.id, answers: allAnswers }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitted(true);
    setLoading(false);
  }

  function reset() {
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setResult(null);
    setStarted(false);
  }

  if (!started) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center space-y-4">
        <div className="text-5xl">📝</div>
        <h3 className="text-xl font-bold">{test.title}</h3>
        <p className="text-slate-400">
          {totalQ} preguntas · Responde a tu ritmo
        </p>
        <button
          onClick={() => setStarted(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Empezar Test
        </button>
      </div>
    );
  }

  if (submitted && result) {
    return <ResultView result={result} test={test} answers={answers} onReset={reset} />;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Pregunta {current + 1} de {totalQ}</span>
        <span>{answered} respondidas</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all"
          style={{ width: `${((current + 1) / totalQ) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={question}
        selected={answers[question.id]}
        submitted={false}
        onSelect={(idx) => selectAnswer(question.id, idx)}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        <div className="flex items-center gap-2">
          {current < totalQ - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Finalizar Test ✓"}
            </button>
          )}
        </div>
      </div>

      <QuestionNav
        questions={test.questions}
        answers={answers}
        current={current}
        onSelect={setCurrent}
      />
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  submitted,
  onSelect,
}: {
  question: Question;
  selected: number | null | undefined;
  submitted: boolean;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.text}</p>
      <div className="space-y-2">
        {question.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.correctIndex;

          let style = "border-slate-600 text-slate-300 hover:border-slate-400";
          if (submitted) {
            if (isCorrect) style = "border-green-500 bg-green-900/30 text-green-300";
            else if (isSelected && !isCorrect) style = "border-red-500 bg-red-900/30 text-red-300";
          } else if (isSelected) {
            style = "border-indigo-500 bg-indigo-900/30 text-white";
          }

          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              disabled={submitted}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                style
              )}
            >
              <span className="font-mono text-xs mr-3 opacity-60">
                {["A", "B", "C", "D"][idx]}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionNav({
  questions,
  answers,
  current,
  onSelect,
}: {
  questions: Question[];
  answers: Record<string, number | null>;
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="border-t border-slate-700 pt-4">
      <p className="text-xs text-slate-500 mb-2">Navegación rápida</p>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const ans = answers[q.id];
          const isCurrent = i === current;
          const isAnswered = ans !== undefined;
          const isSkipped = ans === null;

          return (
            <button
              key={q.id}
              onClick={() => onSelect(i)}
              className={cn(
                "w-8 h-8 rounded text-xs font-medium transition-colors",
                isCurrent
                  ? "bg-indigo-600 text-white"
                  : isSkipped
                  ? "bg-yellow-800/40 text-yellow-400 border border-yellow-700"
                  : isAnswered
                  ? "bg-slate-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultView({
  result,
  test,
  answers,
  onReset,
}: {
  result: TestResult;
  test: Test;
  answers: Record<string, number | null>;
  onReset: () => void;
}) {
  const [showReview, setShowReview] = useState(false);
  const pct = scorePercent(result.score, result.maxScore);

  const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "👍" : pct >= 40 ? "📚" : "💪";
  const color = pct >= 70 ? "text-green-400" : pct >= 40 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center space-y-4">
        <div className="text-5xl">{emoji}</div>
        <div>
          <p className={`text-4xl font-bold ${color}`}>{pct}%</p>
          <p className="text-slate-400 mt-1">
            {result.score.toFixed(1)} / {result.maxScore.toFixed(1)} puntos
          </p>
        </div>
        <div className="flex justify-center gap-6 text-sm">
          <div className="text-green-400">
            <CheckCircle2 size={16} className="inline mr-1" />
            {result.correct} correctas
          </div>
          <div className="text-red-400">
            <XCircle size={16} className="inline mr-1" />
            {result.wrong} incorrectas
          </div>
          <div className="text-slate-400">
            <MinusCircle size={16} className="inline mr-1" />
            {result.skipped} sin responder
          </div>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <RotateCcw size={15} /> Repetir Test
          </button>
          <button
            onClick={() => setShowReview(!showReview)}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
          >
            {showReview ? "Ocultar" : "Revisar respuestas"}
          </button>
        </div>
      </div>

      {showReview && (
        <div className="space-y-4">
          {test.questions.map((q, i) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctIndex;
            const isSkipped = userAns === null || userAns === undefined;

            return (
              <div
                key={q.id}
                className={cn(
                  "bg-slate-800 border rounded-xl p-5 space-y-3",
                  isCorrect
                    ? "border-green-700"
                    : isSkipped
                    ? "border-slate-600"
                    : "border-red-700"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 text-sm shrink-0">#{i + 1}</span>
                  <p className="text-sm font-medium">{q.text}</p>
                </div>
                <div className="space-y-1.5">
                  {q.options.map((opt, idx) => {
                    const isUserAnswer = userAns === idx;
                    const isRight = idx === q.correctIndex;
                    let style = "text-slate-400";
                    if (isRight) style = "text-green-400 font-medium";
                    else if (isUserAnswer && !isRight) style = "text-red-400 line-through";

                    return (
                      <p key={idx} className={`text-xs ${style}`}>
                        <span className="font-mono mr-2">{["A","B","C","D"][idx]}.</span>
                        {opt}
                        {isRight && " ✓"}
                        {isUserAnswer && !isRight && " ✗"}
                      </p>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="text-xs text-slate-400 bg-slate-700/50 rounded px-3 py-2">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
