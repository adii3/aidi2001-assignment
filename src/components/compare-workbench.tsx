"use client";

import { useState } from "react";
import type { CompareResponse } from "@/lib/papers/compare";
import { guidedPrompts } from "@/lib/papers/questions";
import type { Paper } from "@/lib/papers/types";
import styles from "./compare-workbench.module.css";

type CompareWorkbenchProps = {
  papers: Paper[];
};

export function CompareWorkbench({ papers }: CompareWorkbenchProps) {
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(["rag", "self-rag"]);
  const [promptId, setPromptId] = useState(guidedPrompts[0].id);
  const [response, setResponse] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitComparison() {
    setLoading(true);
    setError(null);

    try {
      const result = await fetch("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paperIds: selectedPaperIds,
          promptId,
        }),
      });
      const payload = (await result.json()) as CompareResponse | { error: string };
      if (!result.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Comparison failed.");
      }

      setResponse(payload);
    } catch (requestError) {
      setResponse(null);
      setError(requestError instanceof Error ? requestError.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  function togglePaper(paperId: string) {
    setSelectedPaperIds((current) => {
      if (current.includes(paperId)) {
        return current.filter((id) => id !== paperId);
      }

      if (current.length === 3) {
        return [...current.slice(1), paperId];
      }

      return [...current, paperId];
    });
  }

  return (
    <section className={styles.shell}>
      <div className={styles.controls}>
        <div className={styles.panel}>
          <p className={styles.eyebrow}>1. Select Two Or Three Papers</p>
          <div className={styles.paperGrid}>
            {papers.map((paper) => {
              const checked = selectedPaperIds.includes(paper.id);
              return (
                <label
                  className={`${styles.paperCard} ${checked ? styles.paperCardActive : ""}`}
                  key={paper.id}
                >
                  <input
                    checked={checked}
                    onChange={() => togglePaper(paper.id)}
                    type="checkbox"
                  />
                  <span>{paper.shortName}</span>
                  <strong>{paper.title}</strong>
                  <em>{paper.focus}</em>
                </label>
              );
            })}
          </div>
        </div>

        <div className={styles.panel}>
          <p className={styles.eyebrow}>2. Choose A Guided Prompt</p>
          <div className={styles.promptList}>
            {guidedPrompts.map((prompt) => (
              <label
                className={`${styles.promptCard} ${prompt.id === promptId ? styles.promptCardActive : ""}`}
                key={prompt.id}
              >
                <input
                  checked={prompt.id === promptId}
                  name="guided-prompt"
                  onChange={() => setPromptId(prompt.id)}
                  type="radio"
                />
                <span>{prompt.label}</span>
                <strong>{prompt.question}</strong>
                <em>{prompt.description}</em>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.runButton}
            disabled={loading || selectedPaperIds.length < 2}
            onClick={submitComparison}
            type="button"
          >
            {loading ? "Comparing..." : "Run Guided Comparison"}
          </button>
          <p className={styles.hint}>
            Supported: fixed corpus, guided prompts, citation-backed comparison.
            Out of scope: uploads, open-web search, unrestricted chat.
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>
      </div>

      <div className={styles.results}>
        {response ? (
          <>
            <article className={styles.resultCard}>
              <p className={styles.eyebrow}>Comparison Answer</p>
              <h2>{response.prompt.question}</h2>
              <p className={styles.summary}>{response.answer.summary}</p>
              <div className={styles.resultColumns}>
                <div>
                  <h3>Key Differences</h3>
                  <ul>
                    {response.answer.differences.map((difference) => (
                      <li key={difference}>{difference}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Recommendation</h3>
                  <p>{response.answer.recommendation}</p>
                  <h3>Cautions</h3>
                  <ul>
                    {response.answer.cautions.map((caution) => (
                      <li key={caution}>{caution}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className={styles.resultCard}>
              <p className={styles.eyebrow}>Evidence Used</p>
              <div className={styles.citationList}>
                {response.citations.map((citation) => (
                  <div className={styles.citationCard} key={citation.chunkId}>
                    <strong>{citation.paperTitle}</strong>
                    <span>
                      Page {citation.page} · {citation.section}
                    </span>
                    <p>{citation.text}</p>
                  </div>
                ))}
              </div>
            </article>
          </>
        ) : (
          <article className={styles.emptyState}>
            <p className={styles.eyebrow}>Ready For A Narrow Demo</p>
            <h2>Run one guided question across a fixed RAG paper set.</h2>
            <p>
              This POC is designed to be explainable in a short assignment video:
              ingestion, curated storage, server-side reasoning, and a user-facing comparison UI.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
