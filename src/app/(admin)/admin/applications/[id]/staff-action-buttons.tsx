"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/constants";

const actionVariant: Partial<
  Record<ApplicationStatus, "primary" | "secondary" | "danger">
> = {
  approved: "primary",
  in_review: "secondary",
  rejected: "danger",
  incomplete: "secondary",
  abandoned: "danger",
  awaiting_approval: "secondary",
};

export function StaffActionButtons({
  applicationId,
  availableActions,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
  availableActions: ApplicationStatus[];
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleAction(targetStatus: ApplicationStatus) {
    setError("");
    setLoading(targetStatus);

    const res = await fetch("/api/admin/applications/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, targetStatus }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Action failed");
      setLoading(null);
      return;
    }

    router.refresh();
    setLoading(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((action) => (
          <Button
            key={action}
            variant={actionVariant[action] ?? "secondary"}
            size="sm"
            loading={loading === action}
            disabled={loading !== null}
            onClick={() => handleAction(action)}
          >
            {STATUS_LABELS[action] ?? action}
          </Button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
