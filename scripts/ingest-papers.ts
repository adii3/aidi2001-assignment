import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { chunkExtractedPages } from "../src/lib/papers/etl";

type SourcePaper = {
  id: string;
  shortName: string;
  title: string;
  authors: string[];
  year: number;
  pdfUrl: string;
  landingUrl: string;
  focus: string;
  summary: string;
  limitations: string;
};

async function main() {
  const projectRoot = process.cwd();
  const bronzeDir = path.join(projectRoot, "data", "bronze");
  const silverDir = path.join(projectRoot, "data", "silver");
  const goldDir = path.join(projectRoot, "data", "gold");

  await Promise.all([
    mkdir(silverDir, { recursive: true }),
    mkdir(goldDir, { recursive: true }),
  ]);

  const sourceFile = await readFile(path.join(bronzeDir, "paper-sources.json"), "utf8");
  const papers = JSON.parse(sourceFile) as SourcePaper[];

  const extracted: Array<{ id: string; pages: Array<{ pageNumber: number; text: string }> }> = [];
  const chunks = [];

  for (const paper of papers) {
    const response = await fetch(paper.pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download ${paper.pdfUrl}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });
    const textResult = await parser.getText();
    await parser.destroy();

    const pages = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text,
    }));

    extracted.push({ id: paper.id, pages });
    chunks.push(...chunkExtractedPages(paper.id, pages));
  }

  await writeFile(
    path.join(silverDir, "paper-text.json"),
    JSON.stringify(extracted, null, 2),
  );

  await writeFile(
    path.join(goldDir, "papers.json"),
    JSON.stringify(papers.map((paper) => ({ ...paper, pdfUrl: undefined })), null, 2),
  );

  await writeFile(path.join(goldDir, "chunks.json"), JSON.stringify(chunks, null, 2));
  console.log(`Wrote ${papers.length} papers and ${chunks.length} chunks.`);
}

void main();
