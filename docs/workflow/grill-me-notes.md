# grill-me Notes

## What got challenged

- The original idea risked becoming a generic paper chatbot with unclear boundaries.
- The corpus size was narrowed from an open-ended research assistant to exactly 3 fixed RAG papers.
- The UI shifted from freeform Q&A to guided comparison prompts so the supported behavior would be reliable and testable.
- The stack was reduced to `Next.js + JSON storage + server-side LLM call` instead of adding a database or vector system too early.

## What changed because of the grilling

- The app now supports a few explicit tasks rather than broad chat.
- Storage is repo-backed curated files, which makes the data flow easy to explain in a video and easy to deploy on Vercel.
- The reasoning layer is clearly server-side and citation-backed.
- Out-of-scope behavior is explicit: no uploads, no arbitrary web search, no production infra.
