function toB64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ data: toB64({ ok: true }) });
}
