import { expect, test } from "@playwright/test";

test("runs a guided comparison and renders evidence", async ({ page }) => {
  await page.route("**/api/compare", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        prompt: {
          id: "retrieval-strategy",
          label: "Retrieval Strategy",
          question: "How do these papers differ in retrieval strategy?",
          description: "Compare how each paper decides what to retrieve and when retrieval matters.",
          keywords: [],
        },
        papers: [],
        answer: {
          summary: "Mock comparison summary",
          differences: ["Difference one", "Difference two"],
          recommendation: "Use RAG when you want the simplest baseline.",
          cautions: ["Keep retrieval quality visible."],
        },
        citations: [
          {
            chunkId: "rag-1",
            paperId: "rag",
            paperTitle: "RAG",
            page: 1,
            section: "Overview",
            text: "RAG combines retrieval with generation.",
          },
        ],
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Run Guided Comparison" }).click();

  await expect(page.getByText("Comparison Answer")).toBeVisible();
  await expect(page.getByText("Evidence Used")).toBeVisible();
  await expect(page.getByText("Mock comparison summary")).toBeVisible();
});
