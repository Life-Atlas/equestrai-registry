import { describe, it, expect } from "vitest";
import {
  canTransition,
  getAvailableActions,
  validateStaffAction,
  generateRegistrationNumber,
} from "@/lib/staff-actions";

describe("Staff Actions — canTransition", () => {
  it("allows submitted → in_review", () => {
    expect(canTransition("submitted", "in_review")).toBe(true);
  });

  it("allows submitted → rejected", () => {
    expect(canTransition("submitted", "rejected")).toBe(true);
  });

  it("allows in_review → approved", () => {
    expect(canTransition("in_review", "approved")).toBe(true);
  });

  it("allows in_review → rejected", () => {
    expect(canTransition("in_review", "rejected")).toBe(true);
  });

  it("allows in_review → incomplete", () => {
    expect(canTransition("in_review", "incomplete")).toBe(true);
  });

  it("allows paid → in_review", () => {
    expect(canTransition("paid", "in_review")).toBe(true);
  });

  it("blocks draft → approved (no skip)", () => {
    expect(canTransition("draft", "approved")).toBe(false);
  });

  it("blocks approved → anything", () => {
    expect(canTransition("approved", "rejected")).toBe(false);
  });

  it("blocks rejected → anything", () => {
    expect(canTransition("rejected", "approved")).toBe(false);
  });

  it("allows incomplete → in_review (resubmit)", () => {
    expect(canTransition("incomplete", "in_review")).toBe(true);
  });

  it("allows incomplete → abandoned", () => {
    expect(canTransition("incomplete", "abandoned")).toBe(true);
  });

  it("allows awaiting_approval → approved", () => {
    expect(canTransition("awaiting_approval", "approved")).toBe(true);
  });
});

describe("Staff Actions — getAvailableActions", () => {
  it("returns actions for submitted status", () => {
    const actions = getAvailableActions("submitted");
    expect(actions).toContain("in_review");
    expect(actions).toContain("incomplete");
    expect(actions).toContain("rejected");
  });

  it("returns empty for approved (terminal)", () => {
    const actions = getAvailableActions("approved");
    expect(actions).toHaveLength(0);
  });

  it("returns empty for draft (not staff-actionable)", () => {
    const actions = getAvailableActions("draft");
    expect(actions).toHaveLength(0);
  });
});

describe("Staff Actions — validateStaffAction", () => {
  it("allows staff to transition submitted → in_review", () => {
    const result = validateStaffAction("submitted", "in_review", "staff");
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("in_review");
  });

  it("allows admin to transition", () => {
    const result = validateStaffAction("in_review", "approved", "admin");
    expect(result.success).toBe(true);
  });

  it("allows board to transition", () => {
    const result = validateStaffAction("in_review", "approved", "board");
    expect(result.success).toBe(true);
  });

  it("rejects member attempting staff action", () => {
    const result = validateStaffAction("submitted", "in_review", "member");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient permissions");
  });

  it("rejects invalid transition even for staff", () => {
    const result = validateStaffAction("draft", "approved", "staff");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot transition");
  });
});

describe("Staff Actions — generateRegistrationNumber", () => {
  it("generates IALHA format", () => {
    expect(generateRegistrationNumber("IALHA", 1, 2026)).toBe(
      "IALHA-2026-00001",
    );
  });

  it("pads to 5 digits", () => {
    expect(generateRegistrationNumber("IALHA", 42, 2026)).toBe(
      "IALHA-2026-00042",
    );
  });

  it("handles large sequence numbers", () => {
    expect(generateRegistrationNumber("IALHA", 15432, 2026)).toBe(
      "IALHA-2026-15432",
    );
  });
});
