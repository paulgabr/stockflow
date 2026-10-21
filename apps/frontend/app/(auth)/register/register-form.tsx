"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Building2, Mail, User } from "lucide-react";

import { register } from "@/app/actions/auth";

import styles from "../auth.module.css";
import {
  FormAlert,
  PasswordField,
  SubmitButton,
  TextField,
} from "../form-fields";

const MIN_PASSWORD_LENGTH = 8;

const strengthLabels = ["Muito curta", "Fraca", "Boa", "Forte"];

function getPasswordStrength(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 0;
  }

  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((rule) =>
    rule.test(password),
  ).length;

  if (password.length >= 12 && variety >= 3) {
    return 3;
  }

  return variety >= 2 ? 2 : 1;
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  const [password, setPassword] = useState("");

  const strength = getPasswordStrength(password);

  return (
    <form
      action={action}
      onReset={() => setPassword("")}
      className={styles.form}
      noValidate
    >
      <FormAlert message={state?.message} />

      <TextField
        name="name"
        label="Seu nome"
        icon={User}
        autoComplete="name"
        placeholder="Como devemos te chamar?"
        defaultValue={state?.values?.name}
        autoFocus
        error={state?.errors?.name?.[0]}
      />

      <TextField
        name="companyName"
        label="Nome da empresa"
        icon={Building2}
        autoComplete="organization"
        placeholder="Ex.: Mercearia do Bairro"
        defaultValue={state?.values?.companyName}
        error={state?.errors?.companyName?.[0]}
      />

      <TextField
        name="email"
        label="E-mail"
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com"
        defaultValue={state?.values?.email}
        error={state?.errors?.email?.[0]}
      />

      <PasswordField
        autoComplete="new-password"
        placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
        error={state?.errors?.password?.[0]}
        onChange={(event) => setPassword(event.target.value)}
        hint={
          password ? (
            <div className={styles.strength} data-level={strength}>
              <div className={styles.strengthBars} aria-hidden>
                <span />
                <span />
                <span />
              </div>
              <span className={styles.strengthLabel}>
                {strengthLabels[strength]}
              </span>
            </div>
          ) : (
            <p className={styles.hint}>
              Use letras, números e símbolos para uma senha mais forte.
            </p>
          )
        }
      />

      <SubmitButton pending={pending} pendingLabel="Criando conta…">
        Criar conta
        <ArrowRight size={18} aria-hidden />
      </SubmitButton>
    </form>
  );
}
