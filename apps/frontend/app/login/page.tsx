import type { Metadata } from "next";
import { Boxes, History, ShieldCheck, Zap } from "lucide-react";

import { FlowLanes } from "./flow-lanes";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Entrar · StockFlow",
};

const features = [
  { icon: Zap, text: "Entradas e saídas atualizam o saldo na hora" },
  { icon: History, text: "Histórico completo de cada movimentação" },
  { icon: ShieldCheck, text: "Dados da sua empresa isolados e protegidos" },
];

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>
            <Boxes size={18} strokeWidth={2.25} aria-hidden />
          </span>
          StockFlow
        </div>

        <div className={styles.brandCopy}>
          <h1 className={styles.headline}>
            Seu estoque, sempre <em>em movimento.</em>
          </h1>
          <p className={styles.tagline}>
            Controle entradas, saídas e o saldo de cada produto em um só lugar.
          </p>
        </div>

        <FlowLanes />

        <ul className={styles.features}>
          {features.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={16} aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel}>
        <div className={styles.formWrap}>
          <header className={styles.formHeader}>
            <h2>Entrar</h2>
            <p>Bem-vindo de volta. Acesse sua conta para continuar.</p>
          </header>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}
