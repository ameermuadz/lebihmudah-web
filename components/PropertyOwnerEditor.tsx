"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AmenityPicker from "@/components/AmenityPicker";
import ListInput from "@/components/ListInput";
import ReorderableListInput from "@/components/ReorderableListInput";
import BookingStatusSections from "@/components/BookingStatusSections";
import type { PropertyDetails } from "@/lib/types";

interface PropertyOwnerEditorProps {
  property: PropertyDetails;
}

export default function PropertyOwnerEditor({
  property,
}: PropertyOwnerEditorProps) {
  const router = useRouter();
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [title, setTitle] = useState(property.title);
  const [location, setLocation] = useState(property.location);
  const [price, setPrice] = useState(String(property.price));
  const [rooms, setRooms] = useState(String(property.rooms));
  const [petsAllowed, setPetsAllowed] = useState(String(property.petsAllowed));
  const [description, setDescription] = useState(property.description);
  const [availabilityDate, setAvailabilityDate] = useState(
    property.availabilityDate,
  );

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    property.amenities,
  );
  const [rules, setRules] = useState<string[]>(property.rules);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch(`/api/owner/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          location,
          price: Number(price),
          rooms: Number(rooms),
          petsAllowed: petsAllowed === "true",
          description,
          availabilityDate,
          amenities: selectedAmenities,
          rules: rules,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save property");
      }

      setStatus("Property updated successfully.");
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      setStatus(reason);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5 rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
            Owner editing mode
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Update this property
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
            Edit the live listing fields when needed. The booking timeline below
            stays visible so you can review pending, confirmed, and cancelled
            requests for this property at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {property.bookings.length} booking
            {property.bookings.length === 1 ? "" : "s"}
          </div>
          <button
            type="button"
            onClick={() => setIsEditingOpen((current) => !current)}
            className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isEditingOpen ? "Hide edit form" : "Edit property"}
          </button>
        </div>
      </div>

      {status ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {status}
        </p>
      ) : null}

      {isEditingOpen ? (
        <>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Location
              </span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Availability date
              </span>
              <input
                type="date"
                value={availabilityDate}
                onChange={(event) => setAvailabilityDate(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Price
              </span>
              <input
                type="number"
                min="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rooms
              </span>
              <input
                type="number"
                min="1"
                value={rooms}
                onChange={(event) => setRooms(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Pets allowed
              </span>
              <select
                value={petsAllowed}
                onChange={(event) => setPetsAllowed(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>

            <div className="space-y-2 md:col-span-2">
              <AmenityPicker
                selected={selectedAmenities}
                onChange={setSelectedAmenities}
                label="Amenities"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <ReorderableListInput
                items={rules}
                onChange={setRules}
                placeholder="Type a rule..."
                label="Property Rules (drag or use arrows to rearrange)"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:disabled:bg-zinc-700"
              >
                {isSaving ? "Saving..." : "Save property changes"}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setIsEditingOpen(false)}
            className="inline-flex rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Hide edit form
          </button>
        </>
      ) : (
        <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          This listing is view-only until you choose to edit it.
        </div>
      )}

      <BookingStatusSections
        title="Booking history"
        description="Pending, confirmed, and cancelled bookings for this property."
        bookings={property.bookings}
        propertyTitle={property.title}
        propertyLocation={property.location}
        showPropertyLinks={false}
      />
    </section>
  );
}
