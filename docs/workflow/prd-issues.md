# PRD to Issues Breakdown

Parent PRD: `RAG Paper Compare`

## Proposed Vertical Slices

1. **Corpus Pipeline Skeleton**
   Type: AFK
   Blocked by: None
   Covers user stories: 6, 7
   Deliver a repeatable path from paper source metadata to staged corpus artifacts.

2. **Guided Compare API Slice**
   Type: AFK
   Blocked by: Corpus Pipeline Skeleton
   Covers user stories: 1, 2, 4, 8
   Deliver an end-to-end API that validates a guided prompt, retrieves evidence, and returns a structured comparison payload.

3. **Comparison UI Slice**
   Type: AFK
   Blocked by: Guided Compare API Slice
   Covers user stories: 1, 2, 3, 4, 5
   Deliver the user-facing page for paper selection, guided prompts, answer rendering, and evidence display.

4. **Browser and Deployment Proof Slice**
   Type: AFK
   Blocked by: Comparison UI Slice
   Covers user stories: 8, 9
   Deliver Playwright coverage, deployment readiness, and assignment-facing documentation.

5. **Architecture Review and Refactor Slice**
   Type: HITL
   Blocked by: Browser and Deployment Proof Slice
   Covers user stories: 6, 8
   Review the first working version, identify shallow seams, and document a before/after structural improvement.

## Issue Body Template

Use this body when creating the real GitHub issues:

```md
## Parent PRD

RAG Paper Compare

## What to build

Describe the end-to-end user-visible behavior for this slice.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- None - can start immediately

## User stories addressed

- User story N
```
