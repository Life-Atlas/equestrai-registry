"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  APPLICATION_TYPE_LABELS,
  BREED_LABELS,
  type ApplicationType,
  type BreedType,
} from "@/lib/constants";

const appTypeOptions = (
  Object.entries(APPLICATION_TYPE_LABELS) as [ApplicationType, string][]
)
  .filter(([key]) => key !== "iberian_performance_cert")
  .map(([value, label]) => ({ value, label }));

const breedOptions = (
  Object.entries(BREED_LABELS) as [BreedType, string][]
).map(([value, label]) => ({ value, label }));

const sexOptions = [
  { value: "stallion", label: "Stallion" },
  { value: "mare", label: "Mare" },
  { value: "gelding", label: "Gelding" },
];

type Step = "type" | "details" | "documents" | "review";

export default function NewApplicationPage() {
  const [step, setStep] = useState<Step>("type");
  const [form, setForm] = useState({
    application_type: "" as string,
    horse_name: "",
    sex: "",
    breed_type: "",
    color: "",
    date_of_birth: "",
    microchip_number: "",
    sire_name: "",
    dam_name: "",
    transfer_to_email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setError("Profile not found");
      setLoading(false);
      return;
    }

    const { data: app, error: insertError } = await supabase
      .from("applications")
      .insert({
        tenant_id: profile.tenant_id,
        applicant_id: user.id,
        application_type: form.application_type,
        status: "draft",
        form_data: {
          horse_name: form.horse_name,
          sex: form.sex,
          breed_type: form.breed_type,
          color: form.color || null,
          date_of_birth: form.date_of_birth || null,
          microchip_number: form.microchip_number || null,
          sire_name: form.sire_name || null,
          dam_name: form.dam_name || null,
          transfer_to_email: form.transfer_to_email || null,
        },
      })
      .select("id")
      .single();

    if (insertError || !app) {
      setError(insertError?.message || "Failed to create application");
      setLoading(false);
      return;
    }

    router.push(`/applications/${app.id}`);
    router.refresh();
  }

  const isTransfer = form.application_type === "transfer";
  const isPurebred =
    form.application_type === "purebred_ialha_bred" ||
    form.application_type === "purebred_non_ialha";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">New Application</h1>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["type", "details", "documents", "review"] as Step[]).map((s) => (
          <button
            key={s}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium capitalize min-h-[36px] ${
              step === s ? "bg-white text-[#1a3a5c] shadow-sm" : "text-gray-500"
            }`}
            onClick={() => setStep(s)}
            disabled={
              (s === "details" && !form.application_type) ||
              (s === "documents" && !form.horse_name) ||
              (s === "review" && !form.horse_name)
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {step === "type" && (
          <div className="space-y-4">
            <Select
              label="Application Type *"
              value={form.application_type}
              onChange={(e) => update("application_type", e.target.value)}
              options={appTypeOptions}
              placeholder="Select type"
              required
            />
            <Button
              onClick={() => setStep("details")}
              disabled={!form.application_type}
            >
              Next
            </Button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            <Input
              label="Horse Name *"
              value={form.horse_name}
              onChange={(e) => update("horse_name", e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Sex *"
                value={form.sex}
                onChange={(e) => update("sex", e.target.value)}
                options={sexOptions}
                placeholder="Select"
                required
              />
              <Select
                label="Breed *"
                value={form.breed_type}
                onChange={(e) => update("breed_type", e.target.value)}
                options={breedOptions}
                placeholder="Select"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Color"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
              />
            </div>
            <Input
              label="Microchip (15 digits)"
              value={form.microchip_number}
              onChange={(e) => update("microchip_number", e.target.value)}
              maxLength={15}
            />
            {(isPurebred || form.application_type === "half_bred") && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={`Sire Name ${isPurebred ? "*" : ""}`}
                  value={form.sire_name}
                  onChange={(e) => update("sire_name", e.target.value)}
                />
                <Input
                  label={`Dam Name ${isPurebred ? "*" : ""}`}
                  value={form.dam_name}
                  onChange={(e) => update("dam_name", e.target.value)}
                />
              </div>
            )}
            {isTransfer && (
              <Input
                label="Buyer Email *"
                type="email"
                value={form.transfer_to_email}
                onChange={(e) => update("transfer_to_email", e.target.value)}
                required
              />
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("type")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("documents")}
                disabled={!form.horse_name || !form.sex || !form.breed_type}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "documents" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload marking photos and supporting documents. Document upload
              will be available after the application is created.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button onClick={() => setStep("review")}>Next</Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h3 className="font-medium text-[#1a3a5c]">Review Application</h3>
            <dl className="divide-y divide-gray-100 text-sm">
              <ReviewRow
                label="Type"
                value={
                  APPLICATION_TYPE_LABELS[
                    form.application_type as ApplicationType
                  ] ?? form.application_type
                }
              />
              <ReviewRow label="Horse" value={form.horse_name} />
              <ReviewRow label="Sex" value={form.sex} />
              <ReviewRow
                label="Breed"
                value={
                  BREED_LABELS[form.breed_type as BreedType] ?? form.breed_type
                }
              />
              {form.color && <ReviewRow label="Color" value={form.color} />}
              {form.date_of_birth && (
                <ReviewRow label="DOB" value={form.date_of_birth} />
              )}
              {form.sire_name && (
                <ReviewRow label="Sire" value={form.sire_name} />
              )}
              {form.dam_name && <ReviewRow label="Dam" value={form.dam_name} />}
            </dl>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("documents")}>
                Back
              </Button>
              <Button onClick={handleSubmit} loading={loading}>
                Submit Application
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
