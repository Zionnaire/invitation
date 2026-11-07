"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Choice = "accepted" | "declined";
type Guest = { name: string; status: "pending" | Choice };
type Step = "code" | "respond" | "done";

const Corner = ({ className }: { className: string }) => (
  <svg className={`corner ${className}`} viewBox="0 0 38 38" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <path d="M1 37V1h36" /><path d="M7 31V7h24" /><rect x="11" y="11" width="5" height="5" transform="rotate(45 13.5 13.5)" fill="currentColor" stroke="none" />
  </svg>
);

export default function Invitation() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [guest, setGuest] = useState<Guest | null>(null);
  const [choice, setChoice] = useState<Choice>("accepted");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const reset = () => { setStep("code"); setGuest(null); setError(""); setDoneMsg(""); setChoice("accepted"); };

  const lookup = useCallback(async (value: string) => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/rsvp/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: value.trim() }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong."); return; }
      setGuest({ name: data.name, status: data.status });
      if (data.status === "pending") setStep("respond");
      else {
        setDoneMsg(data.status === "accepted" ? "You have already accepted — we look forward to seeing you." : "You have already let us know you can't make it.");
        setStep("done");
      }
    } catch { setError("We couldn't reach the server. Please try again."); }
    finally { setBusy(false); }
  }, []);

  // A personal link like /?code=AR-XXXXXXXX opens the dialog and greets the guest straight away.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("code");
    if (c) { setCode(c.toUpperCase()); setOpen(true); void lookup(c); }
  }, [lookup]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim(), status: choice }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong."); return; }
      setDoneMsg(data.message); setGuest((g) => (g ? { ...g, status: choice } : g)); setStep("done");
    } catch { setError("We couldn't submit your response. Please try again."); }
    finally { setBusy(false); }
  }

  const first = guest?.name.split(" ")[0] ?? "";

  return <main>
    <header className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-photo">
        <Image src="/couple.jpg" alt="Ademi and Rasheed smiling together" fill priority sizes="(max-width: 560px) 100vw, 420px" />
      </div>
      <div className="hero-copy">
        <p className="kicker rise" style={{ "--d": ".2s" } as React.CSSProperties}>With full hearts and deep gratitude</p>
        <h1 className="hero-title rise" style={{ "--d": ".35s" } as React.CSSProperties}>The Beginning<br />of Forever</h1>
        <p className="hero-plus rise" style={{ "--d": ".45s" } as React.CSSProperties}>…plus one day more</p>
        <a className="btn rise" style={{ "--d": ".5s" } as React.CSSProperties} href="#invitation">Open invitation</a>
      </div>
    </header>
    <div className="stage" id="invitation">
    <article className="card">
      <div className="frame" aria-hidden="true" />
      <Corner className="tl" /><Corner className="tr" /><Corner className="bl" /><Corner className="br" />

      <p className="kicker rise">You are cordially invited</p>
      <h2 className="names rise" style={{ "--d": ".12s" } as React.CSSProperties} aria-label="Ademi and Rasheed">
        <span>Ademi</span><span className="amp foil">&amp;</span><span>Rasheed</span>
      </h2>
      <p className="theme foil rise" style={{ "--d": ".2s" } as React.CSSProperties}>The Beginning of Forever</p>
      <p className="plus rise" style={{ "--d": ".24s" } as React.CSSProperties}>…plus one day more</p>
      <p className="lede rise" style={{ "--d": ".28s" } as React.CSSProperties}>To celebrate the beginning of a beautiful journey as we unite in love, commitment, and friendship.</p>
      <div className="rule rise" style={{ "--d": ".32s" } as React.CSSProperties} aria-hidden="true"><i /></div>

      <section className="story rise" style={{ "--d": ".36s" } as React.CSSProperties}>
        <h3>A Journey of Love</h3>
        <p>Every beautiful love story is a journey, and ours is entering a new chapter. Two hearts, choosing one another, promising to grow together, stand together, and build a lifetime filled with love, laughter, faith, and endless memories.</p>
        <p>We would be honored to have you share in this special beginning and make memories with us that will last a lifetime.</p>
      </section>
      <div className="rule rise" style={{ "--d": ".4s" } as React.CSSProperties} aria-hidden="true"><i /></div>

      <section className="when rise" style={{ "--d": ".4s" } as React.CSSProperties} aria-label="Event details">
        <div className="day">
          <span className="dow">Friday</span>
          <span className="num foil">27</span>
          <span className="mon">November 2026</span>
        </div>
        <dl className="facts">
          <div><dt>Time</dt><dd>6:00 – 10:00 PM</dd></div>
          <div><dt>Venue</dt><dd>Perry’s Steakhouse &amp; Grille<small>1780 E Golf Road, Schaumburg, IL 60173</small></dd></div>
          <div><dt>Dress code</dt><dd>Formal attire</dd></div>
        </dl>
      </section>

      <section className="reply rise" style={{ "--d": ".5s" } as React.CSSProperties}>
        <h2>R.S.V.P.</h2>
        <p>Kindly reply by</p>
        <strong className="by">Tuesday, 24 November</strong>
        <button className="btn" onClick={() => { reset(); setOpen(true); }}>Reply to invitation</button>
        <p className="note">Have your personal invitation code ready.</p>
      </section>

      <p className="closing rise" style={{ "--d": ".6s" } as React.CSSProperties}>We look forward to celebrating with you!</p>
      <p className="fine">A personal invitation · For named guests only</p>
    </article>
    </div>

    {open && <div className="backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="rsvp-title">
        <button className="x" aria-label="Close" onClick={() => setOpen(false)}>×</button>

        {step === "code" && <form onSubmit={(e) => { e.preventDefault(); void lookup(code); }}>
          <p className="eyebrow">Ademi &amp; Rasheed</p>
          <h2 id="rsvp-title">Your invitation</h2>
          <p className="copy">Enter the code from your personal invitation and we&rsquo;ll find your place.</p>
          <label className="field">Invitation code
            <input className="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required maxLength={16} placeholder="AR-XXXXXXXX" autoCapitalize="characters" autoComplete="off" autoFocus />
          </label>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="submit-button" disabled={busy}>{busy ? "Looking…" : "Continue"}</button>
        </form>}

        {step === "respond" && guest && <form onSubmit={submit}>
          <p className="eyebrow">You&rsquo;re invited</p>
          <h2 id="rsvp-title">Welcome, {guest.name}</h2>
          <p className="copy">Will you be joining us on Friday, 27 November?</p>
          <div className="choices" role="radiogroup" aria-label="Your response">
            <label className="choice"><input type="radio" name="r" checked={choice === "accepted"} onChange={() => setChoice("accepted")} /> Joyfully accept</label>
            <label className="choice"><input type="radio" name="r" checked={choice === "declined"} onChange={() => setChoice("declined")} /> Regretfully decline</label>
          </div>
          {error && <p className="err" role="alert">{error}</p>}
          <button className="submit-button" disabled={busy}>{busy ? "Sending…" : "Send my reply"}</button>
          <p className="foot">This invitation is for {first || "you"} only and can&rsquo;t be transferred.</p>
        </form>}

        {step === "done" && guest && <div>
          <div className="mark"><b>{guest.status === "accepted" ? "✓" : "·"}</b></div>
          <h2 id="rsvp-title">{guest.status === "accepted" ? `See you soon, ${first}` : `Thank you, ${first}`}</h2>
          <p className="copy">{doneMsg}</p>
          <button className="submit-button" onClick={() => setOpen(false)}>Close</button>
        </div>}
      </section>
    </div>}
  </main>;
}
