import { describe, it, expect } from "vitest";
import {
  buildPedigreeTree,
  countAncestors,
  getGenerationDepth,
  flattenPedigree,
  detectInbreeding,
  type FlatHorse,
} from "@/lib/pedigree";

const horses: FlatHorse[] = [
  {
    id: "h1",
    name: "Foal",
    registration_number: "R001",
    sex: "stallion",
    breed_type: "pre",
    sire_id: "h2",
    dam_id: "h3",
  },
  {
    id: "h2",
    name: "Sire",
    registration_number: "R002",
    sex: "stallion",
    breed_type: "pre",
    sire_id: "h4",
    dam_id: "h5",
  },
  {
    id: "h3",
    name: "Dam",
    registration_number: "R003",
    sex: "mare",
    breed_type: "pre",
    sire_id: "h4",
    dam_id: null,
  },
  {
    id: "h4",
    name: "Grandsire",
    registration_number: "R004",
    sex: "stallion",
    breed_type: "pre",
    sire_id: null,
    dam_id: null,
  },
  {
    id: "h5",
    name: "Granddam",
    registration_number: "R005",
    sex: "mare",
    breed_type: "pre",
    sire_id: null,
    dam_id: null,
  },
];

describe("Pedigree — buildPedigreeTree", () => {
  it("builds tree from root", () => {
    const tree = buildPedigreeTree(horses, "h1");
    expect(tree).not.toBeNull();
    expect(tree?.name).toBe("Foal");
    expect(tree?.sire?.name).toBe("Sire");
    expect(tree?.dam?.name).toBe("Dam");
  });

  it("builds to specified depth", () => {
    const tree = buildPedigreeTree(horses, "h1", 1);
    expect(tree?.sire?.name).toBe("Sire");
    expect(tree?.sire?.sire).toBeNull();
  });

  it("returns null for unknown root", () => {
    const tree = buildPedigreeTree(horses, "unknown");
    expect(tree).toBeNull();
  });

  it("handles missing parent gracefully", () => {
    const tree = buildPedigreeTree(horses, "h3");
    expect(tree?.sire?.name).toBe("Grandsire");
    expect(tree?.dam).toBeNull();
  });
});

describe("Pedigree — countAncestors", () => {
  it("counts all nodes in tree (includes shared ancestors)", () => {
    const tree = buildPedigreeTree(horses, "h1");
    const count = countAncestors(tree);
    expect(count).toBe(6);
  });

  it("returns 0 for null tree", () => {
    expect(countAncestors(null)).toBe(0);
  });
});

describe("Pedigree — getGenerationDepth", () => {
  it("returns correct depth", () => {
    const tree = buildPedigreeTree(horses, "h1");
    expect(getGenerationDepth(tree)).toBe(3);
  });

  it("returns 0 for null", () => {
    expect(getGenerationDepth(null)).toBe(0);
  });

  it("returns 1 for leaf node", () => {
    const tree = buildPedigreeTree(horses, "h4");
    expect(getGenerationDepth(tree)).toBe(1);
  });
});

describe("Pedigree — flattenPedigree", () => {
  it("flattens tree to array (includes duplicates from shared ancestors)", () => {
    const tree = buildPedigreeTree(horses, "h1");
    const flat = flattenPedigree(tree);
    expect(flat.length).toBe(6);
    expect(flat.map((n) => n.name)).toContain("Foal");
    expect(flat.map((n) => n.name)).toContain("Grandsire");
  });

  it("returns empty for null", () => {
    expect(flattenPedigree(null)).toHaveLength(0);
  });
});

describe("Pedigree — detectInbreeding", () => {
  it("detects shared ancestor (Grandsire appears twice)", () => {
    const tree = buildPedigreeTree(horses, "h1");
    const duplicates = detectInbreeding(tree);
    expect(duplicates).toContain("Grandsire");
  });

  it("returns empty for no inbreeding", () => {
    const simple: FlatHorse[] = [
      {
        id: "a",
        name: "A",
        registration_number: null,
        sex: "stallion",
        breed_type: "pre",
        sire_id: "b",
        dam_id: "c",
      },
      {
        id: "b",
        name: "B",
        registration_number: null,
        sex: "stallion",
        breed_type: "pre",
        sire_id: null,
        dam_id: null,
      },
      {
        id: "c",
        name: "C",
        registration_number: null,
        sex: "mare",
        breed_type: "pre",
        sire_id: null,
        dam_id: null,
      },
    ];
    const tree = buildPedigreeTree(simple, "a");
    expect(detectInbreeding(tree)).toHaveLength(0);
  });
});
