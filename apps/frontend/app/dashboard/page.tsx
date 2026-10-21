import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { apiFetch } from "@/lib/api";

import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Dashboard · StockFlow",
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  company: { id: string; name: string };
};

export default async function DashboardPage() {
  const user = await apiFetch<CurrentUser>("/users/me");

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.company}>{user.company.name}</p>
        <h1>Olá, {user.name}</h1>
        <p className={styles.muted}>Você está conectado como {user.email}.</p>

        <form action={logout}>
          <button type="submit" className={styles.logout}>
            <LogOut size={16} aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
