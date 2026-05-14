import { describe, it, expect } from "vitest";
import {
  validateMicrochip,
  validatePedigree,
  validateHorseForm,
} from "@/lib/validators";

describe("Microchip Validator", () => {
  it("accepts valid 15-digit microchip", () => {
    expect(validateMicrochip("123456789012345")).toBe(true);
  });

  it("rejects 14 digits", () => {
    expect(validateMicrochip("12345678901234")).toBe(false);
  });

  it("rejects non-numeric characters", () => {
    expect(validateMicrochip("12345678901234a")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateMicrochip("")).toBe(false);
  });
});

describe("Pedigree Validator", () => {
  it("accepts valid sire+dam for purebred", () => {
    const result = validatePedigree({
      sire_id: "sire-uuid",
      dam_id: "dam-uuid",
      sire_sex: "stallion",
      dam_sex: "mare",
      breed_type: "pre",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects sire === dam", () => {
    const result = validatePedigree({
      sire_id: "same-uuid",
      dam_id: "same-uuid",
      breed_type: "pre",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Sire and dam cannot be the same horse");
  });

  it("rejects mare as sire", () => {
    const result = validatePedigree({
      sire_id: "sire-uuid",
      dam_id: "dam-uuid",
      sire_sex: "mare",
      dam_sex: "mare",
      breed_type: "pre",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Sire cannot be a mare");
  });

  it("rejects stallion as dam", () => {
    const result = validatePedigree({
      sire_id: "sire-uuid",
      dam_id: "dam-uuid",
      sire_sex: "stallion",
      dam_sex: "stallion",
      breed_type: "pre",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Dam cannot be a stallion");
  });

  it("requires both parents for purebred PRE", () => {
    const result = validatePedigree({
      sire_id: "sire-uuid",
      dam_id: null,
      breed_type: "pre",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Purebred registration requires both sire and dam",
    );
  });

  it("requires both parents for purebred PSL", () => {
    const result = validatePedigree({
      sire_id: null,
      dam_id: "dam-uuid",
      breed_type: "psl",
    });
    expect(result.valid).toBe(false);
  });

  it("requires at least one parent for half-bred", () => {
    const result = validatePedigree({
      sire_id: null,
      dam_id: null,
      breed_type: "half_bred",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Half-bred registration requires at least one registered parent",
    );
  });

  it("accepts half-bred with only sire", () => {
    const result = validatePedigree({
      sire_id: "sire-uuid",
      dam_id: null,
      breed_type: "half_bred",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts half-bred with only dam", () => {
    const result = validatePedigree({
      sire_id: null,
      dam_id: "dam-uuid",
      breed_type: "half_bred",
    });
    expect(result.valid).toBe(true);
  });
});

describe("Horse Form Validator", () => {
  it("accepts valid form input", () => {
    const result = validateHorseForm({
      name: "Elegante III",
      sex: "stallion",
      breed_type: "pre",
      color: "Grey",
      date_of_birth: "2022-03-15",
    });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it("requires horse name", () => {
    const result = validateHorseForm({
      name: "",
      sex: "stallion",
      breed_type: "pre",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe("Horse name is required");
  });

  it("requires valid sex", () => {
    const result = validateHorseForm({
      name: "Test Horse",
      sex: "invalid",
      breed_type: "pre",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.sex).toBeDefined();
  });

  it("requires valid breed type", () => {
    const result = validateHorseForm({
      name: "Test Horse",
      sex: "mare",
      breed_type: "invalid",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.breed_type).toBeDefined();
  });

  it("rejects future date of birth", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = validateHorseForm({
      name: "Test Horse",
      sex: "mare",
      breed_type: "pre",
      date_of_birth: futureDate.toISOString().split("T")[0],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.date_of_birth).toBe(
      "Date of birth cannot be in the future",
    );
  });

  it("accepts form without optional fields", () => {
    const result = validateHorseForm({
      name: "Test Horse",
      sex: "gelding",
      breed_type: "half_bred",
    });
    expect(result.valid).toBe(true);
  });
});
