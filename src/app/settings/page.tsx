"use client";

import { useState, useEffect } from "react";
import { Save, Info } from "lucide-react";

interface Settings {
  scoring: { correct_pts: number; wrong_pts: number; unanswered_pts: number };
  ai: { provider: string; model: string };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [correct, setCorrect] = useState(1);
  const [wrong, setWrong] = useState(0);
  const [unanswered, setUnanswered] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
        setCorrect(data.scoring.correct_pts);
        setWrong(data.scoring.wrong_pts);
        setUnanswered(data.scoring.unanswered_pts);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correct_pts: correct, wrong_pts: wrong, unanswered_pts: unanswered }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const exampleMax = 10 * correct;
  const exampleScore = 7 * correct + 2 * wrong + 1 * unanswered;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="text-slate-400 text-sm mt-1">Sistema de puntuación y proveedor de IA</p>
      </div>

      {settings && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🤖</span>
            <h3 className="font-semibold">Proveedor de IA activo</h3>
          </div>
          <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-4 py-3">
            <div>
              <p className="font-medium capitalize">{settings.ai.provider}</p>
              <p className="text-xs text-slate-400">{settings.ai.model}</p>
            </div>
            <span className="ml-auto text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700">
              activo
            </span>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 bg-slate-700/30 rounded-lg px-4 py-3">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              Para cambiar el proveedor, edita la variable{" "}
              <code className="text-indigo-300 bg-slate-700 px-1 rounded">AI_PROVIDER</code> en{" "}
              <code className="text-indigo-300 bg-slate-700 px-1 rounded">.env.local</code>.
              Valores posibles:{" "}
              <code className="text-indigo-300">anthropic</code>,{" "}
              <code className="text-indigo-300">openai</code>,{" "}
              <code className="text-indigo-300">gemini</code>.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⚖️</span>
          <h3 className="font-semibold">Sistema de puntuación</h3>
        </div>

        <div className="space-y-5">
          <ScoreField
            label="Respuesta correcta"
            color="text-green-400"
            value={correct}
            onChange={setCorrect}
            min={0}
            max={10}
            step={0.25}
          />
          <ScoreField
            label="Respuesta incorrecta"
            color="text-red-400"
            value={wrong}
            onChange={setWrong}
            min={-5}
            max={0}
            step={0.25}
            hint="Valor negativo penaliza. 0 = sin penalización."
          />
          <ScoreField
            label="Sin responder"
            color="text-slate-400"
            value={unanswered}
            onChange={setUnanswered}
            min={-2}
            max={0}
            step={0.25}
          />
        </div>

        <div className="bg-slate-700/40 rounded-lg px-4 py-3 text-sm space-y-1">
          <p className="font-medium text-slate-300">Simulación (10 preguntas: 7 bien, 2 mal, 1 sin resp.)</p>
          <p className="text-slate-400">
            Puntuación:{" "}
            <span className={`font-bold ${exampleScore >= exampleMax * 0.7 ? "text-green-400" : exampleScore >= exampleMax * 0.4 ? "text-yellow-400" : "text-red-400"}`}>
              {exampleScore.toFixed(2)}
            </span>{" "}
            / {exampleMax.toFixed(2)}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Save size={15} />
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function ScoreField({
  label,
  color,
  value,
  onChange,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className={`text-lg font-bold tabular-nums ${color}`}>
          {value > 0 ? "+" : ""}{value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
