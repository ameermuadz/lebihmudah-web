import OwnerReplyPanel from "@/components/OwnerReplyPanel";

export default function OwnerDashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Owner Dashboard Sandbox</h1>
          <p className="text-sm text-zinc-400">
            Hidden mock panel to respond to agent-queued owner questions.
          </p>
        </header>
        <OwnerReplyPanel />
      </div>
    </main>
  );
}
