import { test, expect, vi } from "vitest";
import { gradeWithFallback } from "../../src/server/ai-grader.js";
import { BOSS } from "../../src/shared/missions.js";

const grade = { marks: { design: 0, solution: 0, tests: 0, reason: 0 }, reasons: { design: "Salah", solution: "Salah", tests: "Salah", reason: "Salah" }, feedback: "Coba periksa kembali aturan keberangkatan." };
const config = { google: { apiKey: "google-test" }, groq: { apiKey: "groq-test", model: "openai/gpt-oss-120b" }, openrouter: { apiKey: "router-test", model: "nvidia/nemotron-3.5-lightning:free" } };

test("Groq success does not send answers to OpenRouter or paid Gemini", async () => {
  const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(grade) } }] }) }));
  const result = await gradeWithFallback(BOSS, {}, { ...config, fetchImpl });
  expect(result.provider).toBe("groq");
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test.each([429, 503])("Groq %s falls through to OpenRouter with the same rubric", async status => {
  const fetchImpl = vi.fn(async (url, options) => {
    if (url.includes("groq")) return { ok: false, status, json: async () => ({ error: {} }) };
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const body = JSON.parse(options.body);
    expect(body.model).toBe(config.openrouter.model);
    expect(body.messages[0].content).toContain(BOSS.title);
    expect(body.response_format).toBeUndefined();
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(grade) } }] }) };
  });
  expect(await gradeWithFallback(BOSS, {}, { ...config, fetchImpl })).toMatchObject({ provider: "openrouter", marks: grade.marks });
});

test("invalid Groq scores fall through to a free OpenRouter model", async () => {
  const urls = [];
  const fetchImpl = async (url, options) => {
    urls.push(url);
    if (url.includes("googleapis")) throw new DOMException("timeout", "TimeoutError");
    const value = url.includes("groq") ? { ...grade, marks: { ...grade.marks, design: 500 } } : grade;
    if (url.includes("openrouter")) expect(JSON.parse(options.body).provider.max_price).toEqual({ prompt: 0, completion: 0 });
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(value) } }] }) };
  };
  expect(await gradeWithFallback(BOSS, {}, { ...config, fetchImpl })).toMatchObject({ provider: "openrouter" });
  expect(urls).toHaveLength(2);
});

test("paid Gemini is used only after both free providers fail", async () => {
  const urls = [];
  const fetchImpl = async url => {
    urls.push(url);
    if (!url.includes("googleapis")) return { ok: false, status: 503 };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(grade) }] } }] }) };
  };
  expect(await gradeWithFallback(BOSS, {}, { ...config, fetchImpl })).toMatchObject({ provider: "google" });
  expect(urls[0]).toContain("groq");
  expect(urls[1]).toContain("openrouter");
  expect(urls[2]).toContain("googleapis");
});

test("missing backups and paid OpenRouter IDs are never requested", async () => {
  const fetchImpl = vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: {} }) }));
  await expect(gradeWithFallback(BOSS, {}, { google: config.google, groq: { apiKey: "" }, openrouter: { apiKey: "router-test", model: "paid/model" }, fetchImpl })).rejects.toThrow();
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});
