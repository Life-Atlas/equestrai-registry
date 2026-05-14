"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BREED_LABELS, type BreedType } from "@/lib/constants";
import { validateHorseForm } from "@/lib/validators";

const breedOptions = (
  Object.entries(BREED_LABELS) as [BreedType, string][]
).map(([value, label]) => ({ value, label }));

const sexOptions = [
  { value: "stallion", label: "Stallion" },
  { value: "mare", label: "Mare" },
  { value: "gelding", label: "Gelding" },
];

export default function NewHorsePage() {
  const [form, setForm] = useState({
    name: "",
    barn_name: "",
    sex: "",
    breed_type: "",
    color: "",
    date_of_birth: "",
    microchip_number: "",
    country_of_birth: "US",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const validation = validateHorseForm({
      name: form.name,
      sex: form.sex,
      breed_type: form.breed_type,
      color: form.color,
      date_of_birth: form.date_of_birth,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setServerError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setServerError("Profile not found");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("horses").insert({
      tenant_id: profile.tenant_id,
      name: form.name.trim(),
      barn_name: form.barn_name.trim() || null,
      sex: form.sex,
      breed_type: form.breed_type,
      color: form.color.trim() || null,
      date_of_birth: form.date_of_birth || null,
      microchip_number: form.microchip_number.trim() || null,
      country_of_birth: form.country_of_birth,
      current_owner_id: user.id,
      breeder_id: user.id,
    });

    if (insertError) {
      setServerError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/horses");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Add Horse</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <Input
          label="Registered Name *"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors.name}
          required
        />

        <Input
          label="Barn Name"
          value={form.barn_name}
          onChange={(e) => update("barn_name", e.target.value)}
          placeholder="Informal / stable name"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Sex *"
            value={form.sex}
            onChange={(e) => update("sex", e.target.value)}
            options={sexOptions}
            placeholder="Select sex"
            error={errors.sex}
            required
          />
          <Select
            label="Breed *"
            value={form.breed_type}
            onChange={(e) => update("breed_type", e.target.value)}
            options={breedOptions}
            placeholder="Select breed"
            error={errors.breed_type}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Color"
            value={form.color}
            onChange={(e) => update("color", e.target.value)}
            placeholder="e.g. Grey, Bay"
          />
          <Input
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) => update("date_of_birth", e.target.value)}
            error={errors.date_of_birth}
          />
        </div>

        <Input
          label="Microchip Number"
          value={form.microchip_number}
          onChange={(e) => update("microchip_number", e.target.value)}
          placeholder="15-digit ISO number"
          maxLength={15}
        />

        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            Save Horse
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
