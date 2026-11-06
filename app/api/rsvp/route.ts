import { NextRequest, NextResponse } from "next/server";
import { invitations, nameKey } from "@/lib/mongo";
import { allow, clientIp } from "@/lib/ratelimit";

const DEADLINE = new Date("2026-11-24T23:59:59-06:00"); // Tuesday, Nov 24, 2026, US Central

export async function POST(req: NextRequest) {
  try {
    if (!(await allow("rsvp", clientIp(req), 12, 15 * 60))) {
      return NextResponse.json({ message: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
    }
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const name = String(body.name || "").trim();
    const status = body.status;
    if (!/^[A-Z0-9-]{5,16}$/.test(code) || name.length < 2 || name.length > 100 || !["accepted", "declined"].includes(status)) {
      return NextResponse.json({ message: "Please check your name, invitation code and response." }, { status: 400 });
    }
    if (new Date() > DEADLINE) {
      return NextResponse.json({ message: "The RSVP deadline has passed. Please contact your hosts directly." }, { status: 410 });
    }
    const col = await invitations();
    // Atomic: only a pending invitation with matching code AND name is updated, exactly once.
    const updated = await col.findOneAndUpdate(
      { code, name_key: nameKey(name), status: "pending" },
      { $set: { status, responded_at: new Date() } }
    );
    if (updated) {
      return NextResponse.json({ ok: true, status, message: status === "accepted" ? "Your place is confirmed. We look forward to celebrating with you!" : "Your response has been recorded. Thank you for letting us know." });
    }
    const invite = await col.findOne({ code });
    if (!invite) return NextResponse.json({ message: "That invitation code wasn't recognized. Please check it and try again." }, { status: 404 });
    if (invite.name_key !== nameKey(name)) return NextResponse.json({ message: "The name doesn't match this invitation. Please use the name it was issued to." }, { status: 403 });
    return NextResponse.json({ message: "A response has already been recorded for this invitation. Please contact your hosts if you need to change it." }, { status: 409 });
  } catch (e) {
    console.error("RSVP error", e);
    return NextResponse.json({ message: "We're unable to process your RSVP right now. Please try again shortly." }, { status: 500 });
  }
}
