"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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
    <main className="min-h-screen bg-zinc-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
            LebihMudah.my Platform Layer
          </p>
          <h1 className="text-3xl font-semibold">Property Search Sandbox</h1>
          <p className="text-zinc-400">
            Frontend + mock tools API for the external AI reasoning backend.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700"
              href="/chat"
            >
              Open /chat
            </Link>
            <Link
              className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700"
              href="/owner-dashboard"
            >
              Open /owner-dashboard
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 md:p-6">
          <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-5">
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max Price"
              type="number"
              min="0"
              className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
              placeholder="Min Rooms"
              type="number"
              min="1"
              className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <select
              value={petsAllowed}
              onChange={(event) => setPetsAllowed(event.target.value)}
              className="rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
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
