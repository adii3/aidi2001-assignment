import OpenAI from "openai";
import { ComparisonAnswerSchema } from "./compare";
import { getLlmConfig } from "./llm-config";
import type { Citation, GuidedPrompt, Paper } from "./types";

type ReasonerInput = {
  prompt: GuidedPrompt;
  papers: Paper[];
  citations: Citation[];
};

export async function generateComparisonAnswer({
  prompt,
  papers,
  citations,
}: ReasonerInput) {
  if (process.env.MOCK_COMPARE === "1") {
    return {
      summary: `Mock comparison for ${papers.map((paper) => paper.shortName).join(" vs ")} on ${prompt.label}.`,
      differences: [
        `${papers[0]?.shortName ?? "Paper 1"} is the simplest baseline in the corpus.`,
        `${papers.at(-1)?.shortName ?? "Paper 2"} adds more control around retrieval or evidence quality.`,
      ],
      recommendation:
        "For a lightweight assignment POC, start with the simplest retrieval pattern and only add corrective logic if the use case requires it.",
      cautions: [
        `This is mock mode and should be used only for testing or demo setup.`,
        `Ground claims in the cited evidence snippets before presenting them.`,
      ],
    };
  }

  const config = getLlmConfig();

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: [
      {
        role: "developer",
        content:
          [
            "You compare a small fixed paper set for a student proof of concept.",
            "Use only the provided evidence.",
            "Keep claims concrete and avoid exaggeration.",
            "Return valid JSON with exactly these keys:",
            "summary, differences, recommendation, cautions.",
            "differences and cautions must be arrays of strings.",
          ].join(" "),
      },
      {
        role: "user",
        content: [
          `Question: ${prompt.question}`,
          `Selected papers: ${papers.map((paper) => `${paper.shortName} (${paper.year})`).join(", ")}`,
          "Paper summaries:",
          ...papers.map(
            (paper) =>
              `- ${paper.shortName}: focus=${paper.focus}; summary=${paper.summary}; limitations=${paper.limitations}`,
          ),
          "Evidence:",
          ...citations.map(
            (citation, index) =>
              `${index + 1}. ${citation.paperTitle} | page ${citation.page} | ${citation.section} | ${citation.text}`,
          ),
        ].join("\n"),
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message.content;
  const parsed = ComparisonAnswerSchema.parse(
    JSON.parse(extractJsonString(content)),
  );

  return parsed;
}

function extractJsonString(content: unknown) {
  if (typeof content === "string") {
    return stripMarkdownFence(content);
  }

  if (Array.isArray(content)) {
    const joined = content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const maybeText = item as { type?: unknown; text?: unknown };
        return maybeText.type === "text" && typeof maybeText.text === "string"
          ? maybeText.text
          : "";
      })
      .filter(Boolean)
      .join("\n");

    return stripMarkdownFence(joined);
  }

  throw new Error("The model did not return any content.");
}

function stripMarkdownFence(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }

  return trimmed;
}
