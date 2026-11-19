"use server";

import { redirect } from "next/navigation";
import * as z from "zod";

import { API_URL } from "@/lib/api";
import { forwardedForHeader } from "@/lib/client-ip";
import { createSession, deleteSession } from "@/lib/session";

const TOO_MANY_ATTEMPTS_MESSAGE =
  "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";

const UNAVAILABLE_MESSAGE =
  "Não foi possível conectar ao servidor. Tente novamente em instantes.";

const LoginSchema = z.object({
  email: z.email({ error: "Digite um e-mail válido." }).trim(),
  password: z.string().min(1, { error: "Digite sua senha." }),
});

const RegisterSchema = z.object({
  name: z.string().trim().min(2, { error: "Digite seu nome." }),
  companyName: z
    .string()
    .trim()
    .min(2, { error: "Digite o nome da empresa." }),
  email: z.email({ error: "Digite um e-mail válido." }).trim(),
  password: z
    .string()
    .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." }),
});

export type LoginState =
  | {
      email?: string;
      errors?: { email?: string[]; password?: string[] };
      message?: string;
    }
  | undefined;

export type RegisterState =
  | {
      values?: { name: string; companyName: string; email: string };
      errors?: {
        name?: string[];
        companyName?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

type LoginResponse = {
  accessToken: string;
};

type AuthResult = "ok" | "invalid" | "throttled" | "unavailable" | "error";

async function postJson(path: string, body: unknown) {
  try {
    return await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await forwardedForHeader()),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

async function authenticate(
  email: string,
  password: string,
): Promise<AuthResult> {
  const response = await postJson("/auth/login", { email, password });

  if (!response) {
    return "unavailable";
  }

  if (response.status === 401) {
    return "invalid";
  }

  if (response.status === 429) {
    return "throttled";
  }

  if (!response.ok) {
    return "error";
  }

  const { accessToken } = (await response.json()) as LoginResponse;

  await createSession(accessToken);

  return "ok";
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = getString(formData, "email");

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

  const result = await authenticate(
    validatedFields.data.email,
    validatedFields.data.password,
  );

  if (result === "unavailable") {
    return { email, message: UNAVAILABLE_MESSAGE };
  }

  if (result === "invalid") {
    return { email, message: "E-mail ou senha incorretos." };
  }

  if (result === "throttled") {
    return { email, message: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  if (result === "error") {
    return { email, message: "Algo deu errado ao entrar. Tente novamente." };
  }

  redirect("/dashboard");
}

export async function register(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    name: getString(formData, "name"),
    companyName: getString(formData, "companyName"),
    email: getString(formData, "email"),
  };

  const validatedFields = RegisterSchema.safeParse({
    ...values,
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      values,
      errors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const response = await postJson("/auth/register", validatedFields.data);

  if (!response) {
    return { values, message: UNAVAILABLE_MESSAGE };
  }

  if (response.status === 429) {
    return { values, message: TOO_MANY_ATTEMPTS_MESSAGE };
  }

  if (response.status === 409) {
    return {
      values,
      errors: { email: ["Este e-mail já está cadastrado."] },
    };
  }

  if (!response.ok) {
    return {
      values,
      message: "Não foi possível criar sua conta. Tente novamente.",
    };
  }

  const result = await authenticate(
    validatedFields.data.email,
    validatedFields.data.password,
  );

  redirect(result === "ok" ? "/dashboard" : "/login");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
