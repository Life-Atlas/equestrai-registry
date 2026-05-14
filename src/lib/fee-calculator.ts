import type { ApplicationType } from "./constants";

export interface FeeScheduleRow {
  application_type: string;
  membership_type: string;
  age_bracket: string | null;
  fee_cents: number;
  currency: string;
  description: string | null;
}

export interface FeeResult {
  fee_cents: number;
  currency: string;
  description: string | null;
  found: boolean;
}

export function lookupFee(
  schedule: FeeScheduleRow[],
  applicationType: ApplicationType,
  membershipType: "member" | "non_member",
  ageBracket?: string | null,
): FeeResult {
  const exact = schedule.find(
    (row) =>
      row.application_type === applicationType &&
      row.membership_type === membershipType &&
      row.age_bracket === (ageBracket ?? null),
  );

  if (exact) {
    return {
      fee_cents: exact.fee_cents,
      currency: exact.currency,
      description: exact.description,
      found: true,
    };
  }

  const fallback = schedule.find(
    (row) =>
      row.application_type === applicationType &&
      row.membership_type === membershipType &&
      row.age_bracket === null,
  );

  if (fallback) {
    return {
      fee_cents: fallback.fee_cents,
      currency: fallback.currency,
      description: fallback.description,
      found: true,
    };
  }

  return { fee_cents: 0, currency: "usd", description: null, found: false };
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
