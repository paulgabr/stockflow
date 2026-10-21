"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";

import { login } from "@/app/actions/auth";

import styles from "./login.module.css";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const emailError = state?.errors?.email?.[0];
  const passwordError = state?.errors?.password?.[0];

  function handlePasswordKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  return (
    <form action={action} className={styles.form} noValidate>
      {state?.message && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} aria-hidden />
          {state.message}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          E-mail
        </label>
        <div className={styles.inputWrap} data-invalid={!!emailError || undefined}>
          <Mail size={18} className={styles.inputIcon} aria-hidden />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            defaultValue={state?.email}
            autoFocus
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            className={styles.input}
          />
        </div>
        {emailError && (
          <p id="email-error" className={styles.fieldError}>
            {emailError}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Senha
        </label>
        <div
          className={styles.inputWrap}
          data-invalid={!!passwordError || undefined}
        >
          <Lock size={18} className={styles.inputIcon} aria-hidden />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Sua senha"
            required
            onKeyDown={handlePasswordKey}
            onKeyUp={handlePasswordKey}
            onBlur={() => setCapsLockOn(false)}
            aria-invalid={!!passwordError}
            aria-describedby={
              [passwordError && "password-error", capsLockOn && "caps-lock"]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={styles.input}
          />
          <button
            type="button"
            className={styles.revealButton}
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {passwordError && (
          <p id="password-error" className={styles.fieldError}>
            {passwordError}
          </p>
        )}
        {capsLockOn && (
          <p id="caps-lock" className={styles.capsLock}>
            Caps Lock está ativado
          </p>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle size={18} className={styles.spinner} aria-hidden />
            Entrando…
          </>
        ) : (
          <>
            Entrar
            <ArrowRight size={18} aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
