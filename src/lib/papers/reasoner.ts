import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ComparisonAnswerSchema } from "./compare";
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

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "developer",
        content:
          "You compare a small fixed paper set for a student proof of concept. Use only the provided evidence. Keep claims concrete and avoid exaggeration.",
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
    response_format: zodResponseFormat(ComparisonAnswerSchema, "paper_comparison"),
  });

  const parsed = completion.choices[0]?.message.parsed;

  if (!parsed) {
    throw new Error("The model did not return a structured comparison.");
  }

  return parsed;
}
