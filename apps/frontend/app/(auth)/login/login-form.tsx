"use client";

import { useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";

import { login } from "@/app/actions/auth";

import styles from "../auth.module.css";
import {
  FormAlert,
  PasswordField,
  SubmitButton,
  TextField,
} from "../form-fields";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className={styles.form} noValidate>
      <FormAlert message={state?.message} />

      <TextField
        name="email"
        label="E-mail"
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com"
        defaultValue={state?.email}
        autoFocus
        error={state?.errors?.email?.[0]}
      />

      <PasswordField
        autoComplete="current-password"
        placeholder="Sua senha"
        error={state?.errors?.password?.[0]}
      />

      <SubmitButton pending={pending} pendingLabel="Entrando…">
        Entrar
        <ArrowRight size={18} aria-hidden />
      </SubmitButton>
    </form>
  );
}
