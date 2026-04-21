import { Property } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <article className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/80 text-white shadow-lg transition hover:border-zinc-500">
        <Image
          src={property.images[0] ?? "/mock1.svg"}
          alt={property.title}
          className="h-36 w-full object-cover"
          width={640}
          height={240}
        />
        <div className="space-y-2 p-4">
          <h3 className="text-base font-semibold">{property.title}</h3>
          <p className="text-sm text-zinc-300">{property.location}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-600/20 px-2 py-1 text-emerald-300">
              RM {property.price}/month
            </span>
            <span className="rounded-full bg-zinc-700 px-2 py-1 text-zinc-200">
              {property.rooms} room{property.rooms > 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-zinc-700 px-2 py-1 text-zinc-200">
              {property.petsAllowed ? "Pets allowed" : "No pets"}
            </span>
          </div>
          <p className="text-xs text-zinc-400">Property ID: {property.id}</p>
          <p className="text-xs text-emerald-300">View details</p>
        </div>
      </article>
    </Link>
  );
}
