import { describe, it, expect } from "vitest";
import {
  screenApplication,
  estimateCostCents,
  isWithinDailyBudget,
  type ScreeningInput,
} from "@/lib/ai-screening";

const validPurebred: ScreeningInput = {
  application_type: "purebred_ialha_bred",
  horse_name: "Elegante III",
  sex: "stallion",
  breed_type: "pre",
  sire_name: "Granero",
  dam_name: "Estrella",
  sire_id: "sire-uuid-1",
  dam_id: "dam-uuid-2",
  date_of_birth: "2023-04-15",
  microchip_number: "123456789012345",
  color: "Grey",
  marking_photos: ["front.jpg", "rear.jpg", "left.jpg", "right.jpg"],
  transfer_to_email: null,
};

describe("AI Screening — screenApplication", () => {
  it("auto-approves complete purebred application", () => {
    const result = screenApplication(validPurebred);
    expect(result.autoApprovable).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.95);
    expect(result.flags.filter((f) => f.severity === "error")).toHaveLength(0);
  });

  it("flags missing horse name", () => {
    const result = screenApplication({ ...validPurebred, horse_name: "" });
    expect(result.autoApprovable).toBe(false);
    expect(result.flags.find((f) => f.field === "horse_name")).toBeDefined();
  });

  it("flags invalid sex", () => {
    const result = screenApplication({ ...validPurebred, sex: "invalid" });
    expect(result.flags.find((f) => f.field === "sex")).toBeDefined();
    expect(result.autoApprovable).toBe(false);
  });

  it("flags missing sire for purebred", () => {
    const result = screenApplication({
      ...validPurebred,
      sire_id: null,
      sire_name: null,
    });
    expect(result.flags.find((f) => f.field === "sire")).toBeDefined();
  });

  it("flags missing dam for purebred", () => {
    const result = screenApplication({
      ...validPurebred,
      dam_id: null,
      dam_name: null,
    });
    expect(result.flags.find((f) => f.field === "dam")).toBeDefined();
  });

  it("warns on insufficient marking photos", () => {
    const result = screenApplication({
      ...validPurebred,
      marking_photos: ["front.jpg"],
    });
    const flag = result.flags.find((f) => f.field === "marking_photos");
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("warning");
  });

  it("flags sire === dam", () => {
    const result = screenApplication({
      ...validPurebred,
      sire_id: "same-id",
      dam_id: "same-id",
    });
    expect(
      result.flags.find(
        (f) => f.message === "Sire and dam cannot be the same horse",
      ),
    ).toBeDefined();
    expect(result.autoApprovable).toBe(false);
  });

  it("flags invalid microchip format", () => {
    const result = screenApplication({
      ...validPurebred,
      microchip_number: "1234",
    });
    expect(
      result.flags.find((f) => f.field === "microchip_number"),
    ).toBeDefined();
  });

  it("flags future date of birth", () => {
    const result = screenApplication({
      ...validPurebred,
      date_of_birth: "2099-01-01",
    });
    expect(
      result.flags.find(
        (f) => f.field === "date_of_birth" && f.severity === "error",
      ),
    ).toBeDefined();
  });

  it("info-flags missing optional fields", () => {
    const result = screenApplication({
      ...validPurebred,
      date_of_birth: null,
      microchip_number: null,
    });
    const infoFlags = result.flags.filter((f) => f.severity === "info");
    expect(infoFlags.length).toBeGreaterThanOrEqual(2);
  });

  it("handles half-bred with one parent", () => {
    const halfBred: ScreeningInput = {
      ...validPurebred,
      application_type: "half_bred",
      breed_type: "half_bred",
      dam_id: null,
      dam_name: null,
      marking_photos: [],
    };
    const result = screenApplication(halfBred);
    expect(
      result.flags.filter((f) => f.severity === "error" && f.field === "sire"),
    ).toHaveLength(0);
  });

  it("flags half-bred with no parents", () => {
    const halfBred: ScreeningInput = {
      ...validPurebred,
      application_type: "half_bred",
      breed_type: "half_bred",
      sire_id: null,
      sire_name: null,
      dam_id: null,
      dam_name: null,
      marking_photos: [],
    };
    const result = screenApplication(halfBred);
    expect(result.flags.find((f) => f.field === "sire")).toBeDefined();
  });

  it("flags transfer without buyer email", () => {
    const transfer: ScreeningInput = {
      ...validPurebred,
      application_type: "transfer",
      transfer_to_email: null,
    };
    const result = screenApplication(transfer);
    expect(
      result.flags.find((f) => f.field === "transfer_to_email"),
    ).toBeDefined();
  });

  it("clamps confidence between 0 and 1", () => {
    const terrible: ScreeningInput = {
      application_type: "purebred_ialha_bred",
      horse_name: "",
      sex: "invalid",
      breed_type: "pre",
      sire_name: null,
      dam_name: null,
      sire_id: "same",
      dam_id: "same",
      date_of_birth: "2099-01-01",
      microchip_number: "bad",
      color: null,
      marking_photos: [],
      transfer_to_email: null,
    };
    const result = screenApplication(terrible);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("generates meaningful summary", () => {
    const result = screenApplication(validPurebred);
    expect(result.summary).toContain("passes all");
  });

  it("generates error summary when errors exist", () => {
    const result = screenApplication({ ...validPurebred, horse_name: "" });
    expect(result.summary).toContain("error");
  });
});

describe("AI Screening — Cost Controls", () => {
  it("estimates cost for claude-sonnet-4-6", () => {
    const cost = estimateCostCents(1000, 500, "claude-sonnet-4-6");
    expect(cost).toBeGreaterThanOrEqual(0);
    expect(typeof cost).toBe("number");
  });

  it("estimates cost for claude-haiku-4-5", () => {
    const cost = estimateCostCents(1000, 500, "claude-haiku-4-5");
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  it("falls back to sonnet rates for unknown model", () => {
    const costUnknown = estimateCostCents(1000, 500, "unknown-model");
    const costSonnet = estimateCostCents(1000, 500, "claude-sonnet-4-6");
    expect(costUnknown).toBe(costSonnet);
  });

  it("allows within budget", () => {
    expect(isWithinDailyBudget(50, 1000)).toBe(true);
  });

  it("blocks over budget", () => {
    expect(isWithinDailyBudget(1000, 1000)).toBe(false);
  });

  it("blocks at exact limit", () => {
    expect(isWithinDailyBudget(500, 500)).toBe(false);
  });
});
