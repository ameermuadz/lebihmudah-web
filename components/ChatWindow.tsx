"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
};

const bubbleClassByRole: Record<ChatMessage["role"], string> = {
  user: "ml-auto border border-emerald-500/30 bg-emerald-600 text-white shadow-[0_12px_30px_-18px_rgba(16,185,129,0.75)]",
  agent:
    "mr-auto border border-zinc-200 bg-white text-zinc-900 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.25)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
  system:
    "mx-auto border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
};

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "agent-intro",
      role: "agent",
      text: "Hi, I am the LebihMudah platform chatbot. I can help you find a house, contact owners, and generate an agreement. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: userMessage.text }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      
      const agentMessage: ChatMessage = {
        id: Math.random().toString(36),
        role: "agent",
        text: data.response,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          role: "system",
          text: "Error: Could not connect to the agent. Please make sure the agentic-core backend is running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-3rem)] max-h-[860px] flex-col overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] transition-colors dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 bg-slate-50/90 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-300">
          LebihMudah Agent
        </p>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Agentic AI Assistant
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Search properties, inquire with owners, and initiate bookings.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Search: public
          </span>
          <span className="rounded-full bg-zinc-200 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            Booking: login required
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5 dark:bg-zinc-950">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`w-full max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${bubbleClassByRole[message.role]}`}
          >
            <p>{message.text}</p>
          </article>
        ))}
        {isLoading && (
          <article className={`w-full max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${bubbleClassByRole.agent}`}>
            <p className="animate-pulse">Thinking...</p>
          </article>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <input
            disabled={isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., Find a house under RM1000 for 2 people"
            className="h-12 flex-1 rounded-full border border-zinc-300 bg-zinc-100 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
