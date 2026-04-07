import type { GuidedPrompt } from "./types";

export const guidedPrompts: GuidedPrompt[] = [
  {
    id: "retrieval-strategy",
    label: "Retrieval Strategy",
    question: "How do these papers differ in retrieval strategy?",
    description: "Compare how each paper decides what to retrieve and when retrieval matters.",
    keywords: ["retrieval", "strategy", "dense", "adaptive", "quality", "evaluator"],
  },
  {
    id: "evaluation-differences",
    label: "Evaluation Differences",
    question: "How do these papers evaluate success and evidence quality?",
    description: "Focus on evaluation style, claims, and what each paper proves.",
    keywords: ["evaluation", "findings", "quality", "citation", "factuality"],
  },
  {
    id: "strengths-limitations",
    label: "Strengths and Limitations",
    question: "What are the main strengths and limitations of each approach?",
    description: "Summarize tradeoffs for a student comparing methods.",
    keywords: ["strengths", "limitations", "tradeoff", "complexity", "fit"],
  },
  {
    id: "best-fit-recommendation",
    label: "Best Fit for a POC",
    question: "Which paper is the best fit for a lightweight RAG proof of concept and why?",
    description: "Recommend the most practical paper for a small end-to-end student build.",
    keywords: ["fit", "poc", "lightweight", "recommendation", "complexity"],
  },
];

export function getGuidedPrompt(promptId: string) {
  return guidedPrompts.find((prompt) => prompt.id === promptId);
}
