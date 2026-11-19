import "server-only";

import { headers } from "next/headers";

// The API sees every request coming from this server, so the user's IP is
// forwarded for its per-IP rate limits. The rightmost X-Forwarded-For entry is
// the one added by the proxy closest to us (or by Next.js itself from the
// socket); entries to its left come from the client and can be spoofed.
export async function getClientIp() {
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .at(-1);

  return ip || undefined;
}

export async function forwardedForHeader(): Promise<Record<string, string>> {
  const ip = await getClientIp();

  return ip ? { "X-Forwarded-For": ip } : {};
}
