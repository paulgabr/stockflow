"use server";

import { redirect } from "next/navigation";
import * as z from "zod";

import { API_URL } from "@/lib/api";
import { createSession, deleteSession } from "@/lib/session";

const LoginSchema = z.object({
  email: z.email({ error: "Digite um e-mail válido." }).trim(),
  password: z.string().min(1, { error: "Digite sua senha." }),
});

export type LoginState =
  | {
      email?: string;
      errors?: { email?: string[]; password?: string[] };
      message?: string;
    }
  | undefined;

type LoginResponse = {
  accessToken: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");

  const validatedFields = LoginSchema.safeParse({
    email,
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      email,
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validatedFields.data),
      cache: "no-store",
    });
  } catch {
    return {
      email,
      message:
        "Não foi possível conectar ao servidor. Tente novamente em instantes.",
    };
  }

  if (response.status === 401) {
    return { email, message: "E-mail ou senha incorretos." };
  }

  if (!response.ok) {
    return { email, message: "Algo deu errado ao entrar. Tente novamente." };
  }

  const { accessToken } = (await response.json()) as LoginResponse;

  await createSession(accessToken);

  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
