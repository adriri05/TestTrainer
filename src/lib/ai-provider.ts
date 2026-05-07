import { Question } from "./types";

type AIProvider = "anthropic" | "openai" | "gemini";

const PROVIDER = (process.env.AI_PROVIDER ?? "anthropic") as AIProvider;

const MODELS: Record<AIProvider, string> = {
  anthropic: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  openai: process.env.OPENAI_MODEL ?? "gpt-4o",
  gemini: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
};

const SYSTEM_PROMPT = `You are a quiz generator. Given study material, generate multiple-choice questions in JSON.
Return ONLY a valid JSON array, no markdown, no explanation.
Each question object: { "id": "q1", "text": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }
Rules:
- correctIndex is 0-based index into options array
- 4 options per question
- explanation is brief (1-2 sentences)
- questions must be answerable from the provided text`;

function buildUserPrompt(text: string, count: number): string {
  return `Generate ${count} multiple-choice questions from this study material:\n\n${text.slice(0, 12000)}`;
}

async function generateWithAnthropic(text: string, count: number): Promise<Question[]> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await client.messages.create({
    model: MODELS.anthropic,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(text, count) }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  return parseQuestions(raw);
}

async function generateWithOpenAI(text: string, count: number): Promise<Question[]> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const resp = await client.chat.completions.create({
    model: MODELS.openai,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(text, count) },
    ],
    max_tokens: 4096,
  });

  const raw = resp.choices[0]?.message?.content ?? "";
  return parseQuestions(raw);
}

async function generateWithGemini(text: string, count: number): Promise<Question[]> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  const model = client.getGenerativeModel({
    model: MODELS.gemini,
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent(buildUserPrompt(text, count));
  const raw = result.response.text();
  return parseQuestions(raw);
}

function parseQuestions(raw: string): Question[] {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("AI response is not an array");

  return parsed.map((q, i) => ({
    id: q.id ?? `q${i + 1}`,
    text: String(q.text),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    correctIndex: Number(q.correctIndex),
    explanation: q.explanation ? String(q.explanation) : undefined,
  }));
}

export async function generateQuestions(text: string, count = 10): Promise<Question[]> {
  switch (PROVIDER) {
    case "anthropic":
      return generateWithAnthropic(text, count);
    case "openai":
      return generateWithOpenAI(text, count);
    case "gemini":
      return generateWithGemini(text, count);
    default:
      throw new Error(`Unknown AI_PROVIDER: ${PROVIDER}`);
  }
}

export function getProviderInfo() {
  return { provider: PROVIDER, model: MODELS[PROVIDER] };
}
