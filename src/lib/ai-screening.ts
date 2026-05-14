import type { ApplicationType, BreedType } from "./constants";

export interface ScreeningInput {
  application_type: ApplicationType;
  horse_name: string;
  sex: string;
  breed_type: BreedType;
  sire_name: string | null;
  dam_name: string | null;
  sire_id: string | null;
  dam_id: string | null;
  date_of_birth: string | null;
  microchip_number: string | null;
  color: string | null;
  marking_photos: string[];
  transfer_to_email: string | null;
}

export interface ScreeningFlag {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface ScreeningResult {
  confidence: number;
  flags: ScreeningFlag[];
  autoApprovable: boolean;
  summary: string;
}

const VALID_SEXES = ["stallion", "mare", "gelding"];

export function screenApplication(input: ScreeningInput): ScreeningResult {
  const flags: ScreeningFlag[] = [];
  let score = 1.0;

  if (!input.horse_name || input.horse_name.trim().length < 2) {
    flags.push({
      field: "horse_name",
      severity: "error",
      message: "Horse name is too short or missing",
    });
    score -= 0.3;
  }

  if (!VALID_SEXES.includes(input.sex)) {
    flags.push({
      field: "sex",
      severity: "error",
      message: "Invalid sex value",
    });
    score -= 0.2;
  }

  const isPurebred =
    input.application_type === "purebred_ialha_bred" ||
    input.application_type === "purebred_non_ialha";

  if (isPurebred) {
    if (!input.sire_id && !input.sire_name) {
      flags.push({
        field: "sire",
        severity: "error",
        message: "Purebred registration requires sire information",
      });
      score -= 0.3;
    }
    if (!input.dam_id && !input.dam_name) {
      flags.push({
        field: "dam",
        severity: "error",
        message: "Purebred registration requires dam information",
      });
      score -= 0.3;
    }
    if (input.marking_photos.length < 4) {
      flags.push({
        field: "marking_photos",
        severity: "warning",
        message: `Only ${input.marking_photos.length}/4 marking photos provided`,
      });
      score -= 0.1 * (4 - input.marking_photos.length);
    }
  }

  if (input.application_type === "half_bred") {
    if (
      !input.sire_id &&
      !input.sire_name &&
      !input.dam_id &&
      !input.dam_name
    ) {
      flags.push({
        field: "sire",
        severity: "error",
        message: "Half-bred requires at least one parent",
      });
      score -= 0.3;
    }
  }

  if (input.application_type === "transfer") {
    if (!input.transfer_to_email) {
      flags.push({
        field: "transfer_to_email",
        severity: "error",
        message: "Transfer requires buyer email",
      });
      score -= 0.3;
    }
  }

  if (input.microchip_number && !/^\d{15}$/.test(input.microchip_number)) {
    flags.push({
      field: "microchip_number",
      severity: "error",
      message: "Microchip must be exactly 15 digits",
    });
    score -= 0.2;
  }

  if (input.date_of_birth) {
    const dob = new Date(input.date_of_birth);
    if (dob > new Date()) {
      flags.push({
        field: "date_of_birth",
        severity: "error",
        message: "Date of birth cannot be in the future",
      });
      score -= 0.2;
    }
  }

  if (input.sire_id && input.dam_id && input.sire_id === input.dam_id) {
    flags.push({
      field: "sire",
      severity: "error",
      message: "Sire and dam cannot be the same horse",
    });
    score -= 0.5;
  }

  if (!input.date_of_birth) {
    flags.push({
      field: "date_of_birth",
      severity: "info",
      message: "Date of birth not provided — can be added later",
    });
  }

  if (!input.microchip_number) {
    flags.push({
      field: "microchip_number",
      severity: "info",
      message: "Microchip not provided — can be added later",
    });
  }

  const confidence = Math.max(0, Math.min(1, score));
  const hasErrors = flags.some((f) => f.severity === "error");
  const autoApprovable = confidence > 0.95 && !hasErrors;

  const errorCount = flags.filter((f) => f.severity === "error").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;

  let summary: string;
  if (autoApprovable) {
    summary = "Application passes all automated checks";
  } else if (hasErrors) {
    summary = `Application has ${errorCount} error(s) and ${warningCount} warning(s) requiring review`;
  } else {
    summary = `Application has ${warningCount} warning(s) — manual review recommended`;
  }

  return { confidence, flags, autoApprovable, summary };
}

export interface AICostRecord {
  tenantId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costCents: number;
  purpose: string;
  timestamp: string;
}

export function estimateCostCents(
  inputTokens: number,
  outputTokens: number,
  model: string,
): number {
  const rates: Record<string, { input: number; output: number }> = {
    "claude-sonnet-4-6": { input: 0.3, output: 1.5 },
    "claude-haiku-4-5": { input: 0.08, output: 0.4 },
  };
  const rate = rates[model] ?? rates["claude-sonnet-4-6"];
  return Math.ceil(
    (inputTokens / 1_000_000) * rate.input * 100 +
      (outputTokens / 1_000_000) * rate.output * 100,
  );
}

export function isWithinDailyBudget(
  todayCostCents: number,
  dailyLimitCents: number,
): boolean {
  return todayCostCents < dailyLimitCents;
}
