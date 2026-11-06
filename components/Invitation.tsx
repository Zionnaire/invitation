"use client";

import { useState } from "react";

type Result = { ok: boolean; message: string; status?: "accepted" | "declined" };

export default function Invitation() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"accepted" | "declined">("accepted");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), name: name.trim(), status })
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message || "Something went wrong.", status: data.status });
    } catch {
      setResult({ ok: false, message: "We couldn't submit your response. Please try again." });
    } finally { setBusy(false); }
  }

  return <main className="page-shell">
    <article className="invitation">
      <div className="corner corner-tl" /><div className="corner corner-br" />
      <div className="fine-frame" />
      <header className="eyebrow"><span>An intimate celebration</span><i /> <span>with</span></header>
      <section className="names" aria-label="Ademi and Rasheed">
        <div>Ademi <em>&amp;</em></div><div>Rasheed</div>
      </section>
      <p className="intro">Join us for an evening of good food,<br className="desktop-break" /> great company and celebration.</p>
      <div className="gold-rule"><span /></div>

      <section className="details" aria-label="Event details">
        <div className="detail">
          <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="7" width="24" height="22" rx="2"/><path d="M10 3v8M22 3v8M4 13h24M10 18h3M19 18h3M10 23h3M19 23h3"/></svg>
          <strong>FRIDAY,<br/>NOVEMBER 27, 2026</strong>
        </div>
        <div className="detail">
          <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12"/><path d="M16 8v9l6 3"/></svg>
          <strong>6:00 PM –<br/>10:00 PM</strong>
        </div>
        <div className="detail venue">
          <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29s10-11 10-18a10 10 0 1 0-20 0c0 7 10 18 10 18Z"/><circle cx="16" cy="11" r="3.5"/></svg>
          <strong>Perry’s Steakhouse &amp; Grille</strong>
          <span>1780 E Golf Road<br/>Schaumburg, IL 60173</span>
        </div>
      </section>

      <div className="dress"><span className="dress-mark">✦</span><span className="dress-sep" /> DRESS CODE: FORMAL ATTIRE</div>

      <section className="rsvp-panel">
        <h2>R S V P</h2>
        <p>Kindly confirm your attendance by</p>
        <strong className="deadline">TUESDAY, NOVEMBER 24, 2026</strong>
        <p className="deadline-note">Three days before the celebration.</p>
        <button className="rsvp-button" onClick={() => { setOpen(true); setResult(null); }}>
          RSVP NOW <span aria-hidden="true">↗</span>
        </button>
        <p className="response-note">Your response helps us plan better.</p>
      </section>

      <footer className="closing">We look forward to celebrating with you!</footer>
      <p className="small-print">A personal invitation · Kindly note that invitations are for named guests only.</p>
    </article>

    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="rsvp-title">
        <button className="close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        {!result ? <>
          <p className="modal-kicker">ADEMI &amp; RASHEED</p>
          <h2 id="rsvp-title">Your RSVP</h2>
          <p className="modal-copy">Please use the name and invitation code provided with your personal invitation.</p>
          <form onSubmit={submit}>
            <label>Your full name<input value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" placeholder="Name on your invitation"/></label>
            <label>Invitation code<input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required maxLength={12} placeholder="e.g. AR-7K4P9Q" autoCapitalize="characters"/></label>
            <fieldset><legend>Your response</legend>
              <label className="choice"><input type="radio" checked={status === "accepted"} onChange={() => setStatus("accepted")}/> Joyfully accept</label>
              <label className="choice"><input type="radio" checked={status === "declined"} onChange={() => setStatus("declined")}/> Regretfully decline</label>
            </fieldset>
            <p className="no-plus">Each invitation is valid for one named guest and is not transferable.</p>
            <button className="submit-button" disabled={busy}>{busy ? "Submitting…" : "Submit response"}</button>
          </form>
          <p className="modal-foot">Please respond by November 24, 2026.</p>
        </> : <div className="result-view">
          <div className="result-mark">{result.ok ? "✓" : "!"}</div>
          <h2>{result.ok ? (result.status === "accepted" ? "We look forward to seeing you." : "Thank you for letting us know.") : "We couldn't complete that."}</h2>
          <p>{result.message}</p>
          <button className="submit-button" onClick={() => { if (result.ok) setOpen(false); else setResult(null); }}>{result.ok ? "Close" : "Try again"}</button>
        </div>}
      </section>
    </div>}
  </main>;
}
