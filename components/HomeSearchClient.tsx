"use client";

import { CSSProperties, FormEvent, useEffect, useState } from "react";
import HomeSidebar from "@/components/HomeSidebar";
import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/lib/types";

const SIDEBAR_STORAGE_KEY = "lebihmudah-sidebar-collapsed";

interface HomeSearchClientProps {
  initialResults: Property[];
}

export default function HomeSearchClient({
  initialResults,
}: HomeSearchClientProps) {
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [petsAllowed, setPetsAllowed] = useState("any");
  const [results, setResults] = useState<Property[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarPreferenceReady, setIsSidebarPreferenceReady] =
    useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (savedCollapsed === "true" || savedCollapsed === "false") {
      setIsSidebarCollapsed(savedCollapsed === "true");
    }

    setIsSidebarPreferenceReady(true);
  }, []);

  useEffect(() => {
    if (!isSidebarPreferenceReady) {
      return;
    }

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed, isSidebarPreferenceReady]);

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
    <div
      className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
      style={
        {
          "--sidebar-width": isSidebarCollapsed ? "5rem" : "18rem",
        } as CSSProperties
      }
    >
      <HomeSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <div className="space-y-6">
        <header className="space-y-2 rounded-3xl border border-zinc-300 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <p className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Find your next home
          </p>
          <h1 className="text-3xl font-semibold">
            Search for a home you will love
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Browse homes, compare options, and filter by location, budget, room
            count, or pet policy to find a place that feels right for you.
          </p>
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
              Showing {results.length} home
              {results.length > 1 ? "s" : ""} to get you started.
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </section>
      </div>
    </div>
  );
}
