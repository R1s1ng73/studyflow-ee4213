// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";
import { POST } from "./route";

const origin = "http://127.0.0.1:3001";

function estimate(body: unknown) {
  return POST(new Request(`${origin}/api/tasks/estimate`, {
    method: "POST",
    headers: { Host: "127.0.0.1:3001", Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("asks DeepSeek to size the supplied titles and normalizes the answers", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "test-only");
  const fetchModel = vi.fn<(url: string, request: RequestInit) => Promise<Response>>(async () => Response.json({
    choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ estimates: [
      { index: 0, minutes: 183 },
      { index: 1, minutes: "unknown" },
    ] }) } }],
  }));
  vi.stubGlobal("fetch", fetchModel);

  const response = await estimate({ titles: ["HCI usability report", "Signals quiz 4"] });
  expect(response.status).toBe(200);
  const [url, init] = fetchModel.mock.calls[0]!;
  expect(url).toBe("https://api.deepseek.com/chat/completions");
  const request = JSON.parse(init.body as string);
  expect(request.model).toBe("deepseek-flash");
  expect(request.messages[0].content).toContain("title");
  expect(request.messages[1].content).toBe("0. HCI usability report\n1. Signals quiz 4");
  expect(await response.json()).toEqual({ estimates: [185, null] });
});

it("rejects requests that are not from the local app or carry no titles", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "test-only");
  const foreign = await POST(new Request("https://example.com/api/tasks/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titles: ["HCI report"] }),
  }));
  expect(foreign.status).toBe(403);

  const empty = await estimate({ titles: [] });
  expect(empty.status).toBe(400);
});

it("reports a configuration message when the DeepSeek key is missing", async () => {
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  const fetchModel = vi.fn();
  vi.stubGlobal("fetch", fetchModel);
  const response = await estimate({ titles: ["HCI usability report"] });
  expect(response.status).toBe(503);
  expect((await response.json()).message).toContain("DEEPSEEK_API_KEY");
  expect(fetchModel).not.toHaveBeenCalled();
});
