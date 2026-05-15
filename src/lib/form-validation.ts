import type { ApplicationType } from "./constants";

export interface ApplicationFormData {
  application_type: ApplicationType;
  horse_name: string;
  sex: string;
  breed_type: string;
  sire_id: string | null;
  dam_id: string | null;
  date_of_birth: string | null;
  microchip_number: string | null;
  color: string | null;
  marking_photos: string[];
  transfer_to_email?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateApplicationForm(
  data: ApplicationFormData,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.horse_name?.trim()) {
    errors.push({ field: "horse_name", message: "Horse name is required" });
  }

  if (!data.sex || !["stallion", "mare", "gelding"].includes(data.sex)) {
    errors.push({
      field: "sex",
      message: "Sex must be stallion, mare, or gelding",
    });
  }

  if (
    !data.breed_type ||
    !["pre", "psl", "half_bred", "iberian_performance"].includes(
      data.breed_type,
    )
  ) {
    errors.push({ field: "breed_type", message: "Invalid breed type" });
  }

  if (data.application_type === "purebred_ialha_bred") {
    if (!data.sire_id) {
      errors.push({
        field: "sire_id",
        message: "Sire is required for purebred IALHA-bred registration",
      });
    }
    if (!data.dam_id) {
      errors.push({
        field: "dam_id",
        message: "Dam is required for purebred IALHA-bred registration",
      });
    }
    if (data.marking_photos.length < 4) {
      errors.push({
        field: "marking_photos",
        message: "4 marking photos required (front, rear, left, right)",
      });
    }
    if (data.microchip_number && !/^\d{15}$/.test(data.microchip_number)) {
      errors.push({
        field: "microchip_number",
        message: "Microchip must be 15 digits",
      });
    }
  }

  if (data.application_type === "purebred_non_ialha") {
    if (!data.sire_id) {
      errors.push({
        field: "sire_id",
        message: "Sire is required for purebred registration",
      });
    }
    if (!data.dam_id) {
      errors.push({
        field: "dam_id",
        message: "Dam is required for purebred registration",
      });
    }
  }

  if (data.application_type === "half_bred") {
    if (!data.sire_id && !data.dam_id) {
      errors.push({
        field: "sire_id",
        message: "At least one IALHA-registered parent is required",
      });
    }
  }

  if (data.application_type === "transfer") {
    if (!data.transfer_to_email?.trim()) {
      errors.push({
        field: "transfer_to_email",
        message: "Buyer email is required for transfers",
      });
    }
  }

  if (data.sire_id && data.dam_id && data.sire_id === data.dam_id) {
    errors.push({
      field: "sire_id",
      message: "Sire and dam cannot be the same horse",
    });
  }

  return errors;
}

export interface MissingItem {
  key: string;
  label: string;
}

export function identifyMissingItems(data: ApplicationFormData): MissingItem[] {
  const missing: MissingItem[] = [];

  if (data.application_type === "purebred_ialha_bred") {
    if (data.marking_photos.length < 4) {
      const needed = ["front", "rear", "left", "right"];
      for (let i = data.marking_photos.length; i < 4; i++) {
        missing.push({
          key: `marking_photo_${needed[i]}`,
          label: `${needed[i].charAt(0).toUpperCase() + needed[i].slice(1)} marking photo`,
        });
      }
    }
    if (!data.microchip_number) {
      missing.push({
        key: "microchip",
        label: "Microchip number or purchase flag",
      });
    }
  }

  if (!data.date_of_birth) {
    missing.push({ key: "date_of_birth", label: "Date of birth" });
  }

  return missing;
}
