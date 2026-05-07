import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { parseFile } from "@/lib/parsers";
import { generateQuestions } from "@/lib/ai-provider";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const tmpDir = path.join(os.tmpdir(), "testtrainer");
  await mkdir(tmpDir, { recursive: true });

  const tmpPaths: string[] = [];

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const title = (formData.get("title") as string) || "Test sin título";
    const countRaw = formData.get("count");
    const count = countRaw ? Math.min(50, Math.max(1, Number(countRaw))) : 10;

    if (!files.length) {
      return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 });
    }

    // Parse all files and combine text
    const textParts: string[] = [];
    const fileNames: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tmpPath = path.join(tmpDir, `${uuidv4()}_${file.name}`);
      tmpPaths.push(tmpPath);
      await writeFile(tmpPath, buffer);

      const text = await parseFile(tmpPath, file.type);
      if (text.trim()) {
        textParts.push(`--- ${file.name} ---\n${text.trim()}`);
        fileNames.push(file.name);
      }
    }

    if (!textParts.length) {
      return NextResponse.json({ error: "No se pudo extraer texto de ningún archivo" }, { status: 400 });
    }

    const combinedText = textParts.join("\n\n");
    const questions = await generateQuestions(combinedText, count);

    if (!questions.length) {
      return NextResponse.json({ error: "La IA no generó ninguna pregunta" }, { status: 500 });
    }

    const db = getDb();
    const id = uuidv4();
    const sourceFilename = fileNames.join(", ");
    db.prepare(
      `INSERT INTO tests (id, title, questions, source_filename) VALUES (?, ?, ?, ?)`
    ).run(id, title, JSON.stringify(questions), sourceFilename);

    return NextResponse.json({ id, title, questionCount: questions.length });
  } catch (err) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    for (const p of tmpPaths) {
      unlink(p).catch(() => {});
    }
  }
}
