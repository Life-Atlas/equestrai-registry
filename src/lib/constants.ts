export const SCHEMA = "equestrai" as const;

export type BreedType = "pre" | "psl" | "half_bred" | "iberian_performance";

export type ApplicationType =
  | "purebred_ialha_bred"
  | "purebred_non_ialha"
  | "half_bred"
  | "transfer"
  | "agent_authorization"
  | "iberian_performance_cert";

export type MembershipType = "standard" | "premium" | "lifetime" | "non_member";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "intake_complete"
  | "awaiting_payment"
  | "paid"
  | "awaiting_approval"
  | "in_review"
  | "approved"
  | "rejected"
  | "incomplete"
  | "abandoned";

export type HorseStatus =
  | "pending"
  | "registered"
  | "transferred"
  | "deceased"
  | "archived";

export type UserRole = "member" | "staff" | "admin" | "board";

export type NotificationChannel = "email" | "sms" | "whatsapp";

export type SupportedLanguage = "en" | "es";

export const BREED_LABELS: Record<BreedType, string> = {
  pre: "P.R.E. (Pura Raza Española)",
  psl: "P.S.L. (Puro Sangue Lusitano)",
  half_bred: "Half-Bred",
  iberian_performance: "Iberian Performance",
};

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  purebred_ialha_bred: "Purebred (IALHA-Bred)",
  purebred_non_ialha: "Purebred (Non-IALHA)",
  half_bred: "Half-Bred",
  transfer: "Transfer of Ownership",
  agent_authorization: "Agent Authorization",
  iberian_performance_cert: "Iberian Performance Certificate",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  intake_complete: "Intake Complete",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  awaiting_approval: "Awaiting Approval",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
  incomplete: "Incomplete",
  abandoned: "Abandoned",
};

export const MICROCHIP_LENGTH = 15;

export function validateMicrochip(value: string): boolean {
  return /^\d{15}$/.test(value);
}

export interface FeeScheduleEntry {
  application_type: ApplicationType;
  membership_type: "member" | "non_member";
  age_bracket: string | null;
  fee_cents: number;
  description: string;
}

export function calculateFee(
  feeSchedule: FeeScheduleEntry[],
  applicationType: ApplicationType,
  membershipType: "member" | "non_member",
  ageBracket?: string | null,
): number {
  const entry = feeSchedule.find(
    (f) =>
      f.application_type === applicationType &&
      f.membership_type === membershipType &&
      (f.age_bracket === null || f.age_bracket === ageBracket),
  );
  return entry?.fee_cents ?? 0;
}
