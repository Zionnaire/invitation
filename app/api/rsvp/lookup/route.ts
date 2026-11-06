import { NextRequest, NextResponse } from "next/server";
import { invitations } from "@/lib/mongo";
import { allow, clientIp } from "@/lib/ratelimit";

/** Given an invitation code, returns the guest's name and current status so the RSVP form can greet them. */
export async function POST(req: NextRequest) {
  try {
    if (!(await allow("lookup", clientIp(req), 20, 15 * 60))) {
      return NextResponse.json({ message: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
    }
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{5,16}$/.test(code)) {
      return NextResponse.json({ message: "That invitation code wasn't recognized. Please check it and try again." }, { status: 404 });
    }
    const invite = await (await invitations()).findOne({ code }, { projection: { guest_name: 1, status: 1 } });
    if (!invite) return NextResponse.json({ message: "That invitation code wasn't recognized. Please check it and try again." }, { status: 404 });
    return NextResponse.json({ name: invite.guest_name, status: invite.status });
  } catch (e) {
    console.error("Lookup error", e);
    return NextResponse.json({ message: "We're unable to look that up right now. Please try again shortly." }, { status: 500 });
  }
}
