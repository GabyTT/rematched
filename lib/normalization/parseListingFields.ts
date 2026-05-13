function normalizeText(value: string | null) {
  return value?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

export function parsePriceText(value: string | null) {
  const normalizedValue = normalizeText(value);

  if (
    !normalizedValue ||
    normalizedValue.includes("inbox") ||
    normalizedValue.includes("message for price")
  ) {
    return null;
  }

  const thousandsMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*k\b/);

  if (thousandsMatch) {
    return Math.round(Number(thousandsMatch[1]) * 1000);
  }

  const digits = normalizedValue.replace(/[^\d]/g, "");

  return digits ? Number(digits) : null;
}

export function parseMileageText(value: string | null) {
  const normalizedValue = normalizeText(value);

  if (
    !normalizedValue ||
    normalizedValue.includes("unknown") ||
    normalizedValue.includes("not listed")
  ) {
    return null;
  }

  const digits = normalizedValue.replace(/[^\d]/g, "");

  return digits ? Number(digits) : null;
}

export function parseYearFromText(value: string | null) {
  const year = value?.match(/\b(19|20)\d{2}\b/)?.[0];

  return year ? Number(year) : null;
}

export function parseContactMethod(value: string | null) {
  const normalizedValue = normalizeText(value);

  if (
    normalizedValue.includes("whatsapp") ||
    normalizedValue.includes("w/app") ||
    normalizedValue.includes("wapp")
  ) {
    return "whatsapp";
  }

  if (normalizedValue.includes("phone") || /\d{3}/.test(normalizedValue)) {
    return "phone";
  }

  return null;
}

export function parseImportStatus(value: string | null) {
  const normalizedValue = normalizeText(value);

  if (normalizedValue.includes("roro")) {
    return "roro";
  }

  if (
    normalizedValue.includes("foreign used") ||
    normalizedValue.includes("fresh import")
  ) {
    return "foreign_used";
  }

  if (
    normalizedValue.includes("local") ||
    normalizedValue.includes("one owner") ||
    normalizedValue.includes("owner") ||
    normalizedValue.includes("buy and drive")
  ) {
    return "local_used";
  }

  return null;
}

export function parseSellerType(value: string | null) {
  const normalizedValue = normalizeText(value);

  if (
    normalizedValue.includes("dealer") ||
    normalizedValue.includes("imports")
  ) {
    return "dealer";
  }

  if (
    normalizedValue.includes("private") ||
    normalizedValue.includes("owner") ||
    normalizedValue.includes("sale")
  ) {
    return "private";
  }

  return null;
}
