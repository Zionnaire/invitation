import { NextRequest, NextResponse } from "next/server";
import { makeSession, cookieName, passwordMatches, sessionMaxAgeSec } from "@/lib/auth";
import { allow, clientIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    if (!(await allow("login", clientIp(req), 8, 15 * 60))) {
      return NextResponse.json({ message: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
    }
    const { password } = await req.json();
    if (!passwordMatches(String(password || ""))) {
      return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, makeSession(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: sessionMaxAgeSec });
    return res;
  } catch (e) {
    console.error("Login error", e);
    return NextResponse.json({ message: "Unable to sign in right now." }, { status: 500 });
  }
}
