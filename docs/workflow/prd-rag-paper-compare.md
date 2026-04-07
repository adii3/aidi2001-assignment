# PRD Draft: RAG Paper Compare

## Problem Statement

Students and reviewers often want a narrow, explainable way to compare a few related RAG papers without reading each paper line by line. A generic chat interface is too broad for a proof of concept and makes it hard to explain what the system actually supports.

## Solution

Build a small AI-enabled web app that ingests a fixed set of public RAG research paper PDFs, transforms them into curated artifacts, stores those artifacts as repo-backed JSON, and lets users run guided comparison prompts over the selected papers with cited evidence.

## User Stories

1. As a student, I want to compare two RAG papers on retrieval strategy, so that I can explain the core method differences quickly.
2. As a student, I want to compare papers on evaluation approach, so that I can understand how each paper demonstrates effectiveness.
3. As a student, I want a recommendation for which paper best fits a lightweight POC, so that I can justify a design choice.
4. As a reviewer, I want cited evidence snippets alongside the answer, so that I can see where the comparison came from.
5. As a reviewer, I want the app to show its supported tasks clearly, so that I do not mistake it for a general-purpose research chatbot.
6. As a developer, I want the corpus stored as curated files, so that the app can deploy simply on Vercel.
7. As a developer, I want a repeatable ingestion pipeline from PDF sources to processed JSON, so that data preparation is explainable and reproducible.
8. As a developer, I want core comparison behavior covered by tests, so that the supported features are trustworthy.
9. As a developer, I want at least one browser-driven end-to-end scenario, so that the real user path is verified.

## Implementation Decisions

- Use a fixed corpus of 3 public RAG papers.
- Keep a staged data flow: source metadata, extracted or normalized text, then final curated files used by the app.
- Use guided prompt IDs instead of freeform-only questions.
- Run the LLM on the server side with `OPENAI_API_KEY`.
- Retrieve relevant chunks from curated files before generating the comparison answer.
- Return a structured comparison result plus supporting citations.
- Keep the UI intentionally narrow and explicit about out-of-scope behavior.

## Testing Decisions

- Good tests verify supported behavior at public boundaries, not internal implementation details.
- Test the ETL and chunking behavior because it defines what evidence becomes available to the app.
- Test request validation and response shape for the compare API.
- Test at least one end-to-end browser scenario using Playwright.

## Out of Scope

- User-uploaded documents
- Arbitrary freeform research over the open web
- Authentication
- Vector databases or multi-tenant infrastructure
- Large-scale corpus management

## Further Notes

- The architecture is intentionally simple because the assignment emphasizes a focused working system over production scale.
- The repo should also include issue-ready workflow artifacts if GitHub issue creation is blocked in the local environment.
