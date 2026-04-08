import { describe, expect, it } from "vitest";
import { runComparison } from "./compare";
import type { Corpus } from "./types";

const fixtureCorpus: Corpus = {
  papers: [
    {
      id: "rag",
      shortName: "RAG",
      title: "RAG",
      authors: ["Lewis"],
      year: 2020,
      landingUrl: "https://example.com/rag",
      focus: "baseline",
      summary: "baseline summary",
      limitations: "baseline limitations",
    },
    {
      id: "crag",
      shortName: "CRAG",
      title: "CRAG",
      authors: ["Yan"],
      year: 2024,
      landingUrl: "https://example.com/crag",
      focus: "quality control",
      summary: "quality summary",
      limitations: "quality limitations",
    },
  ],
  chunks: [
    {
      id: "rag-1",
      paperId: "rag",
      page: 1,
      section: "Overview",
      text: "RAG uses dense retrieval.",
      keywords: ["retrieval", "dense"],
    },
    {
      id: "crag-1",
      paperId: "crag",
      page: 2,
      section: "Method",
      text: "CRAG evaluates retrieval quality before generation.",
      keywords: ["retrieval", "quality", "evaluator"],
    },
  ],
};

describe("runComparison", () => {
  it("accepts selectedPaperIds as a backwards-compatible alias", async () => {
    const result = await runComparison(
      {
        selectedPaperIds: ["rag", "crag"],
        promptId: "retrieval-strategy",
      },
      {
        loadCorpus: async () => fixtureCorpus,
        generateAnswer: async () => ({
          summary: "alias ok",
          differences: ["one", "two"],
          recommendation: "Use RAG for the simplest baseline.",
          cautions: ["Keep the scope narrow."],
        }),
      },
    );

    expect(result.papers.map((paper) => paper.id)).toEqual(["rag", "crag"]);
    expect(result.answer.summary).toBe("alias ok");
  });

  it("returns a structured response with selected papers and citations", async () => {
    const result = await runComparison(
      {
        paperIds: ["rag", "crag"],
        promptId: "retrieval-strategy",
      },
      {
        loadCorpus: async () => fixtureCorpus,
        generateAnswer: async ({ prompt, papers, citations }) => ({
          summary: `${prompt.id}:${papers.length}:${citations.length}`,
          differences: ["one", "two"],
          recommendation: "Use RAG for the simplest baseline.",
          cautions: ["Keep the scope narrow."],
        }),
      },
    );

    expect(result.papers.map((paper) => paper.id)).toEqual(["rag", "crag"]);
    expect(result.citations).toHaveLength(2);
    expect(result.answer.summary).toBe("retrieval-strategy:2:2");
  });

  it("rejects unknown papers", async () => {
    await expect(
      runComparison(
        {
          paperIds: ["rag", "missing"],
          promptId: "retrieval-strategy",
        },
        {
          loadCorpus: async () => fixtureCorpus,
          generateAnswer: async () => ({
            summary: "n/a",
            differences: ["one", "two"],
            recommendation: "n/a",
            cautions: ["n/a"],
          }),
        },
      ),
    ).rejects.toThrow("One or more selected papers were not found.");
  });
});
