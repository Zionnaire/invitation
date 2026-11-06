import { MongoClient, type Collection } from "mongodb";

export const MAX_INVITATIONS = 16;

export type Invitation = {
  seat: number; // 1..MAX_INVITATIONS, unique -> enforces the cap atomically
  guest_name: string;
  name_key: string; // normalized name used for matching
  code: string;
  status: "pending" | "accepted" | "declined";
  responded_at: Date | null;
  created_at: Date;
};

type RateLimit = { _id: string; count: number; expireAt: Date };

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexes?: Promise<void> };

function client() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Database is not configured. Add MONGODB_URI.");
  return (g._mongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect());
}

async function database() {
  const c = await client();
  const d = c.db(process.env.MONGODB_DB || "ademi_rasheed");
  g._indexes ??= (async () => {
    await d.collection("invitations").createIndex({ code: 1 }, { unique: true });
    await d.collection("invitations").createIndex({ seat: 1 }, { unique: true });
    await d.collection("rate_limits").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
  })().catch((e) => { g._indexes = undefined; throw e; });
  await g._indexes;
  return d;
}

export async function invitations(): Promise<Collection<Invitation>> {
  return (await database()).collection<Invitation>("invitations");
}
export async function rateLimits(): Promise<Collection<RateLimit>> {
  return (await database()).collection<RateLimit>("rate_limits");
}

export const nameKey = (s: string) => s.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
