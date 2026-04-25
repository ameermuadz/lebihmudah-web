"use client";

import ListInput from "./ListInput";

export const POPULAR_AMENITIES = [
  "WiFi",
  "Aircon",
  "Parking",
  "Pool",
  "Gym",
  "Balcony",
  "Washing Machine",
  "Fridge",
  "24/7 Security",
];

interface AmenityPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

export default function AmenityPicker({
  selected,
  onChange,
  label = "Amenities",
}: AmenityPickerProps) {
  const togglePopular = (amenity: string) => {
    onChange(
      selected.includes(amenity)
        ? selected.filter((a) => a !== amenity)
        : [...selected, amenity],
    );
  };

  const popularSelected = selected.filter((a) => POPULAR_AMENITIES.includes(a));
  const customSelected = selected.filter((a) => !POPULAR_AMENITIES.includes(a));

  return (
    <div className="space-y-4">
      {label && (
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </p>
      )}
      
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Popular options</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_AMENITIES.map((amenity) => {
            const active = selected.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => togglePopular(amenity)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300"
                }`}
              >
                {active ? "✓ " : ""}{amenity}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <ListInput
          items={customSelected}
          onChange={(nextCustom) => onChange([...popularSelected, ...nextCustom])}
          placeholder="Type custom amenity..."
          label="Other amenities"
        />
      </div>
    </div>
  );
}
