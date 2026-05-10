import { NextRequest, NextResponse } from "next/server";
import { generateChangelog } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptContent } = body;

    if (!scriptContent || typeof scriptContent !== "string") {
      return NextResponse.json(
        { error: "scriptContent is required" },
        { status: 400 }
      );
    }

    const changelog = await generateChangelog(scriptContent);
    return NextResponse.json({ changelog });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    console.error("[AI CHANGELOG ERROR]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
