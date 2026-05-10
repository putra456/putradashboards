import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "ea",
      "ScalpGridHedge_Premium.mq4"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    const base64 = Buffer.from(content).toString("base64");
    return NextResponse.json({ script: base64 });
  } catch {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }
}
