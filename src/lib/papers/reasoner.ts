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
  return parseModelAnswer(content, { prompt, papers, citations });
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

type FallbackContext = {
  prompt: GuidedPrompt;
  papers: Paper[];
  citations: Citation[];
};

export function parseModelAnswer(content: unknown, context: FallbackContext) {
  const raw = extractJsonString(content);

  try {
    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeModelPayload(parsed);
    const result = ComparisonAnswerSchema.safeParse(normalized);

    if (result.success) {
      return result.data;
    }
  } catch {
    // Fall back to a deterministic answer when the provider returns
    // non-JSON or loosely structured JSON.
  }

  return buildFallbackAnswer(context);
}

function normalizeModelPayload(input: unknown): unknown {
  const source = unwrapPayload(input);

  if (!source || typeof source !== "object") {
    return input;
  }

  const record = source as Record<string, unknown>;

  return {
    summary: firstString(record.summary, record.overview, record.introduction),
    differences: toStringArray(record.differences, record.keyDifferences, record.comparisons),
    recommendation: firstString(
      record.recommendation,
      record.bestFit,
      record.best_fit_recommendation,
    ),
    cautions: toStringArray(record.cautions, record.limitations, record.risks, record.tradeoffs),
  };
}

function unwrapPayload(input: unknown): unknown {
  if (!input || typeof input !== "object") {
    return input;
  }

  const record = input as Record<string, unknown>;

  if (record.answer && typeof record.answer === "object") {
    return record.answer;
  }

  if (record.result && typeof record.result === "object") {
    return record.result;
  }

  return input;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function toStringArray(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const items = value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim());

      if (items.length > 0) {
        return items;
      }
    }

    if (typeof value === "string" && value.trim()) {
      const items = value
        .split(/\n|•|-/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length > 0) {
        return items;
      }
    }
  }

  return undefined;
}

function buildFallbackAnswer({ prompt, papers, citations }: FallbackContext) {
  const topPapers = papers.slice(0, 3);
  const differences = topPapers.map((paper) => {
    const evidence = citations.find((citation) => citation.paperId === paper.id);
    const support = evidence ? ` Evidence focus: ${evidence.section} on page ${evidence.page}.` : "";
    return `${paper.shortName} emphasizes ${paper.focus.toLowerCase()} and is summarized as: ${paper.summary}${support}`;
  });

  while (differences.length < 2) {
    differences.push("The selected papers differ in retrieval control, evidence use, or implementation complexity.");
  }

  const firstPaper = papers[0];
  const simplestPaper =
    papers.find((paper) => /simplest|baseline/i.test(`${paper.summary} ${paper.focus}`)) ?? firstPaper;

  return {
    summary: `${prompt.label} comparison across ${papers.map((paper) => paper.shortName).join(", ")} using curated corpus evidence.`,
    differences: differences.slice(0, 5),
    recommendation: `For a lightweight proof of concept, ${simplestPaper?.shortName ?? "the simplest paper"} is the safest starting point because it has the clearest retrieve-then-generate story and the least orchestration overhead.`,
    cautions: [
      ...papers
        .map((paper) => `${paper.shortName}: ${paper.limitations}`)
        .filter(Boolean)
        .slice(0, 3),
      "Treat this fallback answer as citation-guided synthesis and verify claims against the evidence snippets shown in the UI.",
    ].slice(0, 4),
  };
}

function stripMarkdownFence(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }

  return trimmed;
}
