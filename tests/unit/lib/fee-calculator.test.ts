import { describe, it, expect } from "vitest";
import {
  lookupFee,
  formatCents,
  type FeeScheduleRow,
} from "@/lib/fee-calculator";

const IALHA_SCHEDULE: FeeScheduleRow[] = [
  {
    application_type: "purebred_ialha_bred",
    membership_type: "member",
    age_bracket: null,
    fee_cents: 5000,
    currency: "usd",
    description: "Purebred registration (member)",
  },
  {
    application_type: "purebred_ialha_bred",
    membership_type: "non_member",
    age_bracket: null,
    fee_cents: 25000,
    currency: "usd",
    description: "Purebred registration (non-member)",
  },
  {
    application_type: "purebred_non_ialha",
    membership_type: "member",
    age_bracket: null,
    fee_cents: 5000,
    currency: "usd",
    description: "Non-IALHA purebred (member)",
  },
  {
    application_type: "purebred_non_ialha",
    membership_type: "non_member",
    age_bracket: null,
    fee_cents: 25000,
    currency: "usd",
    description: "Non-IALHA purebred (non-member)",
  },
  {
    application_type: "half_bred",
    membership_type: "member",
    age_bracket: null,
    fee_cents: 5000,
    currency: "usd",
    description: "Half-bred (member)",
  },
  {
    application_type: "half_bred",
    membership_type: "non_member",
    age_bracket: null,
    fee_cents: 25000,
    currency: "usd",
    description: "Half-bred (non-member)",
  },
  {
    application_type: "transfer",
    membership_type: "member",
    age_bracket: null,
    fee_cents: 4000,
    currency: "usd",
    description: "Transfer (member)",
  },
  {
    application_type: "transfer",
    membership_type: "non_member",
    age_bracket: null,
    fee_cents: 12000,
    currency: "usd",
    description: "Transfer (non-member)",
  },
  {
    application_type: "agent_authorization",
    membership_type: "member",
    age_bracket: null,
    fee_cents: 0,
    currency: "usd",
    description: "Agent authorization (no fee)",
  },
];

describe("Fee Calculator — lookupFee", () => {
  it("finds purebred IALHA-bred member fee ($50)", () => {
    const result = lookupFee(IALHA_SCHEDULE, "purebred_ialha_bred", "member");
    expect(result.found).toBe(true);
    expect(result.fee_cents).toBe(5000);
  });

  it("finds purebred IALHA-bred non-member fee ($250)", () => {
    const result = lookupFee(
      IALHA_SCHEDULE,
      "purebred_ialha_bred",
      "non_member",
    );
    expect(result.found).toBe(true);
    expect(result.fee_cents).toBe(25000);
  });

  it("finds transfer member fee ($40)", () => {
    const result = lookupFee(IALHA_SCHEDULE, "transfer", "member");
    expect(result.fee_cents).toBe(4000);
  });

  it("finds transfer non-member fee ($120)", () => {
    const result = lookupFee(IALHA_SCHEDULE, "transfer", "non_member");
    expect(result.fee_cents).toBe(12000);
  });

  it("finds agent authorization as $0", () => {
    const result = lookupFee(IALHA_SCHEDULE, "agent_authorization", "member");
    expect(result.found).toBe(true);
    expect(result.fee_cents).toBe(0);
  });

  it("returns not-found for missing combination", () => {
    const result = lookupFee(
      IALHA_SCHEDULE,
      "iberian_performance_cert",
      "member",
    );
    expect(result.found).toBe(false);
    expect(result.fee_cents).toBe(0);
  });

  it("falls back to null age_bracket when specific bracket not found", () => {
    const result = lookupFee(
      IALHA_SCHEDULE,
      "purebred_ialha_bred",
      "member",
      "foal",
    );
    expect(result.found).toBe(true);
    expect(result.fee_cents).toBe(5000);
  });

  it("prefers exact age bracket match", () => {
    const withFoal: FeeScheduleRow[] = [
      ...IALHA_SCHEDULE,
      {
        application_type: "purebred_ialha_bred",
        membership_type: "member",
        age_bracket: "foal",
        fee_cents: 3500,
        currency: "usd",
        description: "Purebred foal (member)",
      },
    ];
    const result = lookupFee(withFoal, "purebred_ialha_bred", "member", "foal");
    expect(result.fee_cents).toBe(3500);
  });

  it("returns USD currency", () => {
    const result = lookupFee(IALHA_SCHEDULE, "half_bred", "member");
    expect(result.currency).toBe("usd");
  });
});

describe("Fee Calculator — formatCents", () => {
  it("formats 5000 cents as $50.00", () => {
    expect(formatCents(5000)).toBe("$50.00");
  });

  it("formats 25000 cents as $250.00", () => {
    expect(formatCents(25000)).toBe("$250.00");
  });

  it("formats 0 cents as $0.00", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats 4000 cents as $40.00", () => {
    expect(formatCents(4000)).toBe("$40.00");
  });

  it("formats 12050 cents as $120.50", () => {
    expect(formatCents(12050)).toBe("$120.50");
  });
});
