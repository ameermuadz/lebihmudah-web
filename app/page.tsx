import HomeSearchClient from "@/components/HomeSearchClient";
import { searchProperties } from "@/lib/services/propertyService";

export default async function HomePage() {
  const initialResults = await searchProperties({ limit: 10 });

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 md:p-6 dark:bg-zinc-950 dark:text-zinc-100">
      <HomeSearchClient initialResults={initialResults} />
    </main>
  );
}
