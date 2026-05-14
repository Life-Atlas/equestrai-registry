import { createClient } from "@/lib/supabase/server";
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

export default async function HorsesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: horses } = await supabase
    .from("horses")
    .select(
      "id, name, barn_name, sex, breed_type, status, date_of_birth, registration_number",
    )
    .eq("current_owner_id", user!.id)
    .order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a3a5c]">My Horses</h1>
        <Link
          href="/horses/new"
          className="rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5a87] min-h-[44px] inline-flex items-center"
        >
          + Add Horse
        </Link>
      </div>

      {!horses || horses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600">No horses yet.</p>
          <Link
            href="/horses/new"
            className="mt-3 inline-block text-sm font-medium text-[#1a3a5c] hover:underline"
          >
            Register your first horse
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 font-medium text-gray-700 max-sm:hidden">
                  Breed
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 max-sm:hidden">
                  Sex
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700 max-md:hidden">
                  Reg #
                </th>
              </tr>
            </thead>
            <tbody>
              {horses.map((horse) => (
                <tr
                  key={horse.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/horses/${horse.id}`}
                      className="font-medium text-[#1a3a5c] hover:underline"
                    >
                      {horse.name}
                    </Link>
                    {horse.barn_name && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({horse.barn_name})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">
                    {BREED_LABELS[horse.breed_type as BreedType] ??
                      horse.breed_type}
                  </td>
                  <td className="px-4 py-3 capitalize max-sm:hidden">
                    {horse.sex}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        statusVariant[horse.status as HorseStatus] ?? "default"
                      }
                    >
                      {horse.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 max-md:hidden">
                    {horse.registration_number || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
