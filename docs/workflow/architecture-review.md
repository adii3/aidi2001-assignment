# improve-codebase-architecture Review

## Before

The first working version had one comparison module doing too many things at once:

- request validation
- corpus loading
- evidence scoring and selection
- reasoning orchestration
- response assembly

That structure worked, but it made the evidence-selection behavior harder to reason about and harder to test as a standalone boundary.

## After

The retrieval-and-ranking logic was extracted into a deeper module:

- `selectEvidence(...)` now owns prompt-aware evidence scoring and citation selection
- `runComparison(...)` keeps the orchestration boundary simple
- tests can now verify evidence selection directly without going through the entire comparison flow

## Why this is a real improvement

- The comparison service now reads as orchestration instead of a bundle of mixed responsibilities.
- The retrieval policy is isolated, which makes future changes to ranking safer.
- The test surface is clearer: ETL, evidence selection, API contract, and browser flow each have a distinct boundary.
