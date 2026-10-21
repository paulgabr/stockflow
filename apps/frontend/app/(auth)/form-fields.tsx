"use client";

import {
  useState,
  type ChangeEvent,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  type LucideProps,
} from "lucide-react";

import styles from "./auth.module.css";

type TextFieldProps = {
  name: string;
  label: string;
  icon: ComponentType<LucideProps>;
  type?: "text" | "email";
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  error?: string;
};

export function TextField({
  name,
  label,
  icon: Icon,
  type = "text",
  autoComplete,
  placeholder,
  defaultValue,
  autoFocus,
  error,
}: TextFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap} data-invalid={!!error || undefined}>
        <Icon size={18} className={styles.inputIcon} aria-hidden />
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          required
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={styles.input}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordFieldProps = {
  name?: string;
  label?: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  error?: string;
  hint?: ReactNode;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function PasswordField({
  name = "password",
  label = "Senha",
  autoComplete,
  placeholder,
  error,
  hint,
  onChange,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const capsLockId = `${name}-caps-lock`;

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  const describedBy = [
    error && errorId,
    hint && hintId,
    capsLockOn && capsLockId,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap} data-invalid={!!error || undefined}>
        <Lock size={18} className={styles.inputIcon} aria-hidden />
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          onChange={onChange}
          onKeyDown={handleKey}
          onKeyUp={handleKey}
          onBlur={() => setCapsLockOn(false)}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
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
      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}
      {hint && <div id={hintId}>{hint}</div>}
      {capsLockOn && (
        <p id={capsLockId} className={styles.capsLock}>
          Caps Lock está ativado
        </p>
      )}
    </div>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className={styles.alert} role="alert">
      <AlertCircle size={18} aria-hidden />
      {message}
    </div>
  );
}

type SubmitButtonProps = {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
};

export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: SubmitButtonProps) {
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle size={18} className={styles.spinner} aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
