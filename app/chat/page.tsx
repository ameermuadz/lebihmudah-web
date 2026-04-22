import type { Metadata } from "next";
import ChatWindow from "@/components/ChatWindow";

export const metadata: Metadata = {
  title: "Platform Chatbot",
  description:
    "Theme-aware LebihMudah chatbot preview for property search and future agentic workflows.",
};

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 md:p-6">
      <div className="mx-auto max-w-4xl">
        <ChatWindow />
      </div>
    </main>
  );
}
