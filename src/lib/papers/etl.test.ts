import { describe, expect, it } from "vitest";
import { chunkExtractedPages, normalizePageText } from "./etl";

describe("paper ETL helpers", () => {
  it("normalizes repeated whitespace without losing paragraph breaks", () => {
    const normalized = normalizePageText("Alpha   beta\r\n\r\n\r\nGamma");
    expect(normalized).toBe("Alpha beta\n\nGamma");
  });

  it("creates stable chunk ids and page metadata", () => {
    const chunks = chunkExtractedPages("rag", [
      {
        pageNumber: 2,
        text: "Method\n\nParagraph one about retrieval.\n\nParagraph two about dense passages.",
      },
    ]);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      id: "rag-p2-1",
      page: 2,
      paperId: "rag",
      section: "Method",
    });
  });
});
