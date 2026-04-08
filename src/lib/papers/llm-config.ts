export type LlmConfig = {
  provider: "openai" | "groq";
  apiKey: string;
  model: string;
  baseURL?: string;
};

export function getLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmConfig {
  const provider =
    (env.LLM_PROVIDER?.toLowerCase() as "openai" | "groq" | undefined) ??
    (env.GROQ_API_KEY || env.GROQ_MODEL ? "groq" : "openai");

  const apiKey = provider === "groq" ? env.GROQ_API_KEY : env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      provider === "groq"
        ? "No API key configured. Set LLM_API_KEY or GROQ_API_KEY."
        : "No API key configured. Set LLM_API_KEY or OPENAI_API_KEY.",
    );
  }

  const model =
    provider === "groq"
      ? env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
      : env.OPENAI_MODEL ?? "gpt-4o-mini";

  const baseURL = provider === "groq" ? "https://api.groq.com/openai/v1" : undefined;

  return {
    provider,
    apiKey,
    model,
    baseURL,
  };
}
