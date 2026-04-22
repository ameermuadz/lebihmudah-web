import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BookingPanel from "@/components/BookingPanel";
import { getPropertyDetails } from "@/lib/services/propertyService";

interface PropertyDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const property = await getPropertyDetails(params.id);

  if (!property) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-zinc-900 md:p-6 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/"
          className="inline-flex rounded-lg bg-zinc-200 px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          Back to search
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <article className="overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <Image
              src={property.images[0] ?? "/mock1.svg"}
              alt={property.title}
              className="h-64 w-full object-cover"
              width={1280}
              height={420}
            />

            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold">{property.title}</h1>
                <p className="text-zinc-600 dark:text-zinc-300">
                  {property.location}
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-emerald-600/20 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                    RM {property.price}/month
                  </span>
                  <span className="rounded-full bg-zinc-200 px-3 py-1 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                    {property.rooms} room{property.rooms > 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full bg-zinc-200 px-3 py-1 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                    {property.petsAllowed ? "Pets allowed" : "No pets"}
                  </span>
                </div>
              </div>

              <p className="text-zinc-700 dark:text-zinc-200">
                {property.description}
              </p>

              <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Contact info
                </p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Managed by {property.ownerName}
                </h2>
                <div className="mt-3 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-500">
                      Email:
                    </span>{" "}
                    <a
                      href={`mailto:${property.ownerEmail}`}
                      className="text-emerald-700 underline dark:text-emerald-300"
                    >
                      {property.ownerEmail}
                    </a>
                  </p>
                  <p>
                    <span className="text-zinc-500 dark:text-zinc-500">
                      Phone:
                    </span>{" "}
                    {property.ownerPhone ?? "Not provided"}
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold">Rules</h2>
                <ul className="list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-200">
                  {property.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </section>

              <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300 md:grid-cols-2">
                <p>
                  <span className="text-zinc-500 dark:text-zinc-500">
                    Property ID:
                  </span>{" "}
                  {property.id}
                </p>
                <p>
                  <span className="text-zinc-500 dark:text-zinc-500">
                    Availability:
                  </span>{" "}
                  {property.availabilityDate}
                </p>
              </div>
            </div>
          </article>

          <aside className="lg:self-start">
            <BookingPanel
              propertyId={property.id}
              propertyTitle={property.title}
              availabilityDate={property.availabilityDate}
              bookings={property.bookings}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
