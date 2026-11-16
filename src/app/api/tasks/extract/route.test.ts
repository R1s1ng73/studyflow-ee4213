// @vitest-environment node

import { readFile } from "node:fs/promises";
import { afterEach, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function extract(file: File) {
  const form = new FormData();
  form.set("file", file);
  const origin = "http://127.0.0.1:3001";
  return POST(new Request(`${origin}/api/tasks/extract`, {
    method: "POST", headers: { Host: "127.0.0.1:3001", Origin: origin }, body: form,
  }));
}

it("sends the poster to the model and retains valid dates and source evidence for review", async () => {
  const poster = await readFile(new URL("../../../../../docs/hackathon-import-test.png", import.meta.url));
  vi.stubEnv("DEEPSEEK_API_KEY", "test-only");
  const fetchModel = vi.fn<(url: string, request: RequestInit) => Promise<Response>>(async () => Response.json({
    choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      items: [{
        title: "Harbour Code Hackathon registration", courseHint: "", date: "2026-11-25",
        time: "18:00", dateMeaning: "submission-deadline", excerpt: "報名截止 2026-11-25 18:00",
        estimatedMinutes: 183, reviewReason: "",
      }, {
        title: "Team briefing", courseHint: "", date: "2026-02-30",
        time: "", dateMeaning: "scheduled-start", excerpt: "Team briefing",
        estimatedMinutes: "unknown", reviewReason: "",
      }, {
        title: "Long project", courseHint: "", date: "2026-12-10",
        time: "", dateMeaning: "date-to-remember", excerpt: "Build the long project",
        estimatedMinutes: 99999, reviewReason: "",
      }],
    }) } }],
  }));
  vi.stubGlobal("fetch", fetchModel);

  const response = await extract(new File([new Uint8Array(poster)], "hackathon-import-test.png", { type: "image/png" }));
  expect(response.status).toBe(200);
  const [url, init] = fetchModel.mock.calls[0]!;
  expect(url).toBe("https://api.deepseek.com/chat/completions");
  const request = JSON.parse(init.body as string);
  expect(request.model).toBe("deepseek-flash");
  expect(request.response_format).toEqual({ type: "json_object" });
  expect(request.messages[0].content).toContain("estimatedMinutes");
  expect(request.messages[1].content[1].image_url.url).toBe(`data:image/png;base64,${poster.toString("base64")}`);
  const items = (await response.json()).items;
  expect(items).toMatchObject([
    { date: "2026-11-25", time: "18:00", excerpt: "報名截止 2026-11-25 18:00", estimatedMinutes: 185 },
    { date: "", reviewReason: "Confirm the date before importing." },
    { title: "Long project", estimatedMinutes: 1440 },
  ]);
  expect(items[1].estimatedMinutes).toBeUndefined();
});

it("uses OCR for PDFs and sends the recognized text in page order to DeepSeek Flash", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "test-only");
  const fetchModel = vi.fn<(url: string, request: RequestInit) => Promise<Response>>()
    .mockResolvedValueOnce(Response.json({ pages: [
      { index: 1, text: "提交原型", finish_reason: "stop" },
      { index: 0, text: "<｜ref｜>Hackathon<｜/ref｜><｜box｜>[[0, 2, 4, 6]]<｜/box｜>", finish_reason: "stop" },
    ] }))
    .mockResolvedValueOnce(Response.json({
      choices: [{ finish_reason: "stop", message: { content: '{"items":[]}' } }],
    }));
  vi.stubGlobal("fetch", fetchModel);
  const response = await extract(new File(["%PDF-1.7"], "test.pdf", { type: "application/pdf" }));
  expect(response.status).toBe(200);
  const [ocrUrl, ocr] = fetchModel.mock.calls[0]!;
  expect(ocrUrl).toBe("https://api.deepseek.com/v1/tools/ocr");
  expect((ocr.body as FormData).get("purpose")).toBe("text_recognition");
  expect((ocr.body as FormData).get("file")).toBeInstanceOf(File);
  const chat = JSON.parse(fetchModel.mock.calls[1]![1].body as string);
  expect(chat.messages[1].content).toContain("Hackathon\n\n提交原型");
  expect(chat.messages[1].content).not.toContain("<｜box｜>");
});

it("returns a DeepSeek configuration message when its key is missing", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  const fetchModel = vi.fn();
  vi.stubGlobal("fetch", fetchModel);
  const response = await extract(new File(["%PDF-1.7"], "test.pdf"));
  expect(response.status).toBe(503);
  expect((await response.json()).message).toContain("DEEPSEEK_API_KEY");
  expect(fetchModel).not.toHaveBeenCalled();
});
