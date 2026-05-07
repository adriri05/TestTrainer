"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [count, setCount] = useState(10);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }

  function pickFile(f: File) {
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Nuevo Test</h2>
        <p className="text-slate-400 text-sm mt-1">
          Sube un archivo y la IA generará preguntas automáticamente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
            dragging ? "border-indigo-400 bg-indigo-900/20" : "border-slate-600 hover:border-slate-500",
            file && "border-green-500 bg-green-900/10"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3 text-green-400">
              <FileText size={32} />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">
              <Upload size={32} className="mx-auto mb-3" />
              <p className="font-medium">Arrastra un archivo o haz clic</p>
              <p className="text-sm mt-1">PDF, DOCX, TXT, MD</p>
            </div>
          )}
        </div>

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

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors",
            !file || loading
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
            </>
          )}
        </button>
      </form>
    </div>
  );
}
