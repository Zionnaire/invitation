# Ademi & Rasheed — Digital Invitation

A mobile-first invitation and private RSVP application for the November 27, 2026 celebration.

## Included
- Invitation page in ivory, burgundy and champagne gold.
- RSVP form with name + unique invitation code verification.
- One response per code; no plus-one field.
- RSVP deadline enforced server-side: November 24, 2026 (US Central time).
- Private password-protected host dashboard at `/admin`.
- Issue up to 16 named invitations (cap enforced atomically in the database), view status counts, copy invite text, remove unanswered invitations, export CSV.
- MongoDB Atlas persistence; Vercel deployment ready.
- Rate limiting on RSVP and admin sign-in; security headers.

## 1. Create the database (free MongoDB Atlas M0)
1. Create a cluster at https://www.mongodb.com/atlas.
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → allow access from anywhere (`0.0.0.0/0`); Vercel uses changing IPs, and the database user's password is the protection.
4. **Connect → Drivers** → copy the connection string.
Collections and indexes are created automatically on first use.

## 2. Configure environment variables
Copy `.env.example` to `.env.local` (or `.env`) for local development, then fill in:
- `NEXT_PUBLIC_SITE_URL` — local URL for development, deployed URL after deployment.
- `MONGODB_URI` — Atlas connection string (secret).
- `MONGODB_DB` — database name (default `ademi_rasheed`).
- `ADMIN_PASSWORD` — a long, unique host dashboard password (min 8 characters).
- `SESSION_SECRET` — random secret of at least 32 characters.

Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## 3. Run locally
Requires Node.js 20.9 or later.
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## 4. Deploy to Vercel
1. Create a GitHub repository and upload the contents of this folder (never commit `.env` files).
2. Import that repository at https://vercel.com/new.
3. Keep the detected framework as **Next.js**.
4. Add all five environment variables from `.env.example` in Vercel Project Settings → Environment Variables.
5. Deploy. Add the final Vercel URL to `NEXT_PUBLIC_SITE_URL` and redeploy.

## 5. Issue invitations
1. Visit `https://YOUR-VERCEL-DOMAIN.vercel.app/admin`.
2. Sign in with `ADMIN_PASSWORD`.
3. Enter each guest's name and select **Create invitation code**.
4. Use **Copy invite** and privately send that guest the text (site link + code).
5. The guest opens the invitation, selects RSVP NOW, enters the exact invited name and code, and accepts or declines.
6. Use the dashboard to monitor responses and export the list.

**Important:** No more than 16 invitations can exist. Each code is for one named guest and can be used once. The public page does not expose the guest list.

## Event details
- Friday, November 27, 2026
- 6:00 PM – 10:00 PM
- Perry's Steakhouse & Grille
- 1780 E Golf Road, Schaumburg, IL 60173
- Formal attire
- RSVP deadline: Tuesday, November 24, 2026

## Security notes
- Never commit `.env*` files or expose `MONGODB_URI` in client-side code.
- The admin session cookie is HTTP-only, SameSite=Strict, and contains only an expiry, random nonce and HMAC signature (no password).
- Sign-in and RSVP attempts are rate limited per IP (counters stored in MongoDB with automatic expiry).
- The database is accessed only from server routes.
