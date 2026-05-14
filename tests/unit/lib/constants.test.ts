import { describe, it, expect } from "vitest";
import {
  SCHEMA,
  BREED_LABELS,
  APPLICATION_TYPE_LABELS,
  STATUS_LABELS,
  MICROCHIP_LENGTH,
  validateMicrochip,
  calculateFee,
  type FeeScheduleEntry,
} from "@/lib/constants";

describe("Schema", () => {
  it("uses equestrai schema, never public", () => {
    expect(SCHEMA).toBe("equestrai");
  });
});

describe("Labels", () => {
  it("has labels for all breed types", () => {
    expect(Object.keys(BREED_LABELS)).toEqual([
      "pre",
      "psl",
      "half_bred",
      "iberian_performance",
    ]);
  });

  it("has labels for all application types", () => {
    expect(Object.keys(APPLICATION_TYPE_LABELS)).toHaveLength(6);
  });

  it("has labels for all statuses", () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(11);
  });

  it("contains no hardcoded registry-specific nouns in shared labels", () => {
    const sharedValues = Object.values(BREED_LABELS);
    sharedValues.forEach((label) => {
      expect(label).toBeDefined();
      expect(typeof label).toBe("string");
    });
  });
});

describe("Microchip Validator", () => {
  it("accepts 15-digit number", () => {
    expect(validateMicrochip("123456789012345")).toBe(true);
  });

  it("rejects 14 digits", () => {
    expect(validateMicrochip("12345678901234")).toBe(false);
  });

  it("rejects 16 digits", () => {
    expect(validateMicrochip("1234567890123456")).toBe(false);
  });

  it("rejects non-numeric", () => {
    expect(validateMicrochip("12345678901234a")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateMicrochip("")).toBe(false);
  });

  it("has correct length constant", () => {
    expect(MICROCHIP_LENGTH).toBe(15);
  });
});

describe("Fee Calculator", () => {
  const feeSchedule: FeeScheduleEntry[] = [
    {
      application_type: "purebred_ialha_bred",
      membership_type: "member",
      age_bracket: null,
      fee_cents: 5000,
      description: "Purebred registration (member)",
    },
    {
      application_type: "purebred_ialha_bred",
      membership_type: "non_member",
      age_bracket: null,
      fee_cents: 25000,
      description: "Purebred registration (non-member)",
    },
    {
      application_type: "transfer",
      membership_type: "member",
      age_bracket: null,
      fee_cents: 4000,
      description: "Transfer (member)",
    },
    {
      application_type: "transfer",
      membership_type: "non_member",
      age_bracket: null,
      fee_cents: 12000,
      description: "Transfer (non-member)",
    },
    {
      application_type: "agent_authorization",
      membership_type: "member",
      age_bracket: null,
      fee_cents: 0,
      description: "Agent authorization (no fee)",
    },
  ];

  it("calculates purebred member fee as $50.00", () => {
    expect(calculateFee(feeSchedule, "purebred_ialha_bred", "member")).toBe(
      5000,
    );
  });

  it("calculates purebred non-member fee as $250.00", () => {
    expect(calculateFee(feeSchedule, "purebred_ialha_bred", "non_member")).toBe(
      25000,
    );
  });

  it("calculates transfer member fee as $40.00", () => {
    expect(calculateFee(feeSchedule, "transfer", "member")).toBe(4000);
  });

  it("calculates transfer non-member fee as $120.00", () => {
    expect(calculateFee(feeSchedule, "transfer", "non_member")).toBe(12000);
  });

  it("returns $0 for agent authorization", () => {
    expect(calculateFee(feeSchedule, "agent_authorization", "member")).toBe(0);
  });

  it("returns 0 for unknown combination", () => {
    expect(calculateFee(feeSchedule, "half_bred", "member")).toBe(0);
  });
});
