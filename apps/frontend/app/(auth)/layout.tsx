import { Boxes, History, ShieldCheck, Zap } from "lucide-react";

import styles from "./auth.module.css";
import { FlowLanes } from "./flow-lanes";

const features = [
  { icon: Zap, text: "Entradas e saídas atualizam o saldo na hora" },
  { icon: History, text: "Histórico completo de cada movimentação" },
  { icon: ShieldCheck, text: "Dados da sua empresa isolados e protegidos" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <div className={styles.formWrap}>{children}</div>
      </section>
    </main>
  );
}
