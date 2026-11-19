import "server-only";

import { redirect } from "next/navigation";

import { forwardedForHeader } from "./client-ip";
import { getSessionToken } from "./session";

export const API_URL = process.env.API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    path: string,
  ) {
    super(`API request failed: ${status} ${path}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const [token, forwardedFor] = await Promise.all([
    getSessionToken(),
    forwardedForHeader(),
  ]);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...forwardedFor,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    redirect("/logout");
  }

  if (!response.ok) {
    throw new ApiError(response.status, path);
  }

  return response.json() as Promise<T>;
}
