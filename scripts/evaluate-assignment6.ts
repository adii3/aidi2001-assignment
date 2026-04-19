import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import cases from "../evaluation/cases.json";
import { runComparison } from "@/lib/papers/compare";
import { selectEvidence } from "@/lib/papers/evidence";
import { parseModelAnswer } from "@/lib/papers/reasoner";
import { loadCorpus } from "@/lib/papers/repository";
import { getGuidedPrompt } from "@/lib/papers/questions";
import type { Citation, Corpus, GuidedPrompt, Paper } from "@/lib/papers/types";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "evaluation",
  "results",
  "assignment6-results.json",
);

type EvaluationCase = {
  id: string;
  type: "representative" | "failure";
  label: string;
  request: {
    paperIds?: string[];
    selectedPaperIds?: string[];
    promptId: string;
  };
};

type RetrievalMetrics = {
  citationIds: string[];
  countsByPaper: Record<string, number>;
  coverageRatio: number;
  balanceGap: number;
  minimumQuotaPerPaper: number;
  meetsCoverage: boolean;
  meetsBalancedQuota: boolean;
};

type OutputMetrics = {
  score: number;
  maxScore: number;
  checks: {
    summaryPresent: boolean;
    differencesValid: boolean;
    recommendationPresent: boolean;
    cautionsValid: boolean;
    citationCoverage: boolean;
    paperMentionsInDifferences: boolean;
  };
};

function legacySelectEvidence(corpus: Corpus, papers: Paper[], prompt: GuidedPrompt) {
  const paperIds = new Set(papers.map((paper) => paper.id));

  return corpus.chunks
    .filter((chunk) => paperIds.has(chunk.paperId))
    .map((chunk) => {
      const paper = papers.find((item) => item.id === chunk.paperId)!;
      const lowered = chunk.text.toLowerCase();
      const score = prompt.keywords.reduce((total, keyword) => {
        const keywordMatches = chunk.keywords.includes(keyword) || lowered.includes(keyword);
        return total + (keywordMatches ? 2 : 0);
      }, 0);

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

function getSelectedPaperIds(request: EvaluationCase["request"]) {
  return request.paperIds ?? request.selectedPaperIds ?? [];
}

function buildRetrievalMetrics(citations: Citation[], selectedPaperIds: string[]): RetrievalMetrics {
  const minimumQuotaPerPaper = Math.max(1, Math.floor(6 / Math.max(selectedPaperIds.length, 1)));
  const countsByPaper = Object.fromEntries(
    selectedPaperIds.map((paperId) => [
      paperId,
      citations.filter((citation) => citation.paperId === paperId).length,
    ]),
  );
  const counts = Object.values(countsByPaper);
  const coveredPaperCount = counts.filter((count) => count > 0).length;

  return {
    citationIds: citations.map((citation) => citation.chunkId),
    countsByPaper,
    coverageRatio: selectedPaperIds.length === 0 ? 0 : coveredPaperCount / selectedPaperIds.length,
    balanceGap: counts.length === 0 ? 0 : Math.max(...counts) - Math.min(...counts),
    minimumQuotaPerPaper,
    meetsCoverage: coveredPaperCount === selectedPaperIds.length,
    meetsBalancedQuota: counts.every((count) => count >= minimumQuotaPerPaper),
  };
}

function buildOutputMetrics(
  response: Awaited<ReturnType<typeof runComparison>>,
  selectedPapers: Paper[],
): OutputMetrics {
  const renderedDifferences = response.answer.differences.join(" ").toLowerCase();
  const checks = {
    summaryPresent: response.answer.summary.trim().length > 0,
    differencesValid:
      response.answer.differences.length >= 2 && response.answer.differences.length <= 5,
    recommendationPresent: response.answer.recommendation.trim().length > 0,
    cautionsValid: response.answer.cautions.length >= 1 && response.answer.cautions.length <= 4,
    citationCoverage:
      new Set(response.citations.map((citation) => citation.paperId)).size === selectedPapers.length,
    paperMentionsInDifferences: selectedPapers.every((paper) =>
      renderedDifferences.includes(paper.shortName.toLowerCase()),
    ),
  };

  return {
    score: Object.values(checks).filter(Boolean).length,
    maxScore: Object.keys(checks).length,
    checks,
  };
}

async function main() {
  const corpus = await loadCorpus();
  const results = [];

  for (const testCase of cases as EvaluationCase[]) {
    const prompt = getGuidedPrompt(testCase.request.promptId);
    if (!prompt) {
      throw new Error(`Unknown prompt in evaluation case: ${testCase.request.promptId}`);
    }

    const selectedPaperIds = getSelectedPaperIds(testCase.request);
    const selectedPapers = corpus.papers.filter((paper) => selectedPaperIds.includes(paper.id));

    const baselineCitations = legacySelectEvidence(corpus, selectedPapers, prompt);
    const improvedCitations = selectEvidence(corpus, selectedPapers, prompt);

    const response = await runComparison(testCase.request, {
      loadCorpus: async () => corpus,
      generateAnswer: async ({ prompt, papers, citations }) =>
        parseModelAnswer(
          JSON.stringify({
            note: "force deterministic fallback for offline evaluation",
          }),
          { prompt, papers, citations },
        ),
    });

    const outputMetrics = buildOutputMetrics(response, selectedPapers);
    const taskSuccess =
      response.papers.length === selectedPaperIds.length &&
      response.citations.length > 0 &&
      outputMetrics.checks.summaryPresent &&
      outputMetrics.checks.differencesValid &&
      outputMetrics.checks.recommendationPresent &&
      outputMetrics.checks.cautionsValid &&
      outputMetrics.checks.citationCoverage;

    results.push({
      id: testCase.id,
      type: testCase.type,
      label: testCase.label,
      request: testCase.request,
      prompt: prompt.question,
      baseline: buildRetrievalMetrics(baselineCitations, selectedPaperIds),
      improved: buildRetrievalMetrics(improvedCitations, selectedPaperIds),
      taskSuccess,
      outputQuality: outputMetrics,
      answerPreview: {
        summary: response.answer.summary,
        recommendation: response.answer.recommendation,
      },
    });
  }

  const representativeCases = results.filter((result) => result.type === "representative");
  const failureCases = results.filter((result) => result.type === "failure");

  const summary = {
    generatedAt: new Date().toISOString(),
    representativeCaseCount: representativeCases.length,
    representativeTaskSuccessRate:
      representativeCases.filter((result) => result.taskSuccess).length /
      Math.max(representativeCases.length, 1),
    averageOutputQualityScore:
      representativeCases.reduce((total, result) => total + result.outputQuality.score, 0) /
      Math.max(representativeCases.length, 1),
    averageOutputQualityMax:
      representativeCases.reduce((total, result) => total + result.outputQuality.maxScore, 0) /
      Math.max(representativeCases.length, 1),
    baselineAverageBalanceGap:
      results.reduce((total, result) => total + result.baseline.balanceGap, 0) /
      Math.max(results.length, 1),
    improvedAverageBalanceGap:
      results.reduce((total, result) => total + result.improved.balanceGap, 0) /
      Math.max(results.length, 1),
    failureCasesImproved:
      failureCases.filter(
        (result) =>
          !result.baseline.meetsBalancedQuota && result.improved.meetsBalancedQuota,
      ).length,
  };

  const payload = {
    summary,
    results,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
