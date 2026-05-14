import type { ApplicationStatus } from "./constants";

export interface StaffActionResult {
  success: boolean;
  newStatus: ApplicationStatus;
  error?: string;
}

const VALID_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  submitted: ["in_review", "incomplete", "rejected"],
  paid: ["in_review", "incomplete", "rejected"],
  in_review: ["approved", "rejected", "incomplete", "awaiting_approval"],
  awaiting_approval: ["in_review", "approved", "rejected"],
  incomplete: ["in_review", "abandoned"],
};

export function canTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getAvailableActions(
  status: ApplicationStatus,
): ApplicationStatus[] {
  return VALID_TRANSITIONS[status] ?? [];
}

export function validateStaffAction(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
  staffRole: string,
): StaffActionResult {
  if (staffRole !== "staff" && staffRole !== "admin" && staffRole !== "board") {
    return {
      success: false,
      newStatus: currentStatus,
      error: "Insufficient permissions",
    };
  }

  if (!canTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      newStatus: currentStatus,
      error: `Cannot transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  return { success: true, newStatus: targetStatus };
}

export function generateRegistrationNumber(
  tenantPrefix: string,
  sequenceNum: number,
  year: number,
): string {
  const padded = String(sequenceNum).padStart(5, "0");
  return `${tenantPrefix}-${year}-${padded}`;
}
