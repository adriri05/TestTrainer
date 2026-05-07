"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(10);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const merged = [...prev, ...arr.filter((f) => !names.has(f.name))];
      if (!title && merged.length > 0) {
        setTitle(merged[0].name.replace(/\.[^/.]+$/, ""));
      }
      return merged;
    });
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("title", title || files[0].name);
      fd.append("count", String(count));

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      router.push(`/tests/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el test");
      setLoading(false);
    }
  }

  const isQuotaError =
    error?.includes("límite") ||
    error?.includes("quota") ||
    error?.includes("inténtalo de nuevo");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Nuevo Test</h2>
        <p className="text-slate-400 text-sm mt-1">
          Sube uno o varios archivos y la IA generará preguntas automáticamente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            dragging ? "border-indigo-400 bg-indigo-900/20" : "border-slate-600 hover:border-slate-500",
            files.length > 0 && "border-slate-500"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="text-slate-400">
            <Upload size={28} className="mx-auto mb-2" />
            <p className="font-medium text-sm">
              {files.length > 0 ? "Añadir más archivos" : "Arrastra archivos o haz clic"}
            </p>
            <p className="text-xs mt-1">PDF, DOCX, TXT, MD — múltiples permitidos</p>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5"
              >
                <FileText size={16} className="text-indigo-400 shrink-0" />
                <span className="text-sm flex-1 truncate">{f.name}</span>
                <span className="text-xs text-slate-500 shrink-0">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Título del test</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Biología Tema 3"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Número de preguntas: <span className="text-indigo-400">{count}</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>5</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Error box */}
        {error && (
          <div
            className={cn(
              "rounded-lg px-4 py-3 text-sm flex gap-3 items-start",
              isQuotaError
                ? "bg-yellow-900/30 border border-yellow-700 text-yellow-300"
                : "bg-red-900/30 border border-red-700 text-red-300"
            )}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-0.5">
                {isQuotaError ? "Límite de la API alcanzado" : "Error al generar el test"}
              </p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!files.length || loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors",
            !files.length || loading
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          )}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generando preguntas...
            </>
          ) : (
            <>
              <Upload size={18} />
              Generar Test
              {files.length > 1 && (
                <span className="text-xs opacity-70">({files.length} archivos)</span>
              )}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
