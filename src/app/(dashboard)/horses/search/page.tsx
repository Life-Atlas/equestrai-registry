"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  BREED_LABELS,
  type BreedType,
  type HorseStatus,
} from "@/lib/constants";

const breedOptions = (
  Object.entries(BREED_LABELS) as [BreedType, string][]
).map(([value, label]) => ({ value, label }));

const sexOptions = [
  { value: "stallion", label: "Stallion" },
  { value: "mare", label: "Mare" },
  { value: "gelding", label: "Gelding" },
];

const statusVariant: Record<
  HorseStatus,
  "default" | "success" | "warning" | "info"
> = {
  pending: "warning",
  registered: "success",
  transferred: "info",
  deceased: "default",
  archived: "default",
};

interface HorseResult {
  id: string;
  name: string;
  registration_number: string | null;
  sex: string;
  breed_type: string;
  color: string | null;
  status: string;
}

export default function HorseSearchPage() {
  const [query, setQuery] = useState("");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("");
  const [results, setResults] = useState<HorseResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    const supabase = createClient();

    let q = supabase
      .from("horses")
      .select("id, name, registration_number, sex, breed_type, color, status")
      .eq("status", "registered")
      .order("name");

    if (query.trim()) {
      q = q.ilike("name", `%${query.trim()}%`);
    }
    if (breed) {
      q = q.eq("breed_type", breed);
    }
    if (sex) {
      q = q.eq("sex", sex);
    }

    const { data } = await q.limit(50);
    setResults((data as HorseResult[]) ?? []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Search Studbook</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            label="Name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
          />
          <Select
            label="Breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            options={breedOptions}
            placeholder="All breeds"
          />
          <Select
            label="Sex"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            options={sexOptions}
            placeholder="All"
          />
          <div className="flex items-end">
            <Button onClick={handleSearch} loading={loading} className="w-full">
              Search
            </Button>
          </div>
        </div>
      </div>

      {searched && (
        <div className="rounded-lg border border-gray-200 bg-white">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No horses found matching your criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Reg #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Breed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Sex
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((horse) => (
                  <tr key={horse.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/horses/${horse.id}`}
                        className="font-medium text-[#1a3a5c] hover:underline"
                      >
                        {horse.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {horse.registration_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {BREED_LABELS[horse.breed_type as BreedType] ??
                        horse.breed_type}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-600">
                      {horse.sex}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          statusVariant[horse.status as HorseStatus] ??
                          "default"
                        }
                      >
                        {horse.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
