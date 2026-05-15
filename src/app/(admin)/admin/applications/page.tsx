import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_TYPE_LABELS,
  STATUS_LABELS,
  type ApplicationType,
  type ApplicationStatus,
} from "@/lib/constants";
import { formatCents } from "@/lib/fee-calculator";

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

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("applications")
    .select(
      "id, application_type, status, form_data, created_at, payment_status, fee_cents",
    )
    .in("status", [
      "submitted",
      "paid",
      "in_review",
      "awaiting_approval",
      "incomplete",
    ])
    .order("created_at", { ascending: true });

  const applications = apps ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a3a5c]">Application Queue</h1>
        <p className="text-sm text-gray-500">
          {applications.length} pending review
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600">No applications pending review.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Horse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Fee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => {
                const formData = (app.form_data ?? {}) as Record<
                  string,
                  string | null
                >;
                const status = app.status as ApplicationStatus;
                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="font-medium text-[#1a3a5c] hover:underline"
                      >
                        {formData.horse_name || "Untitled"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {APPLICATION_TYPE_LABELS[
                        app.application_type as ApplicationType
                      ] ?? app.application_type}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[status] ?? "default"}>
                        {STATUS_LABELS[status] ?? status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {app.fee_cents
                        ? formatCents(app.fee_cents as number)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(app.created_at as string).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
