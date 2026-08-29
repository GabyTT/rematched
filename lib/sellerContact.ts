export function phoneLink(phoneNumber: string) {
  return `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
}

/**
 * Converts a Trinidad & Tobago local/NANP number to the digits WhatsApp expects.
 * Returns null for values that cannot be identified as a TT phone number.
 */
export function normalizeTrinidadWhatsAppNumber(phoneNumber: string) {
  let digits = phoneNumber.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.length === 7) {
    digits = `1868${digits}`;
  } else if (digits.length === 10 && digits.startsWith("868")) {
    digits = `1${digits}`;
  }

  return /^1868\d{7}$/.test(digits) ? digits : null;
}

export function sellerWhatsAppLink(input: {
  phoneNumber: string;
  vehicle: { year: number; make: string; model: string };
}) {
  const phoneNumber = normalizeTrinidadWhatsAppNumber(input.phoneNumber);

  if (!phoneNumber) {
    return null;
  }

  const message = `Hi, I'm interested in your ${input.vehicle.year} ${input.vehicle.make} ${input.vehicle.model} I saw on Rev Matched.`;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
