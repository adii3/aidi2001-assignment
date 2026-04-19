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

  it("keeps evidence balanced across papers for comparison prompts", () => {
    const threePaperCorpus: Corpus = {
      papers: [
        ...corpus.papers,
        {
          id: "self-rag",
          shortName: "Self-RAG",
          title: "Self-RAG",
          authors: ["Asai"],
          year: 2023,
          landingUrl: "https://example.com/self-rag",
          focus: "adaptive retrieval",
          summary: "adaptive summary",
          limitations: "adaptive limitations",
        },
      ],
      chunks: [
        ...corpus.chunks,
        {
          id: "rag-2",
          paperId: "rag",
          page: 3,
          section: "Findings",
          text: "RAG improves factuality but still trusts retrieval quality.",
          keywords: ["evaluation", "factuality"],
        },
        {
          id: "crag-2",
          paperId: "crag",
          page: 5,
          section: "Findings",
          text: "CRAG adds corrective evaluation when retrieval is weak.",
          keywords: ["evaluation", "quality"],
        },
        {
          id: "self-rag-1",
          paperId: "self-rag",
          page: 1,
          section: "Overview",
          text: "Self-RAG uses reflection tokens for adaptive retrieval.",
          keywords: ["retrieval", "adaptive"],
        },
        {
          id: "self-rag-2",
          paperId: "self-rag",
          page: 6,
          section: "Findings",
          text: "Self-RAG improves citation quality with explicit critique.",
          keywords: ["quality", "citation"],
        },
      ],
    };

    const citations = selectEvidence(
      threePaperCorpus,
      threePaperCorpus.papers,
      {
        id: "evaluation-differences",
        label: "Evaluation Differences",
        question: "How do these papers evaluate success and evidence quality?",
        description: "desc",
        keywords: ["evaluation", "quality", "citation"],
      },
    );

    const counts = Object.fromEntries(
      threePaperCorpus.papers.map((paper) => [
        paper.id,
        citations.filter((citation) => citation.paperId === paper.id).length,
      ]),
    );

    expect(citations).toHaveLength(6);
    expect(counts).toEqual({
      rag: 2,
      crag: 2,
      "self-rag": 2,
    });
  });
});
