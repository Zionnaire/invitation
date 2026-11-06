import type { NextRequest } from "next/server";
import { rateLimits } from "./mongo";

export function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Returns true if the request is allowed. Counters live in MongoDB (TTL-expiring), so they work across serverless instances. */
export async function allow(scope: string, ip: string, limit: number, windowSec: number) {
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const col = await rateLimits();
  const doc = await col.findOneAndUpdate(
    { _id: `${scope}:${ip}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date((bucket + 1) * windowSec * 1000 + 60_000) } },
    { upsert: true, returnDocument: "after" }
  );
  return (doc?.count ?? 1) <= limit;
}
