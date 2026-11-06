"use client";
import { useEffect, useState } from "react";

type Guest = { id: string; guest_name: string; code: string; status: string; responded_at: string | null };

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [max, setMax] = useState(16);
  const [guestName, setGuestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const r = await fetch("/api/admin/invitations");
    if (r.ok) {
      const d = await r.json();
      setGuests(d.invitations);
      setMax(d.max ?? 16);
      setAuthed(true);
    }
  }
  useEffect(() => { void load(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const d = await r.json();
      if (r.ok) { setPassword(""); await load(); } else setMessage(d.message || "Unable to sign in.");
    } catch { setMessage("Unable to sign in. Please try again."); }
    setBusy(false);
  }
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false); setGuests([]); setMessage("");
  }
  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/admin/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guest_name: guestName }) });
      const d = await r.json();
      setMessage(d.message || "");
      if (r.ok) { setGuestName(""); await load(); }
    } catch { setMessage("Could not create the invitation. Please try again."); }
    setBusy(false);
  }
  async function remove(g: Guest) {
    const answered = g.status !== "pending" ? ` They have already ${g.status === "accepted" ? "accepted" : "declined"}, and that response will be deleted.` : "";
    if (!confirm(`Remove the invitation for ${g.guest_name}? Their code will stop working.${answered}`)) return;
    const r = await fetch(`/api/admin/invitations?id=${encodeURIComponent(g.id)}`, { method: "DELETE" });
    const d = await r.json();
    setMessage(d.message || "");
    if (r.ok) await load();
  }
  async function copyInvite(g: Guest) {
    const text = `${g.guest_name}, you're invited to Ademi & Rasheed's celebration!\nYour personal invitation (tap to RSVP): ${window.location.origin}/?code=${g.code}\nOr open ${window.location.origin} and enter your code: ${g.code}`;
    try { await navigator.clipboard.writeText(text); setMessage(`Invitation text for ${g.guest_name} copied.`); }
    catch { setMessage("Could not copy. Please copy the code manually."); }
  }
  function exportCsv() {
    const rows = [["Guest", "Invitation code", "RSVP status", "Responded at"], ...guests.map((g) => [g.guest_name, g.code, g.status, g.responded_at || ""])];
    // Prefix cells that start with a formula character so spreadsheets never execute them.
    const safe = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
    const csv = rows.map((row) => row.map((v) => `"${safe(String(v)).replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "ademi-rasheed-rsvp.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (!authed) {
    return <main className="admin-wrap"><section className="admin-card">
      <p className="admin-kicker">ADEMI &amp; RASHEED</p><h1>Host access</h1><p>Sign in to manage your private guest list.</p>
      <form onSubmit={login}>
        <label>Admin password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button className="submit-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      {message && <p className="admin-message">{message}</p>}
    </section></main>;
  }

  const count = (s: string) => guests.filter((g) => g.status === s).length;
  const full = guests.length >= max;
  return <main className="admin-wrap"><section className="admin-dashboard">
    <p className="admin-kicker">ADEMI &amp; RASHEED · PRIVATE HOST DASHBOARD</p>
    <h1>Guest list &amp; RSVPs</h1>
    <div className="stats">
      <div><b>{count("accepted")}</b><span>Confirmed</span></div>
      <div><b>{count("declined")}</b><span>Declined</span></div>
      <div><b>{count("pending")}</b><span>Awaiting</span></div>
      <div><b>{guests.length}/{max}</b><span>Invitations issued</span></div>
    </div>
    <form className="add-guest" onSubmit={add}>
      <label>Issue an invitation<input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Guest's full name" required maxLength={100} /></label>
      <button className="submit-button" disabled={busy || full}>{full ? `All ${max} invitations issued` : busy ? "Creating…" : "Create invitation code"}</button>
    </form>
    {message && <p className="admin-message" role="status">{message}</p>}
    <div className="table-head"><h2>Invitations</h2><div><button className="export" onClick={exportCsv}>Export CSV ↓</button> <button className="export" onClick={logout}>Sign out</button></div></div>
    <div className="guest-list">{guests.map((g) =>
      <div className="guest-row" key={g.id}>
        <div><strong>{g.guest_name}</strong><small>{g.code}</small></div>
        <div className="row-actions">
          <button className="export" onClick={() => copyInvite(g)}>Copy invite</button>
          <button className="export" onClick={() => remove(g)}>Remove</button>
          <span className={`status ${g.status}`}>{g.status}</span>
        </div>
      </div>)}
    </div>
    <p className="admin-hint">Each code is single-use and tied to the guest name entered above. Share each code privately with its named guest. Removing an invitation (even one that has responded) deletes its code and response, and frees the seat.</p>
  </section></main>;
}
