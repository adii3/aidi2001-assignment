# RAG Paper Compare

RAG Paper Compare is the Assignment 5 application extended for Assignment 6. It is a narrow AI app that compares a fixed set of RAG research papers through a guided UI, retrieval-backed evidence selection, and a server-side LLM reasoning step.

## What The App Supports

- Compare 2-3 curated RAG papers from the built-in corpus
- Ask one of the guided comparison questions
- Return a structured answer with evidence snippets and citations
- Demonstrate the full path from source ingestion to user-facing output

## What Is Out Of Scope

- User-uploaded PDFs
- Open-web search
- Arbitrary chat over unrelated topics
- Production retrieval infrastructure or agent workflows

## Architecture Classification

This system is best classified as `Hybrid`.

- `Retrieval-first / RAG`: the app stores curated paper chunks in `data/gold/chunks.json`, scores them against the guided prompt, and passes only selected evidence into the reasoner.
- `Prompt-first`: the final comparison answer is synthesized by an LLM from the selected papers, prompt, and citations.

### Why Hybrid Fits Best

- The corpus is larger than I want to paste into every prompt, even though it is still small enough to keep in-repo.
- Retrieval keeps the prompt focused and debuggable because I can inspect exactly which chunks were selected.
- The final answer still needs flexible synthesis and recommendation text, so a purely deterministic template would be too rigid.
- Cost stays low because only a small evidence set goes into the model.
- Operational overhead stays manageable because the storage layer is just repo-backed JSON, not a vector database or external retriever service.
- Performance is predictable because retrieval is local and deterministic.
- Debugging is practical because ETL, retrieval, API validation, and answer generation each have their own boundary and tests.

### Main Alternative Rejected

The main alternative was `Prompt-first / long-context`.

- It would be simpler to wire initially because the app could send full paper summaries or many chunks straight to the model.
- I rejected it because prompt size would grow quickly as the corpus grows, which would raise cost and make failures harder to explain.
- It would also hide retrieval mistakes inside one large prompt instead of giving me an inspectable evidence-selection step.

### Important Capability Not Implemented

The most important architecture capability I did not implement is `Tool-first` query-time ingestion, such as letting users upload a new paper or calling an external search/PDF tool during a comparison.

- It would improve the system if the assignment required open-ended paper comparison beyond the fixed corpus.
- It would solve the current limitation that all supported papers must be pre-ingested into the repo.
- It would introduce more complexity in tool routing, file validation, storage, latency, and debugging.
- I would add it only if the app needed user-supplied documents or a changing corpus. For the current fixed three-paper assignment scope, that overhead is not justified.

## Pipeline And Source Of Truth

1. `data/bronze/paper-sources.json`
   Source metadata and PDF URLs.
2. `scripts/ingest-papers.ts`
   Extracts and normalizes paper text.
3. `data/gold/papers.json` and `data/gold/chunks.json`
   Curated application source of truth used at runtime.
4. `src/lib/papers/evidence.ts`
   Scores and selects evidence chunks for the chosen prompt and papers.
5. `src/lib/papers/reasoner.ts`
   Builds the LLM prompt and parses the structured comparison answer.
6. `src/app/api/compare/route.ts`
   Validates the request and returns the comparison payload.
7. `src/components/compare-workbench.tsx`
   Renders the guided comparison UI and citations.

### Useful Internal State For Debugging

- selected `paperIds`
- selected `promptId`
- chosen citations and chunk IDs
- curated paper metadata
- model/provider config
- parsed answer payload or fallback answer path
- saved evaluation outputs in `evaluation/results/assignment6-results.json`

## Evaluation Artifacts

- Cases: [`evaluation/cases.json`](evaluation/cases.json)
- Reproducible evaluation script: [`scripts/evaluate-assignment6.ts`](scripts/evaluate-assignment6.ts)
- Generated results: [`evaluation/results/assignment6-results.json`](evaluation/results/assignment6-results.json)
- Assignment 6 notes: [`docs/workflow/assignment6-evaluation.md`](docs/workflow/assignment6-evaluation.md)

### Metrics Used

- `Output quality`: structured-answer rubric plus citation coverage
- `End-to-end task success`: valid comparison request returns the selected papers, citations, and a structured answer
- `Upstream component`: retrieval evidence balance and citation coverage across selected papers
- `Baseline comparison`: current balanced selector versus the earlier global top-6 selector

The evaluation script uses the app's deterministic fallback answer builder for reproducible offline scoring.

Current saved results:

- `5/5` representative cases succeeded end to end
- average output-quality score was `6/6`
- average retrieval balance gap improved from `1.14` in the baseline to `0`
- `2/2` targeted failure cases were fixed by the new retrieval policy

## Evidence-Based Improvement

The Assignment 6 improvement is in [`src/lib/papers/evidence.ts`](src/lib/papers/evidence.ts).

- Baseline behavior: the old selector ranked all chunks globally and took the top six.
- Failure observed: on three-paper comparisons, one paper could receive only one citation while another received three, which biases a comparison task.
- Change made: the selector now guarantees a fair minimum number of citations per selected paper before filling the remaining slots by score.
- Why this helps: the comparison answer now starts from more balanced evidence instead of letting a single paper dominate.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`.

OpenAI:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Groq:

```bash
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

3. Run the app:

```bash
npm run dev
```

4. Optional: regenerate the corpus:

```bash
npm run ingest
```

## Verification

```bash
npm run test
npm run build
npm run evaluate:assignment6
```

Optional browser test:

```bash
npm run test:e2e
```

## Workflow Evidence

- `grill-me`: [`docs/workflow/grill-me-notes.md`](docs/workflow/grill-me-notes.md)
- `write-a-prd`: [`docs/workflow/prd-rag-paper-compare.md`](docs/workflow/prd-rag-paper-compare.md)
- `prd-to-issues`: [`docs/workflow/prd-issues.md`](docs/workflow/prd-issues.md)
- `tdd`: unit and API tests in `src/lib/papers/*.test.ts` and `src/app/api/compare/route.test.ts`
- `improve-codebase-architecture`: [`docs/workflow/architecture-review.md`](docs/workflow/architecture-review.md)

## Deployment

Deploy to Vercel with the same environment variables used locally. The deployed app should expose the same guided comparison flow shown in the evaluation artifacts and video walkthrough.
