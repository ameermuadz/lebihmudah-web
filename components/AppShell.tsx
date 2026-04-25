"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";
import HomeSidebar from "@/components/HomeSidebar";

const SIDEBAR_STORAGE_KEY = "lebihmudah-sidebar-collapsed";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarPreferenceReady, setIsSidebarPreferenceReady] =
    useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (savedCollapsed === "true" || savedCollapsed === "false") {
      setIsSidebarCollapsed(savedCollapsed === "true");
    }

    setIsSidebarPreferenceReady(true);
  }, []);

  useEffect(() => {
    if (!isSidebarPreferenceReady) {
      return;
    }

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed, isSidebarPreferenceReady]);

  return (
    <div
      className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 lg:flex-row lg:items-start"
      style={
        {
          "--sidebar-width": isSidebarCollapsed ? "5rem" : "18rem",
        } as CSSProperties
      }
    >
      <div className="w-full shrink-0 lg:sticky lg:top-6 lg:h-fit lg:w-[var(--sidebar-width)]">
        <HomeSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        />
      </div>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
