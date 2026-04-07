import type { Citation, Corpus, GuidedPrompt, Paper } from "./types";

export function selectEvidence(corpus: Corpus, papers: Paper[], prompt: GuidedPrompt) {
  const paperIds = new Set(papers.map((paper) => paper.id));

  return corpus.chunks
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
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map((item) => item.citation);
}

function scoreChunk(text: string, keywords: string[], promptKeywords: string[]) {
  const lowered = text.toLowerCase();
  return promptKeywords.reduce((total, keyword) => {
    const keywordMatches = keywords.includes(keyword) || lowered.includes(keyword);
    return total + (keywordMatches ? 2 : 0);
  }, 0);
}
