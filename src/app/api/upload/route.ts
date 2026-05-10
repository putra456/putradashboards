import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ghWrite } from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const finalName = filename || file.name;
    if (!finalName.endsWith(".mq4")) {
      return NextResponse.json(
        { error: "Only .mq4 files allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const content = Buffer.from(bytes).toString("utf-8");

    // Save locally
    const localDir = path.join(process.cwd(), "public", "ea");
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(path.join(localDir, finalName), content, "utf-8");

    // Push to GitHub repo
    try {
      await ghWrite(
        `public/ea/${finalName}`,
        content,
        `Upload EA script: ${finalName}`
      );
    } catch (ghErr: unknown) {
      console.error("GitHub upload failed:", ghErr);
      // Continue - local file is saved
    }

    return NextResponse.json({
      success: true,
      filename: finalName,
      size: bytes.byteLength,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
