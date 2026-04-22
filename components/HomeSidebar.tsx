"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface HomeSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const HomeIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 10.5 12 4l9 6.5" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const ChatIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 5.5h16v10H9l-5 4v-4z" />
  </svg>
);

const BookingsIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M8 3.5v3" />
    <path d="M16 3.5v3" />
    <path d="M4 9.5h16" />
    <path d="M8 13h8" />
    <path d="M8 16h5" />
  </svg>
);

const DashboardIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 5.5h7v7H4z" />
    <path d="M13 5.5h7v4h-7z" />
    <path d="M13 11.5h7v7h-7z" />
    <path d="M4 14.5h7v4H4z" />
  </svg>
);

const LoginIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 7.5V5.5A1.5 1.5 0 0 1 11.5 4h6A1.5 1.5 0 0 1 19 5.5v13A1.5 1.5 0 0 1 17.5 20h-6A1.5 1.5 0 0 1 10 18.5v-2" />
    <path d="m4 12 6 0" />
    <path d="m7.5 8.5L11 12l-3.5 3.5" />
  </svg>
);

const PlusIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 5.5v13" />
    <path d="M5.5 12h13" />
  </svg>
);

const LogoutIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 16.5 14.5 12 10 7.5" />
    <path d="M14.5 12H4" />
    <path d="M16.5 4.5H19a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 19.5h-2.5" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 6.5 8.5 12l6 5.5" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.5 6.5 15.5 12l-6 5.5" />
  </svg>
);

const navItems = [
  {
    href: "/",
    label: "Property Search",
    icon: HomeIcon,
  },
  {
    href: "/chat",
    label: "Chat Simulator",
    icon: ChatIcon,
  },
  {
    href: "/bookings",
    label: "My Bookings",
    icon: BookingsIcon,
  },
  {
    href: "/owner-dashboard",
    label: "Owner Dashboard",
    icon: DashboardIcon,
  },
];

export default function HomeSidebar({
  isCollapsed,
  onToggleCollapse,
}: HomeSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? "G";

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (!response.ok) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as { user?: SessionUser };
        if (isMounted) {
          setUser(data.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      setUser(null);
      router.refresh();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`sticky top-4 h-fit overflow-hidden rounded-[32px] border border-zinc-300 bg-white shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)] transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900 ${
        isCollapsed ? "px-3 py-3" : "p-4"
      }`}
      aria-label="Sidebar navigation"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-semibold text-white shadow-sm">
                {userInitial}
              </div>
              {user ? (
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:border-rose-700 dark:hover:bg-rose-950"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-semibold text-white shadow-sm">
                  {userInitial}
                </div>
                {user ? (
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
                ) : null}
              </div>

              <div className="min-w-0 text-left">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  {isLoading ? "Loading" : user ? "Signed in" : "Guest"}
                </p>
                <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {user ? user.name : "Welcome guest"}
                </h2>
                <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                  {user ? user.email : "Login to enable bookings"}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-2 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveLink(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                  active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={isCollapsed ? "sr-only" : "truncate"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            {user ? null : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  aria-label="Login"
                  title="Login"
                >
                  <LoginIcon className="h-5 w-5 shrink-0" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Sign Up"
                  title="Sign Up"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" />
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-[24px] border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950">
            {user ? (
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:border-rose-700 dark:hover:bg-rose-950"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogoutIcon className="h-5 w-5 shrink-0" />
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            ) : (
              <div className="grid gap-2">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  aria-label="Login"
                  title="Login"
                >
                  <LoginIcon className="h-5 w-5 shrink-0" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Sign Up"
                  title="Sign Up"
                >
                  <PlusIcon className="h-5 w-5 shrink-0" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
