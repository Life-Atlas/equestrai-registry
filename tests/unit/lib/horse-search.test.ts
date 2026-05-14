import { describe, it, expect } from "vitest";
import { buildSearchQuery, matchesSearch } from "@/lib/horse-search";

describe("Horse Search — buildSearchQuery", () => {
  it("returns null text search when no query", () => {
    const result = buildSearchQuery({});
    expect(result.textSearch).toBeNull();
    expect(Object.keys(result.columnFilters)).toHaveLength(0);
  });

  it("extracts text search from query", () => {
    const result = buildSearchQuery({ query: "Elegante" });
    expect(result.textSearch).toBe("Elegante");
  });

  it("trims whitespace from query", () => {
    const result = buildSearchQuery({ query: "  Elegante  " });
    expect(result.textSearch).toBe("Elegante");
  });

  it("returns null for empty/whitespace query", () => {
    const result = buildSearchQuery({ query: "   " });
    expect(result.textSearch).toBeNull();
  });

  it("includes breed_type filter", () => {
    const result = buildSearchQuery({ breed_type: "pre" });
    expect(result.columnFilters.breed_type).toBe("pre");
  });

  it("includes sex filter", () => {
    const result = buildSearchQuery({ sex: "mare" });
    expect(result.columnFilters.sex).toBe("mare");
  });

  it("includes status filter", () => {
    const result = buildSearchQuery({ status: "registered" });
    expect(result.columnFilters.status).toBe("registered");
  });

  it("combines multiple filters", () => {
    const result = buildSearchQuery({
      query: "Luna",
      breed_type: "psl",
      sex: "mare",
    });
    expect(result.textSearch).toBe("Luna");
    expect(result.columnFilters.breed_type).toBe("psl");
    expect(result.columnFilters.sex).toBe("mare");
  });
});

describe("Horse Search — matchesSearch", () => {
  const horse = {
    id: "1",
    name: "Elegante III",
    registration_number: "IALHA-2026-00001",
    sex: "stallion",
    breed_type: "pre",
    color: "Grey",
    status: "registered",
  };

  it("matches by name", () => {
    expect(matchesSearch(horse, "elegante")).toBe(true);
  });

  it("matches by registration number", () => {
    expect(matchesSearch(horse, "IALHA")).toBe(true);
  });

  it("matches by color", () => {
    expect(matchesSearch(horse, "grey")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(matchesSearch(horse, "ELEGANTE")).toBe(true);
  });

  it("returns false for non-match", () => {
    expect(matchesSearch(horse, "Luna")).toBe(false);
  });

  it("handles null registration number", () => {
    const noReg = { ...horse, registration_number: null };
    expect(matchesSearch(noReg, "IALHA")).toBe(false);
  });
});
