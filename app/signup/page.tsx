import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-md">
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
