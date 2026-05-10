const GH_OWNER = "putra456";
const GH_REPO = "eaxputrafree";
const GH_TOKEN = process.env.GITHUB_TOKEN || "";

function getHeaders() {
  return {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

function apiUrl(path: string) {
  return `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`;
}

export async function ghRead(path: string): Promise<string> {
  const res = await fetch(apiUrl(path), {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return "";
    const text = await res.text();
    throw new Error(`GitHub read ${path}: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { content: string };
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function ghReadJson<T>(path: string): Promise<T | null> {
  const raw = await ghRead(path);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function ghGetSha(path: string): Promise<string | null> {
  const res = await fetch(apiUrl(path), {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub SHA ${path}: ${res.status}`);
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

export async function ghWrite(path: string, content: string, message?: string) {
  const sha = await ghGetSha(path);
  const body: Record<string, string> = {
    message: message || `Update ${path} — ${new Date().toISOString()}`,
    content: Buffer.from(content).toString("base64"),
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl(path), {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub write ${path}: ${res.status} ${err}`);
  }
}

export async function ghWriteJson(path: string, obj: unknown, message?: string) {
  await ghWrite(path, JSON.stringify(obj, null, 2), message);
}
