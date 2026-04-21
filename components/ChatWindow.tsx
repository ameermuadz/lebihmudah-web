"use client";

import { FormEvent, useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/lib/types";

interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  properties?: Property[];
}

interface AgentResponse {
  reply?: string;
  message?: string;
  text?: string;
  properties?: Property[];
  data?: {
    reply?: string;
    message?: string;
    text?: string;
    properties?: Property[];
  };
}

const AGENT_API_URL =
  process.env.NEXT_PUBLIC_AGENT_CHAT_URL ?? "http://localhost:8000/agent/chat";

const createId = () =>
  `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const getReplyText = (payload: AgentResponse) =>
  payload.reply ??
  payload.message ??
  payload.text ??
  payload.data?.reply ??
  payload.data?.message ??
  payload.data?.text;

const getProperties = (payload: AgentResponse) =>
  payload.properties ?? payload.data?.properties;

export default function ChatWindow() {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `session_${Date.now()}`,
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "agent",
      text: "Hi! I am LebihMudah Assistant. Tell me what rental home you are looking for.",
    },
  ]);

  const sortedMessages = useMemo(() => messages, [messages]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const cleanMessage = inputValue.trim();

    if (!cleanMessage || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      text: cleanMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(AGENT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: cleanMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent HTTP ${response.status}`);
      }

      const payload = (await response
        .json()
        .catch(() => ({}))) as AgentResponse;
      const replyText = getReplyText(payload) ?? "I received your message.";
      const properties = getProperties(payload);

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "agent",
          text: replyText,
          properties: Array.isArray(properties) ? properties : undefined,
        },
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "system",
          text: `Unable to reach agent backend at ${AGENT_API_URL}. (${reason})`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-3rem)] max-h-[860px] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/30">
      <header className="border-b border-zinc-700 bg-zinc-950 px-5 py-4">
        <h1 className="text-lg font-semibold text-white">
          WhatsApp Portal Simulator
        </h1>
        <p className="text-sm text-zinc-400">Session: {sessionId}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,#334155_0%,#0f172a_45%,#020617_100%)] p-4">
        {sortedMessages.map((message) => {
          const isUser = message.role === "user";
          const bubbleClass = isUser
            ? "ml-auto bg-emerald-600 text-white"
            : message.role === "agent"
              ? "mr-auto bg-zinc-700 text-zinc-100"
              : "mx-auto bg-amber-600/90 text-white";

          return (
            <article
              key={message.id}
              className={`w-full max-w-[80%] rounded-2xl p-3 text-sm ${bubbleClass}`}
            >
              <p>{message.text}</p>
              {message.properties && message.properties.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {message.properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
        {isLoading ? (
          <p className="text-sm text-zinc-300">Agent is thinking...</p>
        ) : null}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 border-t border-zinc-700 bg-zinc-950 p-4"
      >
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Type your message..."
          className="h-11 flex-1 rounded-full border border-zinc-600 bg-zinc-800 px-4 text-sm text-white outline-none transition focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-600"
        >
          Send
        </button>
      </form>
    </section>
  );
}
