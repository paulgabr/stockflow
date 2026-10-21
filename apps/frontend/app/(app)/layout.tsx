import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/current-user";
import { SIDEBAR_COOKIE } from "@/lib/sidebar-cookie";

import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()]);
  const collapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <AppShell
      user={{ name: user.name, companyName: user.company.name }}
      defaultCollapsed={collapsed}
    >
      {children}
    </AppShell>
  );
}
