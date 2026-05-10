import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "src", "data", "users.json");

interface UserData {
  username: string;
  password: string;
  role: string;
  premium: boolean;
}

function readUsers(): UserData[] {
  const data = fs.readFileSync(USERS_FILE, "utf-8");
  return JSON.parse(data) as UserData[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const users = readUsers();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        premium: user.premium,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[AUTH ERROR]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
