"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import { logout } from "@/app/actions/auth";
import { SIDEBAR_COOKIE } from "@/lib/sidebar-cookie";

import styles from "./app-shell.module.css";

const navItems = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/movements", label: "Movimentações", icon: ArrowLeftRight },
];

type ShellUser = {
  name: string;
  companyName: string;
};

type AppShellProps = {
  user: ShellUser;
  defaultCollapsed: boolean;
  children: ReactNode;
};

export function AppShell({ user, defaultCollapsed, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <Tooltip.Provider delayDuration={150}>
      <div className={styles.shell} data-collapsed={collapsed || undefined}>
        <aside className={styles.sidebar}>
          <SidebarContent
            user={user}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
          />
        </aside>

        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <header className={styles.topbar}>
            <Logo />
            <Dialog.Trigger className={styles.iconButton} aria-label="Abrir menu">
              <Menu size={20} />
            </Dialog.Trigger>
          </header>

          <Dialog.Portal>
            <Dialog.Overlay className={styles.overlay} />
            <Dialog.Content className={styles.drawer}>
              <Dialog.Title className="visually-hidden">Menu</Dialog.Title>
              <Dialog.Description className="visually-hidden">
                Navegação principal do StockFlow
              </Dialog.Description>
              <Dialog.Close
                className={`${styles.iconButton} ${styles.drawerClose}`}
                aria-label="Fechar menu"
              >
                <X size={20} />
              </Dialog.Close>
              <SidebarContent
                user={user}
                collapsed={false}
                onNavigate={() => setMenuOpen(false)}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <main className={styles.main}>{children}</main>
      </div>
    </Tooltip.Provider>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className={styles.logo}>
      <span className={styles.logoMark}>
        <Boxes size={18} strokeWidth={2.25} aria-hidden />
      </span>
      <span className={styles.logoText}>StockFlow</span>
    </Link>
  );
}

type SidebarContentProps = {
  user: ShellUser;
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
};

function SidebarContent({
  user,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className={styles.sidebarInner}>
      <div className={styles.sidebarHeader}>
        <Logo />
      </div>

      <nav className={styles.nav} aria-label="Principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <WithTooltip key={href} enabled={collapsed} label={label}>
              <Link
                href={href}
                className={styles.navLink}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon size={20} aria-hidden />
                <span className={styles.navLabel}>{label}</span>
              </Link>
            </WithTooltip>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        {onToggleCollapsed && (
          <WithTooltip enabled={collapsed} label="Expandir menu">
            <button
              type="button"
              className={styles.navLink}
              onClick={onToggleCollapsed}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <PanelLeftOpen size={20} aria-hidden />
              ) : (
                <PanelLeftClose size={20} aria-hidden />
              )}
              <span className={styles.navLabel}>
                {collapsed ? "Expandir menu" : "Recolher menu"}
              </span>
            </button>
          </WithTooltip>
        )}

        <div className={styles.userCard}>
          <span className={styles.avatar} aria-hidden>
            {getInitials(user.name)}
          </span>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userCompany}>{user.companyName}</span>
          </div>
          <form action={logout} className={styles.logoutForm}>
            <WithTooltip enabled label="Sair">
              <button
                type="submit"
                className={styles.iconButton}
                aria-label="Sair"
              >
                <LogOut size={18} />
              </button>
            </WithTooltip>
          </form>
        </div>
      </div>
    </div>
  );
}

type WithTooltipProps = {
  enabled: boolean;
  label: string;
  children: ReactNode;
};

function WithTooltip({ enabled, label, children }: WithTooltipProps) {
  if (!enabled) {
    return children;
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="right" sideOffset={10} className={styles.tooltip}>
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
