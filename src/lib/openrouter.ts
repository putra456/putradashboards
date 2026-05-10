const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateChangelog(scriptContent: string): Promise<{
  version: string;
  date: string;
  changes: { type: "feat" | "fix" | "imp" | "sec"; text: string }[];
}> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("Missing env: OPENROUTER_API_KEY");
  }

  const prompt = `Analyze this MQL4 Expert Advisor script and generate a changelog entry.

Script content (first 3000 chars):
${scriptContent.slice(0, 3000)}

Generate a JSON object with this exact structure:
{
  "version": "vX.Y",
  "changes": [
    { "type": "feat", "text": "description of new feature" },
    { "type": "fix", "text": "description of bug fix" },
    { "type": "imp", "text": "description of improvement" }
  ]
}

Types: feat=new feature, fix=bug fix, imp=improvement, sec=security fix.
Generate 3-6 meaningful changes based on the script's functionality.
Only return valid JSON, no markdown, no explanation.`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://xau-putra.vercel.app",
      "X-Title": "XauPutra EA Platform",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices[0]?.message?.content || "";

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    version: string;
    changes: { type: "feat" | "fix" | "imp" | "sec"; text: string }[];
  };

  return {
    version: parsed.version,
    date: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    changes: parsed.changes,
  };
}
