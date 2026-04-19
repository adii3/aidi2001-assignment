import type { Citation, Corpus, GuidedPrompt, Paper } from "./types";

const MAX_CITATIONS = 6;

export function selectEvidence(corpus: Corpus, papers: Paper[], prompt: GuidedPrompt) {
  const paperIds = new Set(papers.map((paper) => paper.id));
  const scoredCitations = corpus.chunks
    .filter((chunk) => paperIds.has(chunk.paperId))
    .map((chunk) => {
      const paper = papers.find((item) => item.id === chunk.paperId)!;
      const score = scoreChunk(chunk.text, chunk.keywords, prompt.keywords);

      return {
        score,
        citation: {
          chunkId: chunk.id,
          paperId: chunk.paperId,
          paperTitle: paper.title,
          page: chunk.page,
          section: chunk.section,
          text: chunk.text,
        } satisfies Citation,
      };
    });

  const selected = new Map<string, (typeof scoredCitations)[number]>();
  const citationsByPaper = papers.map((paper) => ({
    paperId: paper.id,
    items: scoredCitations
      .filter((item) => item.citation.paperId === paper.id)
      .sort(compareScoredCitations),
  }));
  const minimumPerPaper = Math.max(1, Math.floor(MAX_CITATIONS / Math.max(papers.length, 1)));

  for (const { items } of citationsByPaper) {
    for (const item of items.slice(0, minimumPerPaper)) {
      selected.set(item.citation.chunkId, item);
    }
  }

  for (const item of scoredCitations.sort(compareScoredCitations)) {
    if (selected.size >= MAX_CITATIONS) {
      break;
    }

    selected.set(item.citation.chunkId, item);
  }

  return Array.from(selected.values())
    .sort(compareScoredCitations)
    .slice(0, MAX_CITATIONS)
    .map((item) => item.citation);
}

function scoreChunk(text: string, keywords: string[], promptKeywords: string[]) {
  const lowered = text.toLowerCase();
  return promptKeywords.reduce((total, keyword) => {
    const keywordMatches = keywords.includes(keyword) || lowered.includes(keyword);
    return total + (keywordMatches ? 2 : 0);
  }, 0);
}

function compareScoredCitations(
  left: { score: number; citation: Citation },
  right: { score: number; citation: Citation },
) {
  return (
    right.score - left.score ||
    left.citation.paperId.localeCompare(right.citation.paperId) ||
    left.citation.chunkId.localeCompare(right.citation.chunkId)
  );
}
