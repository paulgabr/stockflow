import "server-only";

import { cache } from "react";

import { apiFetch } from "./api";
import type { CurrentUser } from "./types";

export const getCurrentUser = cache(() => apiFetch<CurrentUser>("/users/me"));
