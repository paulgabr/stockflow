import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import styles from "./empty-state.module.css";

type EmptyStateProps = {
  icon: ComponentType<LucideProps>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon size={22} aria-hidden />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
