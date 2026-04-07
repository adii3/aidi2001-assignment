import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { runComparison } from "@/lib/papers/compare";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const response = await runComparison(body);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid comparison request.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error.";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 400;

    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}
