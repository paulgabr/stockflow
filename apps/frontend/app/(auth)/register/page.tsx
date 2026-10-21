import type { Metadata } from "next";
import Link from "next/link";

import styles from "../auth.module.css";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Criar conta · StockFlow",
};

export default function RegisterPage() {
  return (
    <>
      <header className={styles.formHeader}>
        <h2>Criar conta</h2>
        <p>Cadastre sua empresa e comece a controlar seu estoque.</p>
      </header>

      <RegisterForm />

      <p className={styles.switch}>
        Já tem uma conta? <Link href="/login">Entrar</Link>
      </p>
    </>
  );
}
