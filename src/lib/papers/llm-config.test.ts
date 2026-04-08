import { describe, expect, it } from "vitest";
import { getLlmConfig } from "./llm-config";

describe("getLlmConfig", () => {
  it("defaults to OpenAI settings when no provider override is present", () => {
    expect(
      getLlmConfig({
        OPENAI_API_KEY: "openai-key",
      }),
    ).toMatchObject({
      provider: "openai",
      apiKey: "openai-key",
      model: "gpt-4o-mini",
      baseURL: undefined,
    });
  });

  it("configures Groq through provider-aware env vars", () => {
    expect(
      getLlmConfig({
        LLM_PROVIDER: "groq",
        GROQ_API_KEY: "groq-key",
      }),
    ).toMatchObject({
      provider: "groq",
      apiKey: "groq-key",
      model: "llama-3.3-70b-versatile",
      baseURL: "https://api.groq.com/openai/v1",
    });
  });
});
