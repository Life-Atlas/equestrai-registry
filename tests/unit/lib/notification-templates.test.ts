import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  getAvailableTypes,
  type NotificationType,
} from "@/lib/notification-templates";

describe("Notification Templates — renderTemplate", () => {
  it("renders English submission notification", () => {
    const result = renderTemplate("application_submitted", "en", {
      horse_name: "Elegante III",
      application_id: "abc-123",
    });
    expect(result.subject).toBe("Application Received — Elegante III");
    expect(result.body).toContain("Elegante III");
    expect(result.body).toContain("abc-123");
  });

  it("renders Spanish submission notification", () => {
    const result = renderTemplate("application_submitted", "es", {
      horse_name: "Elegante III",
      application_id: "abc-123",
    });
    expect(result.subject).toBe("Solicitud Recibida — Elegante III");
    expect(result.body).toContain("Elegante III");
    expect(result.body).toContain("abc-123");
  });

  it("renders payment received with amount", () => {
    const result = renderTemplate("payment_received", "en", {
      horse_name: "Luna",
      amount: "$50.00",
    });
    expect(result.subject).toContain("Payment Confirmed");
    expect(result.body).toContain("$50.00");
    expect(result.body).toContain("Luna");
  });

  it("renders missing items notification", () => {
    const result = renderTemplate("missing_items", "en", {
      horse_name: "Andaluz",
      items: "front photo, DNA report",
    });
    expect(result.body).toContain("front photo, DNA report");
  });

  it("renders sire approval request with link", () => {
    const result = renderTemplate("sire_approval_request", "en", {
      horse_name: "Foal X",
      sire_name: "Stallion Y",
      approval_link: "https://example.com/approve/abc",
    });
    expect(result.body).toContain("Stallion Y");
    expect(result.body).toContain("https://example.com/approve/abc");
  });

  it("renders sire approval request in Spanish", () => {
    const result = renderTemplate("sire_approval_request", "es", {
      horse_name: "Potro X",
      sire_name: "Semental Y",
      approval_link: "https://example.com/approve/abc",
    });
    expect(result.subject).toContain("Aprobación del Semental");
    expect(result.body).toContain("Semental Y");
  });

  it("renders application approved with registration number", () => {
    const result = renderTemplate("application_approved", "en", {
      horse_name: "Elegante III",
      registration_number: "IALHA-2026-00001",
    });
    expect(result.subject).toContain("Congratulations");
    expect(result.body).toContain("IALHA-2026-00001");
  });

  it("renders application rejected with reason", () => {
    const result = renderTemplate("application_rejected", "en", {
      horse_name: "Unknown Horse",
      reason: "Incomplete pedigree documentation",
    });
    expect(result.body).toContain("Incomplete pedigree documentation");
  });

  it("replaces missing vars with empty string", () => {
    const result = renderTemplate("application_submitted", "en", {});
    expect(result.subject).toBe("Application Received — ");
    expect(result.body).not.toContain("{{");
  });

  it("handles status change notification", () => {
    const result = renderTemplate("status_change", "en", {
      horse_name: "Estrella",
      status: "In Review",
    });
    expect(result.body).toContain("In Review");
  });

  it("renders sire approved notification", () => {
    const result = renderTemplate("sire_approved", "en", {
      horse_name: "Foal",
      sire_name: "Stallion",
    });
    expect(result.body).toContain("approved the use of Stallion");
  });

  it("renders sire denied notification", () => {
    const result = renderTemplate("sire_denied", "en", {
      horse_name: "Foal",
      sire_name: "Stallion",
    });
    expect(result.body).toContain("denied the use of Stallion");
  });
});

describe("Notification Templates — getAvailableTypes", () => {
  it("returns all notification types", () => {
    const types = getAvailableTypes();
    expect(types.length).toBeGreaterThanOrEqual(9);
    expect(types).toContain("application_submitted");
    expect(types).toContain("payment_received");
    expect(types).toContain("sire_approval_request");
    expect(types).toContain("application_approved");
    expect(types).toContain("application_rejected");
  });
});
