import type { PaperChunk } from "./types";

type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export function normalizePageText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkExtractedPages(
  paperId: string,
  pages: ExtractedPage[],
  targetLength = 550,
) {
  const chunks: PaperChunk[] = [];

  for (const page of pages) {
    const normalized = normalizePageText(page.text);
    if (!normalized) {
      continue;
    }

    const paragraphs = normalized
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    let buffer = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
      if (next.length <= targetLength) {
        buffer = next;
        continue;
      }

      if (buffer) {
        chunkIndex += 1;
        chunks.push(makeChunk(paperId, page.pageNumber, chunkIndex, buffer));
      }

      buffer = paragraph;
    }

    if (buffer) {
      chunkIndex += 1;
      chunks.push(makeChunk(paperId, page.pageNumber, chunkIndex, buffer));
    }
  }

  return chunks;
}

function makeChunk(
  paperId: string,
  pageNumber: number,
  chunkIndex: number,
  text: string,
): PaperChunk {
  return {
    id: `${paperId}-p${pageNumber}-${chunkIndex}`,
    paperId,
    page: pageNumber,
    section: inferSection(text),
    text,
    keywords: inferKeywords(text),
  };
}

function inferSection(text: string) {
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length < 80) {
    return firstLine.replace(/[:.]+$/, "");
  }

  return "Extracted Evidence";
}

function inferKeywords(text: string) {
  const candidates = [
    "retrieval",
    "generator",
    "evaluation",
    "quality",
    "factuality",
    "evidence",
    "critique",
    "reflection",
    "poc",
    "complexity",
  ];

  const lowered = text.toLowerCase();
  return candidates.filter((candidate) => lowered.includes(candidate));
}
