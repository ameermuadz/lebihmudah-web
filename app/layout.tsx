import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LebihMudah.my Platform Layer",
  description:
    "Next.js platform layer for the LebihMudah.my agentic AI hackathon demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-slate-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
