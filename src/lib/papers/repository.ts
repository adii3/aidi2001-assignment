import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Corpus, Paper, PaperChunk } from "./types";

const dataRoot = path.join(process.cwd(), "data", "gold");

export async function loadCorpus(): Promise<Corpus> {
  const [papersRaw, chunksRaw] = await Promise.all([
    readFile(path.join(dataRoot, "papers.json"), "utf8"),
    readFile(path.join(dataRoot, "chunks.json"), "utf8"),
  ]);

  return {
    papers: JSON.parse(papersRaw) as Paper[],
    chunks: JSON.parse(chunksRaw) as PaperChunk[],
  };
}
