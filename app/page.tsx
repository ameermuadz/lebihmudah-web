import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeSearchClient from "@/components/HomeSearchClient";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getSessionUser } from "@/lib/services/authService";
import { searchProperties } from "@/lib/services/propertyService";

export default async function HomePage() {
  const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = await getSessionUser(sessionToken);

  if (session?.user.role === "OWNER") {
    redirect("/dashboard");
  }

  const initialResults = await searchProperties({ limit: 15 });

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 md:p-6 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeSearchClient initialResults={initialResults} />
    </main>
  );
}
