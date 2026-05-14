export interface PedigreeNode {
  id: string;
  name: string;
  registrationNumber: string | null;
  sex: string | null;
  breedType: string | null;
  sire: PedigreeNode | null;
  dam: PedigreeNode | null;
}

export interface FlatHorse {
  id: string;
  name: string;
  registration_number: string | null;
  sex: string | null;
  breed_type: string | null;
  sire_id: string | null;
  dam_id: string | null;
}

export function buildPedigreeTree(
  horses: FlatHorse[],
  rootId: string,
  maxDepth: number = 3,
): PedigreeNode | null {
  const index = new Map<string, FlatHorse>();
  for (const h of horses) {
    index.set(h.id, h);
  }

  function build(id: string | null, depth: number): PedigreeNode | null {
    if (!id || depth > maxDepth) return null;
    const horse = index.get(id);
    if (!horse) return null;

    return {
      id: horse.id,
      name: horse.name,
      registrationNumber: horse.registration_number,
      sex: horse.sex,
      breedType: horse.breed_type,
      sire: build(horse.sire_id, depth + 1),
      dam: build(horse.dam_id, depth + 1),
    };
  }

  return build(rootId, 0);
}

export function countAncestors(node: PedigreeNode | null): number {
  if (!node) return 0;
  return 1 + countAncestors(node.sire) + countAncestors(node.dam);
}

export function getGenerationDepth(node: PedigreeNode | null): number {
  if (!node) return 0;
  return (
    1 + Math.max(getGenerationDepth(node.sire), getGenerationDepth(node.dam))
  );
}

export function flattenPedigree(node: PedigreeNode | null): PedigreeNode[] {
  if (!node) return [];
  return [node, ...flattenPedigree(node.sire), ...flattenPedigree(node.dam)];
}

export function detectInbreeding(node: PedigreeNode | null): string[] {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  function walk(n: PedigreeNode | null): void {
    if (!n) return;
    const count = (seen.get(n.id) ?? 0) + 1;
    seen.set(n.id, count);
    if (count === 2) {
      duplicates.push(n.name);
    }
    walk(n.sire);
    walk(n.dam);
  }

  walk(node);
  return duplicates;
}
