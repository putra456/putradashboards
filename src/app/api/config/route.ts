import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "src", "data", "config.json");

function readConfig(): unknown {
  const data = fs.readFileSync(CONFIG_FILE, "utf-8");
  return JSON.parse(data);
}

function writeConfig(config: unknown) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

// GET config
export async function GET() {
  try {
    const config = readConfig();
    return NextResponse.json({ config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read config";
    console.error("[CONFIG GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT update config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const newConfig = body.config;

    if (!newConfig) {
      return NextResponse.json(
        { error: "Missing config" },
        { status: 400 }
      );
    }

    writeConfig(newConfig);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to write config";
    console.error("[CONFIG PUT]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
