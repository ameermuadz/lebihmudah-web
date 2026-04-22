export default function OwnerReplyPanel() {
  return (
    <section className="space-y-4">
      <div className="rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
          Owner chatbot workspace
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Reserved for future owner AI tools
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          This is a UI-only placeholder. The chatbot team can later connect
          owner message intake, reply actions, property editing, property status
          listing, and approve or reject flows here.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Pending owner requests
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              Incoming renter question placeholder.
            </div>
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              Reply composer placeholder for the future chatbot workflow.
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Planned owner tools
          </p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">
                Edit property
              </strong>{" "}
              update listing details for owned properties.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">
                Property status
              </strong>{" "}
              list owned properties and their booking state.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-zinc-100">
                Approve or reject
              </strong>{" "}
              booking requests from renters.
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
