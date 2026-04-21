"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/lib/types";

export default function HomePage() {
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [petsAllowed, setPetsAllowed] = useState("any");
  const [results, setResults] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInitialPreview = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/tools/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ limit: 10 }),
        });

        if (!response.ok) {
          throw new Error(`Search API HTTP ${response.status}`);
        }

        const data = (await response.json()) as Property[];

        if (isMounted) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (previewError) {
        const reason =
          previewError instanceof Error
            ? previewError.message
            : "Unknown error";

        if (isMounted) {
          setError(`Unable to load initial preview: ${reason}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialPreview();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload: {
        location?: string;
        maxPrice?: number;
        rooms?: number;
        petsAllowed?: boolean;
        limit?: number;
      } = {};

      if (location.trim()) {
        payload.location = location.trim();
      }

      if (maxPrice.trim()) {
        payload.maxPrice = Number(maxPrice);
      }

      if (rooms.trim()) {
        payload.rooms = Number(rooms);
      }

      if (petsAllowed !== "any") {
        payload.petsAllowed = petsAllowed === "true";
      }

      const response = await fetch("/api/tools/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Search API HTTP ${response.status}`);
      }

      const data = (await response.json()) as Property[];
      setResults(Array.isArray(data) ? data : []);
    } catch (searchError) {
      const reason =
        searchError instanceof Error ? searchError.message : "Unknown error";
      setError(`Unable to search properties: ${reason}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 md:p-6 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            LebihMudah.my Platform Layer
          </p>
          <h1 className="text-3xl font-semibold">Property Search Sandbox</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Frontend + mock tools API for the external AI reasoning backend.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              className="rounded-lg bg-zinc-200 px-3 py-2 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              href="/chat"
            >
              Open /chat
            </Link>
            <Link
              className="rounded-lg bg-zinc-200 px-3 py-2 text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              href="/owner-dashboard"
            >
              Open /owner-dashboard
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 md:p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-5">
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max Price"
              type="number"
              min="0"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <input
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
              placeholder="Min Rooms"
              type="number"
              min="1"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <select
              value={petsAllowed}
              onChange={(event) => setPetsAllowed(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="any">Pets: Any</option>
              <option value="true">Pets Allowed</option>
              <option value="false">No Pets</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </form>
          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {!error && results.length > 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Showing {results.length} preview item
              {results.length > 1 ? "s" : ""}.
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </section>
      </div>
    </main>
  );
}
