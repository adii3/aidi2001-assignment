# Assignment 6 Evaluation Notes

## Architecture Summary

- Category: `Hybrid`
- Retrieval-first part: deterministic evidence selection over curated `papers.json` and `chunks.json`
- Prompt-first part: LLM synthesis of a structured comparison answer from the selected evidence

## Why This Architecture Was Chosen

- The app needs retrieval because the answer should be grounded in specific paper chunks, not just paper summaries.
- The app still needs a model because the final output is a comparison, recommendation, and caution list rather than a simple extractive lookup.
- A pure prompt-first design would be easier at first, but it would scale poorly in prompt size and make retrieval mistakes harder to debug.
- A tool-first design with live uploads or web search would add unnecessary overhead for a fixed three-paper assignment corpus.

## Pipeline Walkthrough

1. `data/bronze/paper-sources.json`
   Raw metadata and PDF URLs.
2. `scripts/ingest-papers.ts`
   Extracts text and normalizes it into structured chunks.
3. `data/gold/papers.json` and `data/gold/chunks.json`
   Repo-backed runtime source of truth.
4. `selectEvidence(...)`
   Chooses prompt-relevant citations from the selected papers.
5. `generateComparisonAnswer(...)`
   Builds the comparison prompt and parses the LLM response.
6. `POST /api/compare`
   Validates input and returns the final payload.
7. `CompareWorkbench`
   Displays the answer and evidence in the UI.

## Evaluation Design

### Output Quality

- Metric: a 6-point structured-answer rubric
- Checks:
  - summary present
  - differences count between 2 and 5
  - recommendation present
  - cautions count between 1 and 4
  - citations cover all selected papers
  - differences mention all selected papers
- Why this metric fits:
  - the app promises a usable, citation-backed comparison payload, not a free-form chatbot response
  - provider output can vary, so the rubric focuses on whether the output remains structured and useful

### End-To-End Task Success

- Metric: request succeeds only if the comparison pipeline returns
  - the correct selected papers
  - at least one citation
  - a valid structured answer
  - citation coverage across all selected papers

### Upstream Component

- Component: retrieval / evidence selection
- Metrics:
  - citation coverage ratio
  - balanced quota per selected paper
  - balance gap between the most-cited and least-cited paper
- Why this metric fits:
  - the app is doing comparison, so evidence should not cluster too heavily around one paper

## Baseline

The lightweight baseline is the original retrieval selector:

- score all chunks globally
- sort by score
- keep the top 6 chunks

That baseline is simple and cheap, but it is not comparison-aware. It can over-represent one paper and under-represent another.

## Failure Point

The weakness showed up in three-paper comparison cases:

- `retrieval-strategy`
- `evaluation-differences`

Under the old selector, a paper could receive only one citation while another received three. That is enough to bias the final answer even when all three papers are technically present.

## Improvement Made

- File changed: `src/lib/papers/evidence.ts`
- New policy:
  - compute scores as before
  - guarantee a fair minimum citation quota per selected paper
  - then fill remaining slots by score

## What Improved

After the change:

- three-paper comparison cases move from uneven `3/2/1` evidence splits to balanced `2/2/2`
- representative task success remains intact
- saved results show `5/5` representative cases succeeding end to end
- saved results show average output quality of `6/6` on the reproducible rubric
- saved results show the retrieval balance gap dropping from `1.14` to `0`
- both targeted failure cases are repaired by the new selector

## What Still Remains Weak

- Retrieval is still lexical and curated, not embedding-based.
- The corpus is intentionally tiny, so retrieval quality is easier than it would be in a larger real system.
- Output-quality scoring is reproducible offline through the deterministic fallback path; live provider-backed quality should still be shown in the video demo.

## Files To Show In The Video

- `README.md`
- `data/bronze/paper-sources.json`
- `data/gold/papers.json`
- `data/gold/chunks.json`
- `src/lib/papers/evidence.ts`
- `src/lib/papers/reasoner.ts`
- `src/app/api/compare/route.ts`
- `src/components/compare-workbench.tsx`
- `evaluation/cases.json`
- `evaluation/results/assignment6-results.json`
