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

  let tmpPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Test sin título";
    const countRaw = formData.get("count");
    const count = countRaw ? Math.min(50, Math.max(1, Number(countRaw))) : 10;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    tmpPath = path.join(tmpDir, `${uuidv4()}_${file.name}`);
    await writeFile(tmpPath, buffer);

    const text = await parseFile(tmpPath, file.type);
    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
    }

    const questions = await generateQuestions(text, count);
    if (!questions.length) {
      return NextResponse.json({ error: "AI generated no questions" }, { status: 500 });
    }

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      `INSERT INTO tests (id, title, questions, source_filename) VALUES (?, ?, ?, ?)`
    ).run(id, title, JSON.stringify(questions), file.name);

    return NextResponse.json({ id, title, questionCount: questions.length });
  } catch (err) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (tmpPath) {
      unlink(tmpPath).catch(() => {});
    }
  }
}
