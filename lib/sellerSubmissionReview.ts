/**
 * Buyer-facing values which a seller can change after a listing is live.
 *
 * Keep this list shared by the seller submission route and the Admin queues.
 * A submitted form on its own is not enough to create an Admin task: for a
 * live listing, at least one of these values must actually be different.
 */
export const SELLER_SUBMISSION_BUYER_FACING_FIELDS = [
  "display_name",
  "price_amount",
  "is_negotiable",
  "year",
  "brand_name",
  "model_name",
  "trim_name",
  "colour",
  "engine_size",
  "plate_series",
  "mileage_value",
  "transmission_type",
  "fuel_type",
  "body_type",
  "location_label",
  "public_contact_name",
  "public_contact_phone",
] as const;

export type SellerSubmissionBuyerFacingField =
  (typeof SELLER_SUBMISSION_BUYER_FACING_FIELDS)[number];

export type SellerSubmissionComparable = Partial<
  Record<SellerSubmissionBuyerFacingField | "title", string | number | boolean | null>
>;

const NUMBER_FIELDS = new Set<SellerSubmissionBuyerFacingField>([
  "price_amount",
  "year",
  "mileage_value",
]);

function normalizedValue(
  value: SellerSubmissionComparable[SellerSubmissionBuyerFacingField] | undefined,
  field: SellerSubmissionBuyerFacingField,
) {
  if (field === "is_negotiable") return value === true;
  if (NUMBER_FIELDS.has(field)) return typeof value === "number" ? value : null;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function hasSellerSubmissionBuyerFacingChanges(
  current: SellerSubmissionComparable,
  submission: SellerSubmissionComparable,
) {
  return SELLER_SUBMISSION_BUYER_FACING_FIELDS.some((field) => {
    const currentValue =
      field === "display_name" ? current.display_name ?? current.title : current[field];
    return normalizedValue(currentValue, field) !== normalizedValue(submission[field], field);
  });
}
