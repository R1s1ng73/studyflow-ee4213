import { isLocalPost } from "@/lib/local-request";
import { normalizeEstimateMinutes } from "@/lib/estimate";

const MAX_TITLES = 40;
const MAX_TITLE_LENGTH = 180;

const instructions = [
  "Estimate how many focused minutes a typical undergraduate needs in total for each numbered task title.",
  "Use only the title text. Assume ordinary coursework difficulty and do not invent hidden requirements.",
  "Give a whole number of minutes from 5 to 1440, rounded to the nearest five.",
  'Return only a JSON object of the form {"estimates":[{"index":0,"minutes":60}]}, with exactly one entry per title and the same indices.',
  'Return {"estimates":[]} if no titles are usable.',
].join(" ");

class EstimateError extends Error {}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function askDeepSeek(key: string, titles: string[]): Promise<unknown> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-flash",
      thinking: { type: "disabled" },
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: titles.map((title, index) => `${index}. ${title}`).join("\n") },
      ],
    }),
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "DeepSeek rejected the API key. Check DEEPSEEK_API_KEY in .env.local.",
      402: "The DeepSeek API account has insufficient balance.",
      403: "DeepSeek denied access. Check your API account permissions.",
      429: "DeepSeek reached a rate limit. Wait a moment and try again.",
    };
    throw new EstimateError(
      messages[response.status] ?? `DeepSeek returned HTTP ${response.status} while estimating times.`,
    );
  }
  return response.json();
}

export async function POST(request: Request) {
  if (!isLocalPost(request)) return json({ message: "Open the local StudyFlow address to estimate times." }, 403);
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return json({ message: "Add DEEPSEEK_API_KEY to this copy’s .env.local file and restart StudyFlow." }, 503);

  const body = await request.json().catch(() => null) as { titles?: unknown } | null;
  const titles = Array.isArray(body?.titles)
    ? body.titles
        .filter((title): title is string => typeof title === "string")
        .map((title) => title.trim().slice(0, MAX_TITLE_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_TITLES)
    : [];
  if (!titles.length) return json({ message: "Choose at least one task to estimate." }, 400);

  try {
    const result = await askDeepSeek(key, titles) as {
      choices?: { finish_reason?: string; message?: { content?: string } }[];
    };
    const choice = result.choices?.[0];
    const output = choice?.message?.content;
    if (choice?.finish_reason !== "stop" || typeof output !== "string" || !output.trim()) {
      return json({ message: "No complete estimate was returned. Try again." }, 502);
    }
    const parsed = JSON.parse(output) as { estimates?: unknown[] };
    const byIndex = new Map<number, number>();
    if (Array.isArray(parsed?.estimates)) {
      for (const entry of parsed.estimates) {
        if (!entry || typeof entry !== "object") continue;
        const { index, minutes } = entry as { index?: unknown; minutes?: unknown };
        const position = Number(index);
        const estimate = normalizeEstimateMinutes(minutes);
        if (Number.isInteger(position) && position >= 0 && estimate !== undefined) {
          byIndex.set(position, estimate);
        }
      }
    }
    return json({ estimates: titles.map((_, index) => byIndex.get(index) ?? null) });
  } catch (error) {
    return json({
      message: error instanceof EstimateError ? error.message
        : "The estimate service could not finish. Check the DeepSeek connection and try again.",
    }, 502);
  }
}
