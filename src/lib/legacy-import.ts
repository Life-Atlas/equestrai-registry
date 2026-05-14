export interface LegacyHorseRow {
  name: string;
  registration_number?: string;
  sex?: string;
  breed?: string;
  color?: string;
  date_of_birth?: string;
  microchip?: string;
  sire_name?: string;
  dam_name?: string;
  owner_name?: string;
  owner_email?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
  duplicates: string[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export function parseCSVRow(
  headers: string[],
  values: string[],
): LegacyHorseRow {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    row[h.toLowerCase().trim().replace(/\s+/g, "_")] = values[i]?.trim() ?? "";
  });

  return {
    name: row.name || row.horse_name || "",
    registration_number:
      row.registration_number || row.reg_number || row.reg_no || undefined,
    sex: normalizeSex(row.sex || row.gender || ""),
    breed: normalizeBreed(row.breed || row.breed_type || ""),
    color: row.color || undefined,
    date_of_birth: row.date_of_birth || row.dob || row.birth_date || undefined,
    microchip: row.microchip || row.microchip_number || row.chip || undefined,
    sire_name: row.sire_name || row.sire || undefined,
    dam_name: row.dam_name || row.dam || undefined,
    owner_name: row.owner_name || row.owner || undefined,
    owner_email: row.owner_email || row.email || undefined,
  };
}

export function normalizeSex(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === "s" || lower === "stallion" || lower === "male")
    return "stallion";
  if (lower === "m" || lower === "mare" || lower === "female") return "mare";
  if (lower === "g" || lower === "gelding") return "gelding";
  return raw;
}

export function normalizeBreed(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (
    lower === "pre" ||
    lower === "p.r.e." ||
    lower === "andalusian" ||
    lower === "pura raza española"
  )
    return "pre";
  if (
    lower === "psl" ||
    lower === "p.s.l." ||
    lower === "lusitano" ||
    lower === "puro sangue lusitano"
  )
    return "psl";
  if (
    lower === "half" ||
    lower === "half-bred" ||
    lower === "half bred" ||
    lower === "half-andalusian"
  )
    return "half_bred";
  return raw;
}

export function validateImportRow(
  row: LegacyHorseRow,
  rowIndex: number,
): ImportError[] {
  const errors: ImportError[] = [];

  if (!row.name || row.name.length < 2) {
    errors.push({
      row: rowIndex,
      field: "name",
      message: "Name is required (min 2 chars)",
    });
  }

  if (row.sex && !["stallion", "mare", "gelding"].includes(row.sex)) {
    errors.push({
      row: rowIndex,
      field: "sex",
      message: `Invalid sex: ${row.sex}`,
    });
  }

  if (row.microchip && !/^\d{15}$/.test(row.microchip)) {
    errors.push({
      row: rowIndex,
      field: "microchip",
      message: "Microchip must be 15 digits",
    });
  }

  if (row.date_of_birth) {
    const dob = new Date(row.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.push({
        row: rowIndex,
        field: "date_of_birth",
        message: "Invalid date format",
      });
    }
  }

  return errors;
}

export function findDuplicates(
  rows: LegacyHorseRow[],
  existingNames: Set<string>,
  existingMicrochips: Set<string>,
): string[] {
  const duplicates: string[] = [];

  for (const row of rows) {
    if (existingNames.has(row.name.toLowerCase())) {
      duplicates.push(`Duplicate name: ${row.name}`);
    }
    if (row.microchip && existingMicrochips.has(row.microchip)) {
      duplicates.push(`Duplicate microchip: ${row.microchip}`);
    }
  }

  return duplicates;
}
