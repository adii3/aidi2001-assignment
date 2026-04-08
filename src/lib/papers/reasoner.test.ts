import { describe, expect, it } from "vitest";
import { parseModelAnswer } from "./reasoner";
import type { Citation, GuidedPrompt, Paper } from "./types";

const prompt: GuidedPrompt = {
  id: "retrieval-strategy",
  label: "Retrieval Strategy",
  question: "How do these papers differ in retrieval strategy?",
  description: "Compare retrieval behavior.",
  keywords: ["retrieval"],
};

const papers: Paper[] = [
  {
    id: "rag",
    shortName: "RAG",
    title: "RAG",
    authors: ["Lewis"],
    year: 2020,
    landingUrl: "https://example.com/rag",
    focus: "Baseline retrieve-then-generate architecture.",
    summary: "The simplest baseline in the corpus.",
    limitations: "No self-correction loop.",
  },
  {
    id: "self-rag",
    shortName: "Self-RAG",
    title: "Self-RAG",
    authors: ["Asai"],
    year: 2023,
    landingUrl: "https://example.com/self-rag",
    focus: "Adaptive retrieval and critique.",
    summary: "Adds control around retrieval quality.",
    limitations: "More complex to implement.",
  },
];

const citations: Citation[] = [
  {
    chunkId: "rag-1",
    paperId: "rag",
    paperTitle: "RAG",
    page: 1,
    section: "Overview",
    text: "RAG uses dense retrieval before generation.",
  },
];

describe("parseModelAnswer", () => {
  it("accepts alternate model payload keys", () => {
    const result = parseModelAnswer(
      JSON.stringify({
        overview: "Comparison overview",
        keyDifferences: ["one", "two"],
        bestFit: "Start with RAG",
        risks: ["Watch complexity"],
      }),
      { prompt, papers, citations },
    );

    expect(result).toMatchObject({
      summary: "Comparison overview",
      recommendation: "Start with RAG",
      differences: ["one", "two"],
      cautions: ["Watch complexity"],
    });
  });

  it("falls back to a deterministic answer when required keys are missing", () => {
    const result = parseModelAnswer(
      JSON.stringify({
        note: "Provider returned a different shape.",
      }),
      { prompt, papers, citations },
    );

    expect(result.summary).toContain("Retrieval Strategy comparison");
    expect(result.differences.length).toBeGreaterThanOrEqual(2);
    expect(result.recommendation).toContain("RAG");
    expect(result.cautions.length).toBeGreaterThanOrEqual(1);
  });
});
