import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  BREED_LABELS,
  type BreedType,
  type HorseStatus,
} from "@/lib/constants";

const statusVariant: Record<
  HorseStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  pending: "warning",
  registered: "success",
  transferred: "info",
  deceased: "default",
  archived: "default",
};

export default async function HorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: horse, error } = await supabase
    .from("horses")
    .select(
      `*,
      sire:horses!horses_sire_id_fkey(id, name, registration_number),
      dam:horses!horses_dam_id_fkey(id, name, registration_number)`,
    )
    .eq("id", id)
    .single();

  if (error || !horse) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/horses"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to horses
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-[#1a3a5c]">
            {horse.name}
          </h1>
          {horse.barn_name && (
            <p className="text-sm text-gray-500">
              Barn name: {horse.barn_name}
            </p>
          )}
        </div>
        <Badge
          variant={statusVariant[horse.status as HorseStatus] ?? "default"}
        >
          {horse.status}
        </Badge>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <dl className="divide-y divide-gray-100">
          <DetailRow
            label="Registration #"
            value={horse.registration_number || "Pending"}
          />
          <DetailRow label="Sex" value={horse.sex} capitalize />
          <DetailRow
            label="Breed"
            value={
              BREED_LABELS[horse.breed_type as BreedType] ?? horse.breed_type
            }
          />
          <DetailRow label="Color" value={horse.color || "—"} />
          <DetailRow
            label="Date of Birth"
            value={
              horse.date_of_birth
                ? new Date(horse.date_of_birth).toLocaleDateString()
                : "—"
            }
          />
          <DetailRow
            label="Country of Birth"
            value={horse.country_of_birth || "—"}
          />
          <DetailRow label="Microchip" value={horse.microchip_number || "—"} />
          <DetailRow
            label="DNA Status"
            value={horse.dna_status || "—"}
            capitalize
          />
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#1a3a5c]">Pedigree</h2>
        <div className="grid grid-cols-2 gap-4">
          <PedigreeCard
            label="Sire"
            horse={
              horse.sire as {
                id: string;
                name: string;
                registration_number: string | null;
              } | null
            }
          />
          <PedigreeCard
            label="Dam"
            horse={
              horse.dam as {
                id: string;
                name: string;
                registration_number: string | null;
              } | null
            }
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between px-5 py-3">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd
        className={`text-sm font-medium text-gray-900 ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function PedigreeCard({
  label,
  horse,
}: {
  label: string;
  horse: {
    id: string;
    name: string;
    registration_number: string | null;
  } | null;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      {horse ? (
        <Link
          href={`/horses/${horse.id}`}
          className="mt-1 block text-sm font-medium text-[#1a3a5c] hover:underline"
        >
          {horse.name}
          {horse.registration_number && (
            <span className="ml-1 text-xs text-gray-500">
              #{horse.registration_number}
            </span>
          )}
        </Link>
      ) : (
        <p className="mt-1 text-sm text-gray-400">Not recorded</p>
      )}
    </div>
  );
}
