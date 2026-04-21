import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
