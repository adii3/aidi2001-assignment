import { ZodError } from "zod";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/papers/compare", () => ({
  runComparison: vi.fn(),
}));

import { runComparison } from "@/lib/papers/compare";
import { POST } from "./route";

describe("POST /api/compare", () => {
  it("returns a validation error for invalid payloads", async () => {
    vi.mocked(runComparison).mockRejectedValueOnce(new ZodError([]));

    const response = await POST(
      new Request("http://localhost/api/compare", {
        method: "POST",
        body: JSON.stringify({ paperIds: ["rag"] }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns the comparison payload on success", async () => {
    vi.mocked(runComparison).mockResolvedValueOnce({
      prompt: {
        id: "retrieval-strategy",
        label: "Retrieval Strategy",
        question: "How do these papers differ?",
        description: "desc",
        keywords: [],
      },
      papers: [],
      citations: [],
      answer: {
        summary: "ok",
        differences: ["one", "two"],
        recommendation: "rec",
        cautions: ["caution"],
      },
    });

    const response = await POST(
      new Request("http://localhost/api/compare", {
        method: "POST",
        body: JSON.stringify({
          paperIds: ["rag", "crag"],
          promptId: "retrieval-strategy",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      answer: {
        summary: "ok",
      },
    });
  });
});
