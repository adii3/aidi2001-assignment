import { describe, expect, it } from "vitest";
import { selectEvidence } from "./evidence";
import type { Corpus } from "./types";

const corpus: Corpus = {
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

describe("selectEvidence", () => {
  it("prioritizes evidence that matches prompt keywords", () => {
    const citations = selectEvidence(
      corpus,
      corpus.papers,
      {
        id: "retrieval-strategy",
        label: "Retrieval Strategy",
        question: "How do these papers differ in retrieval strategy?",
        description: "desc",
        keywords: ["retrieval", "quality", "evaluator"],
      },
    );

    expect(citations[0].paperId).toBe("crag");
    expect(citations).toHaveLength(2);
  });
});
