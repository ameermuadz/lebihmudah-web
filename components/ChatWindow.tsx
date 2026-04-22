type ChatMessage = {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
};

const previewMessages: ChatMessage[] = [
  {
    id: "agent-intro",
    role: "agent",
    text: "Hi, I am the LebihMudah platform chatbot. Search properties without logging in, then sign in when you want booking or owner workflows.",
  },
  {
    id: "user-example",
    role: "user",
    text: "Show me a pet-friendly room in Bangsar under RM 1,500.",
  },
  {
    id: "system-note",
    role: "system",
    text: "This is a UI preview only. The chatbot wiring, tool orchestration, and owner handoff will be added later by the chatbot team.",
  },
];

const bubbleClassByRole: Record<ChatMessage["role"], string> = {
  user: "ml-auto border border-emerald-500/30 bg-emerald-600 text-white shadow-[0_12px_30px_-18px_rgba(16,185,129,0.75)]",
  agent:
    "mr-auto border border-zinc-200 bg-white text-zinc-900 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.25)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
  system:
    "mx-auto border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
};

export default function ChatWindow() {
  return (
    <section className="flex h-[calc(100vh-3rem)] max-h-[860px] flex-col overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] transition-colors dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 bg-slate-50/90 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-300">
          Platform chatbot preview
        </p>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          LebihMudah AI Chatbot
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Search properties without logging in. Sign in when you want the
          chatbot to book for you or use owner tools.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            Search: public
          </span>
          <span className="rounded-full bg-zinc-200 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            Booking: login required
          </span>
          <span className="rounded-full bg-zinc-200 px-3 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            Owner tools: owner login required
          </span>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5 dark:bg-zinc-950">
        {previewMessages.map((message) => (
          <article
            key={message.id}
            className={`w-full max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${bubbleClassByRole[message.role]}`}
          >
            <p>{message.text}</p>
          </article>
        ))}

        <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          The actual chatbot integration will be connected by another developer.
          This screen is only keeping the visual shell ready for the future
          agentic workflow.
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <input
            disabled
            placeholder="Chatbot integration will be wired here later"
            className="h-12 flex-1 rounded-full border border-zinc-300 bg-zinc-100 px-4 text-sm text-zinc-500 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
          />
          <button
            type="button"
            disabled
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white opacity-60"
          >
            Send
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          UI only for now. Search remains open, while booking and owner flows
          will be gated by login when the chatbot is wired.
        </p>
      </div>
    </section>
  );
}
