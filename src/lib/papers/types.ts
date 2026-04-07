export type Paper = {
  id: string;
  shortName: string;
  title: string;
  authors: string[];
  year: number;
  landingUrl: string;
  focus: string;
  summary: string;
  limitations: string;
};

export type PaperChunk = {
  id: string;
  paperId: string;
  page: number;
  section: string;
  text: string;
  keywords: string[];
};

export type Corpus = {
  papers: Paper[];
  chunks: PaperChunk[];
};

export type GuidedPrompt = {
  id: string;
  label: string;
  question: string;
  description: string;
  keywords: string[];
};

export type Citation = {
  chunkId: string;
  paperId: string;
  paperTitle: string;
  page: number;
  section: string;
  text: string;
};
