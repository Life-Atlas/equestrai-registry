import { describe, it, expect } from "vitest";
import {
  validateApplicationForm,
  identifyMissingItems,
  type ApplicationFormData,
} from "@/lib/form-validation";

const validPurebred: ApplicationFormData = {
  application_type: "purebred_ialha_bred",
  horse_name: "Elegante III",
  sex: "stallion",
  breed_type: "pre",
  sire_id: "sire-uuid-1",
  dam_id: "dam-uuid-2",
  date_of_birth: "2023-04-15",
  microchip_number: "123456789012345",
  color: "Grey",
  marking_photos: ["front.jpg", "rear.jpg", "left.jpg", "right.jpg"],
};

describe("Form Validation — Purebred IALHA-Bred", () => {
  it("accepts valid purebred form", () => {
    const errors = validateApplicationForm(validPurebred);
    expect(errors).toHaveLength(0);
  });

  it("requires horse name", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      horse_name: "",
    });
    expect(errors.find((e) => e.field === "horse_name")).toBeDefined();
  });

  it("requires valid sex", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      sex: "invalid",
    });
    expect(errors.find((e) => e.field === "sex")).toBeDefined();
  });

  it("requires sire for purebred", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      sire_id: null,
    });
    expect(errors.find((e) => e.field === "sire_id")).toBeDefined();
  });

  it("requires dam for purebred", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      dam_id: null,
    });
    expect(errors.find((e) => e.field === "dam_id")).toBeDefined();
  });

  it("requires 4 marking photos", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      marking_photos: ["front.jpg", "rear.jpg"],
    });
    expect(errors.find((e) => e.field === "marking_photos")).toBeDefined();
  });

  it("validates microchip format (15 digits)", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      microchip_number: "1234",
    });
    expect(errors.find((e) => e.field === "microchip_number")).toBeDefined();
  });

  it("accepts null microchip (can be purchased later)", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      microchip_number: null,
    });
    expect(errors.find((e) => e.field === "microchip_number")).toBeUndefined();
  });

  it("rejects sire === dam", () => {
    const errors = validateApplicationForm({
      ...validPurebred,
      sire_id: "same-uuid",
      dam_id: "same-uuid",
    });
    expect(
      errors.find((e) => e.message === "Sire and dam cannot be the same horse"),
    ).toBeDefined();
  });
});

describe("Form Validation — Half-Bred", () => {
  const halfBred: ApplicationFormData = {
    application_type: "half_bred",
    horse_name: "Luna",
    sex: "mare",
    breed_type: "half_bred",
    sire_id: "sire-uuid",
    dam_id: null,
    date_of_birth: "2024-01-10",
    microchip_number: null,
    color: "Bay",
    marking_photos: [],
  };

  it("accepts half-bred with only sire", () => {
    const errors = validateApplicationForm(halfBred);
    expect(errors).toHaveLength(0);
  });

  it("accepts half-bred with only dam", () => {
    const errors = validateApplicationForm({
      ...halfBred,
      sire_id: null,
      dam_id: "dam-uuid",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects half-bred with no parents", () => {
    const errors = validateApplicationForm({
      ...halfBred,
      sire_id: null,
      dam_id: null,
    });
    expect(errors.find((e) => e.field === "sire_id")).toBeDefined();
  });
});

describe("Form Validation — Transfer", () => {
  const transfer: ApplicationFormData = {
    application_type: "transfer",
    horse_name: "Elegante III",
    sex: "stallion",
    breed_type: "pre",
    sire_id: null,
    dam_id: null,
    date_of_birth: null,
    microchip_number: null,
    color: null,
    marking_photos: [],
    transfer_to_email: "buyer@example.com",
  };

  it("accepts valid transfer", () => {
    const errors = validateApplicationForm(transfer);
    expect(errors).toHaveLength(0);
  });

  it("requires buyer email", () => {
    const errors = validateApplicationForm({
      ...transfer,
      transfer_to_email: "",
    });
    expect(errors.find((e) => e.field === "transfer_to_email")).toBeDefined();
  });
});

describe("Missing Items Identification", () => {
  it("identifies missing photos for purebred", () => {
    const missing = identifyMissingItems({
      ...validPurebred,
      marking_photos: ["front.jpg"],
    });
    expect(
      missing.filter((m) => m.key.startsWith("marking_photo_")),
    ).toHaveLength(3);
  });

  it("identifies missing microchip", () => {
    const missing = identifyMissingItems({
      ...validPurebred,
      microchip_number: null,
    });
    expect(missing.find((m) => m.key === "microchip")).toBeDefined();
  });

  it("identifies missing date of birth", () => {
    const missing = identifyMissingItems({
      ...validPurebred,
      date_of_birth: null,
    });
    expect(missing.find((m) => m.key === "date_of_birth")).toBeDefined();
  });

  it("returns empty for complete purebred application", () => {
    const missing = identifyMissingItems(validPurebred);
    expect(missing).toHaveLength(0);
  });
});
