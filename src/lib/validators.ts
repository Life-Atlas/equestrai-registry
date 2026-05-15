import type { BreedType } from "./constants";
import { validateMicrochip } from "./constants";

export { validateMicrochip };

export interface PedigreeInput {
  sire_id: string | null;
  dam_id: string | null;
  sire_sex?: string;
  dam_sex?: string;
  breed_type: BreedType;
}

export interface PedigreeValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePedigree(
  input: PedigreeInput,
): PedigreeValidationResult {
  const errors: string[] = [];

  if (input.sire_id && input.dam_id && input.sire_id === input.dam_id) {
    errors.push("Sire and dam cannot be the same horse");
  }

  if (input.sire_sex && input.sire_sex === "mare") {
    errors.push("Sire cannot be a mare");
  }

  if (input.dam_sex && input.dam_sex === "stallion") {
    errors.push("Dam cannot be a stallion");
  }

  if (
    (input.breed_type === "pre" || input.breed_type === "psl") &&
    (!input.sire_id || !input.dam_id)
  ) {
    errors.push("Purebred registration requires both sire and dam");
  }

  if (input.breed_type === "half_bred" && !input.sire_id && !input.dam_id) {
    errors.push(
      "Half-bred registration requires at least one registered parent",
    );
  }

  return { valid: errors.length === 0, errors };
}

export interface HorseFormInput {
  name: string;
  sex: string;
  breed_type: string;
  color?: string;
  date_of_birth?: string;
}

export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateHorseForm(input: HorseFormInput): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = "Horse name is required";
  }

  if (!input.sex || !["stallion", "mare", "gelding"].includes(input.sex)) {
    errors.sex = "Sex must be stallion, mare, or gelding";
  }

  if (
    !input.breed_type ||
    !["pre", "psl", "half_bred", "iberian_performance"].includes(
      input.breed_type,
    )
  ) {
    errors.breed_type = "Invalid breed type";
  }

  if (input.date_of_birth) {
    const dob = new Date(input.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = "Invalid date format";
    } else if (dob > new Date()) {
      errors.date_of_birth = "Date of birth cannot be in the future";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
