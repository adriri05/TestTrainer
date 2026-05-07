import fs from "fs";

export async function parseFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf" || filePath.endsWith(".pdf")) {
    return parsePdf(filePath);
  }
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filePath.endsWith(".docx")
  ) {
    return parseDocx(filePath);
  }
  return parseText(filePath);
}

async function parsePdf(filePath: string): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function parseText(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}
