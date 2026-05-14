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
import { getAvailableActions } from "@/lib/staff-actions";
import { StaffActionButtons } from "./staff-action-buttons";

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

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: app, error } = await supabase
    .from("applications")
    .select(
      "*, applicant:profiles!applications_applicant_id_fkey(first_name, last_name, email, phone)",
    )
    .eq("id", id)
    .single();

  if (error || !app) {
    notFound();
  }

  const formData = (app.form_data ?? {}) as Record<string, string | null>;
  const status = app.status as ApplicationStatus;
  const appType = app.application_type as ApplicationType;
  const availableActions = getAvailableActions(status);
  const applicant = app.applicant as {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/applications"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to queue
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1a3a5c]">
            {formData.horse_name || "Untitled"}
          </h1>
          <Badge variant={statusVariant[status] ?? "default"}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {APPLICATION_TYPE_LABELS[appType] ?? appType}
        </p>
      </div>

      {applicant && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Applicant
          </h2>
          <p className="text-sm font-medium text-gray-900">
            {applicant.first_name} {applicant.last_name}
          </p>
          <p className="text-sm text-gray-600">{applicant.email}</p>
          {applicant.phone && (
            <p className="text-sm text-gray-600">{applicant.phone}</p>
          )}
        </div>
      )}

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
          <Row
            label="Fee"
            value={
              app.fee_cents ? formatCents(app.fee_cents as number) : "Pending"
            }
          />
          <Row
            label="Payment"
            value={(app.payment_status as string) ?? "Unpaid"}
            capitalize
          />
        </dl>
      </div>

      {availableActions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            Actions
          </h2>
          <StaffActionButtons
            applicationId={app.id}
            currentStatus={status}
            availableActions={availableActions}
          />
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p>ID: {app.id}</p>
        <p>
          Created: {new Date(app.created_at as string).toLocaleDateString()}
        </p>
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
