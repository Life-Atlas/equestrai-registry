import { describe, it, expect } from "vitest";
import {
  generateCertificateContent,
  validateCertificateData,
  type CertificateData,
} from "@/lib/certificate";

const validCert: CertificateData = {
  registrationNumber: "IALHA-2026-00001",
  horseName: "Elegante III",
  sex: "Stallion",
  breedType: "P.R.E.",
  color: "Grey",
  dateOfBirth: "2023-04-15",
  microchipNumber: "123456789012345",
  sireName: "Granero",
  damName: "Estrella",
  ownerName: "John Smith",
  tenantName: "IALHA",
  issuedDate: "2026-05-14",
};

describe("Certificate — generateCertificateContent", () => {
  it("generates registration certificate", () => {
    const cert = generateCertificateContent(validCert);
    expect(cert.title).toBe("Certificate of Registration");
    expect(
      cert.lines.find((l) => l.label === "Registration Number")?.value,
    ).toBe("IALHA-2026-00001");
    expect(cert.lines.find((l) => l.label === "Horse Name")?.value).toBe(
      "Elegante III",
    );
    expect(cert.footer).toContain("IALHA");
    expect(cert.footer).toContain("2026-05-14");
  });

  it("generates transfer certificate", () => {
    const cert = generateCertificateContent(validCert, "transfer");
    expect(cert.title).toBe("Certificate of Transfer");
  });

  it("includes sire and dam", () => {
    const cert = generateCertificateContent(validCert);
    expect(cert.lines.find((l) => l.label === "Sire")?.value).toBe("Granero");
    expect(cert.lines.find((l) => l.label === "Dam")?.value).toBe("Estrella");
  });

  it("omits null optional fields", () => {
    const cert = generateCertificateContent({
      ...validCert,
      color: null,
      sireName: null,
      damName: null,
    });
    expect(cert.lines.find((l) => l.label === "Color")).toBeUndefined();
    expect(cert.lines.find((l) => l.label === "Sire")).toBeUndefined();
    expect(cert.lines.find((l) => l.label === "Dam")).toBeUndefined();
  });

  it("always includes owner", () => {
    const cert = generateCertificateContent(validCert);
    expect(cert.lines.find((l) => l.label === "Owner")?.value).toBe(
      "John Smith",
    );
  });
});

describe("Certificate — validateCertificateData", () => {
  it("passes for complete data", () => {
    const errors = validateCertificateData(validCert);
    expect(errors).toHaveLength(0);
  });

  it("requires registration number", () => {
    const errors = validateCertificateData({
      ...validCert,
      registrationNumber: undefined,
    });
    expect(errors).toContain("Registration number required");
  });

  it("requires horse name", () => {
    const errors = validateCertificateData({
      ...validCert,
      horseName: undefined,
    });
    expect(errors).toContain("Horse name required");
  });

  it("requires owner name", () => {
    const errors = validateCertificateData({
      ...validCert,
      ownerName: undefined,
    });
    expect(errors).toContain("Owner name required");
  });

  it("collects multiple errors", () => {
    const errors = validateCertificateData({});
    expect(errors.length).toBeGreaterThanOrEqual(7);
  });
});
