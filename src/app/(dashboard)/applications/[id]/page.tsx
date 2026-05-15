import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_TYPE_LABELS,
  BREED_LABELS,
  STATUS_LABELS,
  type ApplicationType,
  type ApplicationStatus,
  type BreedType,
} from "@/lib/constants";
import { formatCents } from "@/lib/fee-calculator";
import { PayButton } from "./pay-button";

const statusVariant: Record<
  ApplicationStatus,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  draft: "default",
  submitted: "info",
  intake_complete: "info",
  awaiting_payment: "warning",
  paid: "success",
  awaiting_approval: "warning",
  in_review: "info",
  approved: "success",
  rejected: "danger",
  incomplete: "warning",
  abandoned: "default",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: app, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !app) {
    notFound();
  }

  const formData = (app.form_data ?? {}) as Record<string, string | null>;
  const status = app.status as ApplicationStatus;
  const appType = app.application_type as ApplicationType;
  const showPayButton =
    status === "awaiting_payment" ||
    status === "submitted" ||
    status === "draft";

  let feeCents = 0;
  if (app.fee_cents != null) {
    feeCents = app.fee_cents as number;
  } else {
    const { data: feeRow } = await supabase
      .from("fee_schedules")
      .select("fee_cents")
      .eq("application_type", app.application_type)
      .eq("membership_type", "member")
      .is("age_bracket", null)
      .single();
    feeCents = feeRow?.fee_cents ?? 0;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/applications"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to applications
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1a3a5c]">
            {formData.horse_name || "Untitled Application"}
          </h1>
          <Badge variant={statusVariant[status] ?? "default"}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {APPLICATION_TYPE_LABELS[appType] ?? appType}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <dl className="divide-y divide-gray-100">
          <Row label="Horse Name" value={formData.horse_name} />
          <Row label="Sex" value={formData.sex} capitalize />
          <Row
            label="Breed"
            value={
              BREED_LABELS[formData.breed_type as BreedType] ??
              formData.breed_type
            }
          />
          {formData.color && <Row label="Color" value={formData.color} />}
          {formData.date_of_birth && (
            <Row label="Date of Birth" value={formData.date_of_birth} />
          )}
          {formData.microchip_number && (
            <Row label="Microchip" value={formData.microchip_number} />
          )}
          {formData.sire_name && (
            <Row label="Sire" value={formData.sire_name} />
          )}
          {formData.dam_name && <Row label="Dam" value={formData.dam_name} />}
          {formData.transfer_to_email && (
            <Row label="Transfer To" value={formData.transfer_to_email} />
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold text-[#1a3a5c]">
          Fee &amp; Payment
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-[#1a3a5c]">
              {formatCents(feeCents)}
            </p>
            <p className="text-sm text-gray-500">
              {app.payment_status === "paid" ? "Paid" : "Due upon submission"}
            </p>
          </div>
          {showPayButton && feeCents > 0 && (
            <PayButton applicationId={app.id} />
          )}
        </div>
      </div>

      {app.missing_items && (app.missing_items as string[]).length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-amber-800">
            Missing Items
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
            {(app.missing_items as string[]).map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p>
          Created: {new Date(app.created_at as string).toLocaleDateString()}
        </p>
        {app.submitted_at && (
          <p>
            Submitted:{" "}
            {new Date(app.submitted_at as string).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
}) {
  if (!value) return null;
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
