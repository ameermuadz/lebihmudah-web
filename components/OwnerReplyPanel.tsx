"use client";

import { useEffect, useMemo, useState } from "react";
import { OwnerMessage } from "@/lib/types";

const OWNER_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_OWNER_WEBHOOK_URL ??
  "http://localhost:8000/agent/owner-reply";

export default function OwnerReplyPanel() {
  const [messages, setMessages] = useState<OwnerMessage[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  const loadMessages = async () => {
    const response = await fetch("/api/tools/message-owner", {
      cache: "no-store",
    });
    const data = (await response.json()) as OwnerMessage[];
    setMessages(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void loadMessages();

    const timer = setInterval(() => {
      void loadMessages();
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const sendReply = async (message: OwnerMessage) => {
    const reply = replies[message.id]?.trim();

    if (!reply || isSending) {
      return;
    }

    setIsSending(true);
    setStatus("");

    try {
      const webhookResponse = await fetch(OWNER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: message.sessionId,
          propertyId: message.propertyId,
          ownerId: message.ownerId,
          reply,
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook HTTP ${webhookResponse.status}`);
      }

      await fetch("/api/tools/message-owner", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: message.id,
          ownerReply: reply,
        }),
      });

      setReplies((current) => {
        const copy = { ...current };
        delete copy[message.id];
        return copy;
      });
      setStatus(
        "Reply sent to agent backend and message removed from pending queue.",
      );
      await loadMessages();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Failed to send reply: ${reason}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-300">
        This dashboard polls pending owner questions from{" "}
        <strong>/api/tools/message-owner</strong>.
      </div>

      {status ? (
        <p className="rounded-lg bg-zinc-800 p-3 text-sm text-zinc-100">
          {status}
        </p>
      ) : null}

      {!hasMessages ? (
        <div className="rounded-xl border border-dashed border-zinc-600 bg-zinc-900 p-8 text-center text-zinc-400">
          No pending owner messages.
        </div>
      ) : null}

      {messages.map((message) => (
        <article
          key={message.id}
          className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-900 p-4"
        >
          <div className="grid gap-1 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Message ID:</span> {message.id}
            </p>
            <p>
              <span className="text-zinc-500">Owner ID:</span> {message.ownerId}
            </p>
            <p>
              <span className="text-zinc-500">Property ID:</span>{" "}
              {message.propertyId}
            </p>
            <p>
              <span className="text-zinc-500">Session ID:</span>{" "}
              {message.sessionId}
            </p>
            <p className="rounded-lg bg-zinc-800 p-3 text-zinc-100">
              {message.question}
            </p>
          </div>

          <textarea
            value={replies[message.id] ?? ""}
            onChange={(event) =>
              setReplies((current) => ({
                ...current,
                [message.id]: event.target.value,
              }))
            }
            placeholder="Type owner reply..."
            className="min-h-24 w-full rounded-lg border border-zinc-600 bg-zinc-950 p-3 text-sm text-white outline-none transition focus:border-emerald-500"
          />

          <button
            onClick={() => void sendReply(message)}
            disabled={isSending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-600"
          >
            Send Reply
          </button>
        </article>
      ))}
    </section>
  );
}
