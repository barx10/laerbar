import { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 30;
const MAX_BUCKETS = 5000;

const buckets = new Map<string, { count: number; reset: number }>();

function clientId(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimitOk(req: NextRequest): boolean {
  const id = clientId(req);
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || bucket.reset < now) {
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, v] of buckets) {
        if (v.reset < now) buckets.delete(k);
      }
      if (buckets.size > MAX_BUCKETS) {
        const toDrop = buckets.size - MAX_BUCKETS;
        let i = 0;
        for (const k of buckets.keys()) {
          if (i++ >= toDrop) break;
          buckets.delete(k);
        }
      }
    }
    buckets.set(id, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX_PER_WINDOW) return false;
  bucket.count++;
  return true;
}

// Same-origin only. Browsers always set Origin on cross-origin fetches and on
// same-origin POSTs from app code, so cross-origin abuse and server-to-server
// curl both fail this check. Comparing against req.nextUrl.origin works
// automatically across prod, Vercel preview deploys, custom domains, and
// localhost without any env configuration.
function originOk(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return origin === req.nextUrl.origin;
}

export function guardApiRequest(req: NextRequest): Response | null {
  if (!originOk(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!rateLimitOk(req)) {
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) },
    });
  }
  return null;
}
