import { describe, it, expect } from "vitest";
import {
  parseCSVRow,
  normalizeSex,
  normalizeBreed,
  validateImportRow,
  findDuplicates,
} from "@/lib/legacy-import";

describe("Legacy Import — normalizeSex", () => {
  it("normalizes 'S' to stallion", () => {
    expect(normalizeSex("S")).toBe("stallion");
  });
  it("normalizes 'Male' to stallion", () => {
    expect(normalizeSex("Male")).toBe("stallion");
  });
  it("normalizes 'M' to mare", () => {
    expect(normalizeSex("M")).toBe("mare");
  });
  it("normalizes 'Female' to mare", () => {
    expect(normalizeSex("Female")).toBe("mare");
  });
  it("normalizes 'G' to gelding", () => {
    expect(normalizeSex("G")).toBe("gelding");
  });
  it("returns raw for unknown", () => {
    expect(normalizeSex("Unknown")).toBe("Unknown");
  });
});

describe("Legacy Import — normalizeBreed", () => {
  it("normalizes 'P.R.E.' to pre", () => {
    expect(normalizeBreed("P.R.E.")).toBe("pre");
  });
  it("normalizes 'Andalusian' to pre", () => {
    expect(normalizeBreed("Andalusian")).toBe("pre");
  });
  it("normalizes 'P.S.L.' to psl", () => {
    expect(normalizeBreed("P.S.L.")).toBe("psl");
  });
  it("normalizes 'Lusitano' to psl", () => {
    expect(normalizeBreed("Lusitano")).toBe("psl");
  });
  it("normalizes 'Half-Andalusian' to half_bred", () => {
    expect(normalizeBreed("Half-Andalusian")).toBe("half_bred");
  });
  it("returns raw for unknown", () => {
    expect(normalizeBreed("Thoroughbred")).toBe("Thoroughbred");
  });
});

describe("Legacy Import — parseCSVRow", () => {
  it("maps standard headers", () => {
    const headers = ["Name", "Sex", "Breed", "Color", "Microchip"];
    const values = [
      "Elegante",
      "Stallion",
      "P.R.E.",
      "Grey",
      "123456789012345",
    ];
    const row = parseCSVRow(headers, values);
    expect(row.name).toBe("Elegante");
    expect(row.sex).toBe("stallion");
    expect(row.breed).toBe("pre");
    expect(row.color).toBe("Grey");
    expect(row.microchip).toBe("123456789012345");
  });

  it("maps alternative header names", () => {
    const headers = ["Horse Name", "Gender", "Breed Type", "DOB", "Chip"];
    const values = [
      "Luna",
      "Female",
      "Lusitano",
      "2020-01-01",
      "987654321012345",
    ];
    const row = parseCSVRow(headers, values);
    expect(row.name).toBe("Luna");
    expect(row.sex).toBe("mare");
    expect(row.breed).toBe("psl");
    expect(row.date_of_birth).toBe("2020-01-01");
    expect(row.microchip).toBe("987654321012345");
  });

  it("handles missing values", () => {
    const headers = ["Name", "Sex"];
    const values = ["Test"];
    const row = parseCSVRow(headers, values);
    expect(row.name).toBe("Test");
  });
});

describe("Legacy Import — validateImportRow", () => {
  it("accepts valid row", () => {
    const errors = validateImportRow(
      { name: "Elegante III", sex: "stallion", breed: "pre" },
      1,
    );
    expect(errors).toHaveLength(0);
  });

  it("rejects empty name", () => {
    const errors = validateImportRow({ name: "" }, 1);
    expect(errors.find((e) => e.field === "name")).toBeDefined();
  });

  it("rejects short name", () => {
    const errors = validateImportRow({ name: "A" }, 1);
    expect(errors.find((e) => e.field === "name")).toBeDefined();
  });

  it("rejects invalid sex after normalization", () => {
    const errors = validateImportRow({ name: "Test", sex: "Unknown" }, 1);
    expect(errors.find((e) => e.field === "sex")).toBeDefined();
  });

  it("rejects invalid microchip", () => {
    const errors = validateImportRow({ name: "Test", microchip: "1234" }, 1);
    expect(errors.find((e) => e.field === "microchip")).toBeDefined();
  });

  it("rejects invalid date", () => {
    const errors = validateImportRow(
      { name: "Test", date_of_birth: "not-a-date" },
      1,
    );
    expect(errors.find((e) => e.field === "date_of_birth")).toBeDefined();
  });

  it("includes row number in error", () => {
    const errors = validateImportRow({ name: "" }, 42);
    expect(errors[0].row).toBe(42);
  });
});

describe("Legacy Import — findDuplicates", () => {
  it("detects duplicate names", () => {
    const rows = [{ name: "Elegante III" }];
    const existing = new Set(["elegante iii"]);
    const dupes = findDuplicates(rows, existing, new Set());
    expect(dupes).toContain("Duplicate name: Elegante III");
  });

  it("detects duplicate microchips", () => {
    const rows = [{ name: "New Horse", microchip: "123456789012345" }];
    const dupes = findDuplicates(rows, new Set(), new Set(["123456789012345"]));
    expect(dupes).toContain("Duplicate microchip: 123456789012345");
  });

  it("returns empty when no duplicates", () => {
    const rows = [{ name: "Unique Horse" }];
    const dupes = findDuplicates(rows, new Set(), new Set());
    expect(dupes).toHaveLength(0);
  });
});
