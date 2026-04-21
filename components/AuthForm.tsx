"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface AuthFormProps {
  mode: "login" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          mode === "login" ? { email, password } : { name, email, password },
        ),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed");
      }

      setSuccess(
        mode === "login"
          ? "Logged in successfully."
          : "Account created successfully.",
      );
      router.push("/");
      router.refresh();
    } catch (authError) {
      const reason =
        authError instanceof Error ? authError.message : "Unknown error";
      setError(reason);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-zinc-300 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {mode === "login" ? "Login" : "Sign Up"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {mode === "login"
            ? "Access your account to book properties."
            : "Create an account to reserve properties from the web."}
        </p>
      </div>

      {mode === "signup" ? (
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        />
      ) : null}

      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
      />

      <input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
      />

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
      >
        {isSubmitting
          ? "Please wait..."
          : mode === "login"
            ? "Login"
            : "Create account"}
      </button>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="text-emerald-700 underline dark:text-emerald-300"
        >
          {mode === "login" ? "Sign up" : "Login"}
        </Link>
      </p>
    </form>
  );
}
