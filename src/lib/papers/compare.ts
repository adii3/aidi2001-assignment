import { z } from "zod";
import { selectEvidence } from "./evidence";
import { getGuidedPrompt } from "./questions";
import { loadCorpus } from "./repository";
import type { Citation, Corpus, GuidedPrompt, Paper } from "./types";

export const CompareRequestSchema = z.object({
  paperIds: z.array(z.string()).min(2).max(3),
  promptId: z.string().min(1),
});

export const ComparisonAnswerSchema = z.object({
  summary: z.string(),
  differences: z.array(z.string()).min(2).max(5),
  recommendation: z.string(),
  cautions: z.array(z.string()).min(1).max(4),
});

export type ComparisonAnswer = z.infer<typeof ComparisonAnswerSchema>;

export type CompareResponse = {
  prompt: GuidedPrompt;
  papers: Paper[];
  answer: ComparisonAnswer;
  citations: Citation[];
};

type CompareDeps = {
  loadCorpus: () => Promise<Corpus>;
  generateAnswer: (input: {
    prompt: GuidedPrompt;
    papers: Paper[];
    citations: Citation[];
  }) => Promise<ComparisonAnswer>;
};

const defaultDeps: CompareDeps = {
  loadCorpus,
  generateAnswer: async ({ prompt, papers, citations }) => {
    const { generateComparisonAnswer } = await import("./reasoner");
    return generateComparisonAnswer({ prompt, papers, citations });
  },
};

export async function runComparison(
  input: unknown,
  deps: CompareDeps = defaultDeps,
): Promise<CompareResponse> {
  const request = CompareRequestSchema.parse(input);
  const prompt = getGuidedPrompt(request.promptId);

  if (!prompt) {
    throw new Error("Unknown guided prompt.");
  }

  const corpus = await deps.loadCorpus();
  const selectedPapers = corpus.papers.filter((paper) => request.paperIds.includes(paper.id));

  if (selectedPapers.length !== request.paperIds.length) {
    throw new Error("One or more selected papers were not found.");
  }

  const citations = selectEvidence(corpus, selectedPapers, prompt);
  const answer = await deps.generateAnswer({
    prompt,
    papers: selectedPapers,
    citations,
  });

  return {
    prompt,
    papers: selectedPapers,
    answer,
    citations,
  };
}
