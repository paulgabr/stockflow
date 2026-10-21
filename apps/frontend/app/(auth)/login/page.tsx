import type { Metadata } from "next";
import Link from "next/link";

import styles from "../auth.module.css";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · StockFlow",
};

export default function LoginPage() {
  return (
    <>
      <header className={styles.formHeader}>
        <h2>Entrar</h2>
        <p>Bem-vindo de volta. Acesse sua conta para continuar.</p>
      </header>

      <LoginForm />

      <p className={styles.switch}>
        Ainda não tem conta? <Link href="/register">Criar conta</Link>
      </p>
    </>
  );
}
