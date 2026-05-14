export interface CertificateData {
  registrationNumber: string;
  horseName: string;
  sex: string;
  breedType: string;
  color: string | null;
  dateOfBirth: string | null;
  microchipNumber: string | null;
  sireName: string | null;
  damName: string | null;
  ownerName: string;
  tenantName: string;
  issuedDate: string;
}

export interface CertificateContent {
  title: string;
  lines: { label: string; value: string }[];
  footer: string;
}

export function generateCertificateContent(
  data: CertificateData,
  type: "registration" | "transfer" = "registration",
): CertificateContent {
  const title =
    type === "registration"
      ? `Certificate of Registration`
      : `Certificate of Transfer`;

  const lines: { label: string; value: string }[] = [
    { label: "Registration Number", value: data.registrationNumber },
    { label: "Horse Name", value: data.horseName },
    { label: "Sex", value: data.sex },
    { label: "Breed", value: data.breedType },
  ];

  if (data.color) {
    lines.push({ label: "Color", value: data.color });
  }
  if (data.dateOfBirth) {
    lines.push({ label: "Date of Birth", value: data.dateOfBirth });
  }
  if (data.microchipNumber) {
    lines.push({ label: "Microchip", value: data.microchipNumber });
  }
  if (data.sireName) {
    lines.push({ label: "Sire", value: data.sireName });
  }
  if (data.damName) {
    lines.push({ label: "Dam", value: data.damName });
  }

  lines.push({ label: "Owner", value: data.ownerName });

  const footer = `Issued by ${data.tenantName} on ${data.issuedDate}`;

  return { title, lines, footer };
}

export function validateCertificateData(
  data: Partial<CertificateData>,
): string[] {
  const errors: string[] = [];

  if (!data.registrationNumber) errors.push("Registration number required");
  if (!data.horseName) errors.push("Horse name required");
  if (!data.sex) errors.push("Sex required");
  if (!data.breedType) errors.push("Breed type required");
  if (!data.ownerName) errors.push("Owner name required");
  if (!data.tenantName) errors.push("Tenant name required");
  if (!data.issuedDate) errors.push("Issued date required");

  return errors;
}
