import "server-only";

import { cookies, headers } from "next/headers";

import { SESSION_COOKIE } from "./session-cookie";

const SESSION_MAX_AGE_SECONDS = 60 * 60;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Safari drops `Secure` cookies on http://localhost, which would log the user
// out right after signing in to a local production build (`next start`).
async function shouldUseSecureCookie() {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const host = (await headers()).get("host") ?? "";
  const hostname = host.replace(/:\d+$/, "");

  return !LOCAL_HOSTNAMES.has(hostname);
}

export async function createSession(accessToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: await shouldUseSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
