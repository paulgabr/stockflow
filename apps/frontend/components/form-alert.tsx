import { AlertCircle } from "lucide-react";

import styles from "./form-dialog.module.css";

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
