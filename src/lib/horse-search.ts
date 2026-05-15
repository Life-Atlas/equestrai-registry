export interface SearchFilters {
  query?: string;
  breed_type?: string;
  sex?: string;
  status?: string;
  color?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  registration_number: string | null;
  sex: string;
  breed_type: string;
  color: string | null;
  status: string;
}

export function buildSearchQuery(filters: SearchFilters): {
  textSearch: string | null;
  columnFilters: Record<string, string>;
} {
  const columnFilters: Record<string, string> = {};

  if (filters.breed_type) {
    columnFilters.breed_type = filters.breed_type;
  }
  if (filters.sex) {
    columnFilters.sex = filters.sex;
  }
  if (filters.status) {
    columnFilters.status = filters.status;
  }
  if (filters.color) {
    columnFilters.color = filters.color;
  }

  const textSearch = filters.query?.trim() || null;

  return { textSearch, columnFilters };
}

export function matchesSearch(horse: SearchResult, query: string): boolean {
  const q = query.toLowerCase();
  return (
    horse.name.toLowerCase().includes(q) ||
    (horse.registration_number?.toLowerCase().includes(q) ?? false) ||
    (horse.color?.toLowerCase().includes(q) ?? false)
  );
}
