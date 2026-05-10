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

function writeUsers(users: UserData[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// GET all users
export async function GET() {
  try {
    const users = readUsers();
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to read users";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role, premium } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const users = readUsers();

    if (users.find((u) => u.username === username)) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const newUser: UserData = {
      username,
      password,
      role: role || "buyer",
      premium: premium === true,
    };

    users.push(newUser);
    writeUsers(users);

    return NextResponse.json({
      success: true,
      user: {
        username: newUser.username,
        role: newUser.role,
        premium: newUser.premium,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const users = readUsers();
    const filtered = users.filter((u) => u.username !== username);

    if (filtered.length === users.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    writeUsers(filtered);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
