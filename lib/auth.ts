import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ar_host_session";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
function safeEqual(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function passwordMatches(supplied: string) {
  const real = process.env.ADMIN_PASSWORD;
  return !!real && real.length >= 8 && safeEqual(supplied, real);
}
/** Token = expiry.nonce.signature. Contains no secrets; unforgeable without SESSION_SECRET. */
export function makeSession() {
  const value = `${Date.now() + MAX_AGE_MS}.${randomBytes(16).toString("hex")}`;
  return `${value}.${sign(value)}`;
}
export function validSession(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  const expected = sign(`${exp}.${nonce}`);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  return Number.isFinite(Number(exp)) && Date.now() < Number(exp);
}
export async function isAdmin() {
  return validSession((await cookies()).get(COOKIE)?.value);
}
export const cookieName = COOKIE;
export const sessionMaxAgeSec = MAX_AGE_MS / 1000;
