"use client";

import { FormEvent, useState } from "react";
import AmenityPicker from "@/components/AmenityPicker";
import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/lib/types";

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
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [results, setResults] = useState<Property[]>(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    setHasSearched(true);

    try {
      const payload: {
        location?: string;
        maxPrice?: number;
        rooms?: number;
        petsAllowed?: boolean;
        amenities?: string[];
      } = {};

      if (location.trim()) payload.location = location.trim();
      if (maxPrice.trim()) payload.maxPrice = Number(maxPrice);
      if (rooms.trim()) payload.rooms = Number(rooms);
      if (petsAllowed !== "any") payload.petsAllowed = petsAllowed === "true";
      if (selectedAmenities.length > 0) payload.amenities = selectedAmenities;

      const response = await fetch("/api/tools/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Search API HTTP ${response.status}`);

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

  const handleClear = () => {
    setLocation("");
    setMaxPrice("");
    setRooms("");
    setPetsAllowed("any");
    setSelectedAmenities([]);
    setResults(initialResults);
    setHasSearched(false);
    setError("");
  };

  const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-2 rounded-3xl border border-zinc-300 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <p className="inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Find your next home
        </p>
        <h1 className="text-3xl font-semibold">
          Search for a home you will love
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Browse homes, compare options, and filter by location, budget, room
          count, or features to find a place that feels right for you.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-300 bg-white p-4 md:p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Location"
              className={inputClass}
            />
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Max Price"
              type="number"
              min="0"
              className={inputClass}
            />
            <input
              value={rooms}
              onChange={(event) => setRooms(event.target.value)}
              placeholder="Min Rooms"
              type="number"
              min="1"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                isFiltersOpen || selectedAmenities.length > 0
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {selectedAmenities.length > 0 ? `${selectedAmenities.length} Filters` : "More Filters"}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {isFiltersOpen && (
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 animate-in fade-in slide-in-from-top-2 dark:border-zinc-700 dark:bg-zinc-950">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Pet Policy</p>
                  <select
                    value={petsAllowed}
                    onChange={(event) => setPetsAllowed(event.target.value)}
                    className={`${inputClass} w-full`}
                  >
                    <option value="any">Any policy</option>
                    <option value="true">Pets Allowed</option>
                    <option value="false">No Pets</option>
                  </select>
                </div>
              </div>
              <AmenityPicker
                selected={selectedAmenities}
                onChange={setSelectedAmenities}
                label="Filter by amenities"
              />
            </div>
          )}

          {selectedAmenities.length > 0 && !isFiltersOpen && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-500">Active features:</span>
              {selectedAmenities.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() =>
                    setSelectedAmenities(selectedAmenities.filter((x) => x !== a))
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200"
                >
                  {a} ✕
                </button>
              ))}
            </div>
          )}
        </form>

        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : null}
        {!error && results.length > 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Found {results.length} home{results.length > 1 ? "s" : ""} matching your search.
          </p>
        ) : null}
      </section>

      {hasSearched && !isLoading && !error && results.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 rounded-[32px] border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-zinc-400">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No properties found</h2>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              We couldn&apos;t find any listings that match your exact filters. Try broadening your criteria.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear all filters
          </button>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </section>
      )}
    </div>
  );
}
