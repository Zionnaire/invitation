import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { isAdmin } from "@/lib/auth";
import { invitations, MAX_INVITATIONS, nameKey } from "@/lib/mongo";

const unauthorized = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  try {
    const rows = await (await invitations()).find({}).sort({ created_at: 1 }).toArray();
    return NextResponse.json({
      max: MAX_INVITATIONS,
      invitations: rows.map((r) => ({ id: String(r._id), guest_name: r.guest_name, code: r.code, status: r.status, responded_at: r.responded_at }))
    });
  } catch (e) {
    console.error("Load invitations", e);
    return NextResponse.json({ message: "Could not load invitations." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const { guest_name } = await req.json();
    const guestName = String(guest_name || "").trim().replace(/\s+/g, " ");
    if (guestName.length < 2 || guestName.length > 100) return NextResponse.json({ message: "Enter a valid guest name." }, { status: 400 });
    const col = await invitations();
    const key = nameKey(guestName);
    if (await col.findOne({ name_key: key })) return NextResponse.json({ message: "An invitation already exists for that name." }, { status: 409 });

    // Take the lowest free seat; the unique index on `seat` makes the 16-invitation cap race-proof.
    for (let attempt = 0; attempt < 6; attempt++) {
      const used = new Set((await col.find({}, { projection: { seat: 1 } }).toArray()).map((d) => d.seat));
      let seat = 0;
      for (let s = 1; s <= MAX_INVITATIONS; s++) if (!used.has(s)) { seat = s; break; }
      if (!seat) return NextResponse.json({ message: `All ${MAX_INVITATIONS} invitations have been issued.` }, { status: 409 });
      const code = `AR-${randomBytes(4).toString("hex").toUpperCase()}`;
      try {
        await col.insertOne({ seat, guest_name: guestName, name_key: key, code, status: "pending", responded_at: null, created_at: new Date() });
        return NextResponse.json({ ok: true, message: `Invitation created for ${guestName}. Code: ${code}` });
      } catch (e) {
        if ((e as { code?: number }).code === 11000) continue; // seat or code collision: retry
        throw e;
      }
    }
    return NextResponse.json({ message: "Could not create the invitation. Please try again." }, { status: 500 });
  } catch (e) {
    console.error("Create invitation", e);
    return NextResponse.json({ message: "Could not create the invitation. Please try again." }, { status: 500 });
  }
}

/** Remove an invitation (e.g. misspelt name) so its seat can be reissued. */
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return unauthorized();
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid invitation." }, { status: 400 });
    const r = await (await invitations()).deleteOne({ _id: new ObjectId(id) });
    return r.deletedCount ? NextResponse.json({ ok: true, message: "Invitation removed." }) : NextResponse.json({ message: "Invitation not found." }, { status: 404 });
  } catch (e) {
    console.error("Delete invitation", e);
    return NextResponse.json({ message: "Could not remove the invitation." }, { status: 500 });
  }
}
