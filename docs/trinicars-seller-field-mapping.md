# TriniCars Seller Form — Rev Matched Field Mapping

**Status:** read-only mapping for review. No database migration, ingestion change, interface change, or record update was made from this document.

**Date:** 31 July 2026
**Related:** [TriniCars-to-Rev-Matched Field Audit](./trinicars-revmatched-field-audit.md), [Seller Account and Photo Approval — First-Build Plan](./seller-account-and-photo-approval-plan.md), [Ingestion and Admin Process](./ingestion-and-admin-process.md).

## Why this mapping exists

The TriniCars seller form has useful vehicle detail that should be reviewed and corrected by the seller, without mixing it into the original source record.

Rev Matched therefore has two intentionally separate layers:

- **Imported source record** — what was collected from TriniCars. It remains available to Admin for comparison and audit.
- **Seller-confirmed submission** — what the seller has reviewed or corrected. This is the first-party information used to prepare the Rev Matched listing.

This keeps source facts traceable while preventing a seller correction from overwriting the original imported evidence.

## Current storage roles

| Storage area | Purpose |
| --- | --- |
| `raw_listings` | Original source text and payload, including unprocessed source details. Admin-only. |
| `normalized_listings` | Clean core vehicle record and workflow state: title, make, model, year, price, mileage, transmission, fuel, availability, and workflow status. |
| `seller_listing_submissions` | Seller-reviewed vehicle information and buyer-ready supplementary details. One submission is linked to each normalized listing. |
| `seller_accounts` | Seller identity: display name and sign-in phone number. One account can have multiple linked cars. |
| `seller_listing_media_assets` | Seller-uploaded photos, their approval state, and the selected/preferred main photo. |

Source-site contact details, source URLs, and imported source photos remain Admin-only. Buyers see seller-provided photos only after Admin approval and an explicit Go Live decision.

## Seller form mapping

| Information to capture | What exists now | Current safe location | Mapping decision / gap |
| --- | --- | --- | --- |
| Make | `normalized_listings.brand_name`; seller submission `brand_name` | Core normalized value plus seller review | Already supported. Keep the imported value for audit and let the seller correct the submitted value. |
| Model | `normalized_listings.model_name`; seller submission `model_name` | Core normalized value plus seller review | Already supported. |
| Year | `normalized_listings.year`; seller submission `year` | Core normalized value plus seller review | Already supported. |
| Asking price | `normalized_listings.price_amount`; seller submission `price_amount` | Core normalized value plus seller review | Already supported. The source’s original price remains in the raw layer. |
| Mileage | `normalized_listings.mileage_value`; seller submission `mileage_value` | Core normalized value plus seller review | Already supported. Source text is also retained for Admin comparison. |
| Transmission | `normalized_listings.transmission_type`; seller submission `transmission_type` | Core normalized value plus seller review | Already supported. |
| Colour | seller submission `colour` | Seller-confirmed supplementary detail | Already supported for seller capture. It is deliberately separate from the imported core listing for now. |
| Engine specification | seller submission `engine_size` | Seller-confirmed supplementary detail | Already supported as free text, e.g. `1600 cc Turbo`. Do not infer this from fuel type. |
| Fuel type | `normalized_listings.fuel_type`; seller submission `fuel_type` | Core normalized value plus seller review | Already supported, although it was not a separate visible field in the supplied TriniCars form screenshot. |
| Features | seller submission `features` JSON value | Seller-confirmed supplementary detail | Already supported. The seller experience exposes the known Features checklist. A future cleanup can define a controlled feature vocabulary if needed; no new table is required now. |
| Additional Info | seller submission `additional_info` | Seller-confirmed supplementary detail | Already supported as free text. The source adapter does not currently capture TriniCars Additional Info into `raw_description`; that is a separate ingestion improvement, not a seller-form schema need. |
| Seller name | `seller_accounts.display_name`; seller submission `public_contact_name` | Seller account identity and per-car public name | Already supported. The account identity is separate from the name the seller chooses to show for a particular car. |
| Seller phone number | `seller_accounts.phone_e164`; seller submission `public_contact_phone` | Sign-in identity and per-car public phone | Already supported. The sign-in phone remains account-level; the public number is confirmed per car. |
| Seller contact preferences | public name and phone fields on the seller submission | Seller-confirmed supplementary detail | Buyers must be shown the seller-confirmed public contact information for every Live car, so they can contact the seller directly. A distinct WhatsApp/call/email preference toggle is **not** yet a structured field. Do not add one until the exact buyer-contact choices are agreed. |
| Seller photos | `seller_listing_media_assets` with approval and main-photo fields | Separate seller media layer | Already supported. Seller uploads are private until approved; imported TriniCars images never become buyer media. |
| Preferred/main photo | `is_preferred_main`, with Admin approval/main-photo control | Seller media layer | Already supported. Admin can choose a main photo when none is selected and controls the final buyer-visible result. |

## Fields visible in TriniCars material that are not vehicle fields

| Item | Decision |
| --- | --- |
| TriniCars email / WhatsApp photo-delivery instructions | Do not store as Rev Matched seller data. They are source-site operating instructions, not data about a car or seller. |
| Source listing URL, listing ID, source contact name, source contact phone | Keep Admin-only in the raw/normalized source layers. Never show them to sellers or buyers. |
| Source photos | Keep Admin-only reference material. They are not seller media and must never be shown to buyers. |
| Photo orientation and full-vehicle guidance | Treat as seller-upload guidance/policy, not database fields. |
| Number-plate masking | This is a future Admin photo-moderation/redaction step. There is not yet a dedicated redaction-state field. |

## Broader listing fields worth deciding later

These were raised during earlier field discussions but were not shown as part of the supplied TriniCars seller form. They should only be added through a separate, additive migration once their exact meaning and buyer use are agreed.

| Possible field | Current state | Decision needed before adding it |
| --- | --- | --- |
| Registration plate / plate series | No structured listing field | Whether Rev Matched needs it at all, and whether it should ever be buyer-visible. |
| Negotiable price | No dedicated field | Whether it is a yes/no value, a free-text note, or both. |
| Trade accepted | No dedicated field | Whether it is a yes/no value and where it appears to buyers. |
| Transfer / financing wording | No dedicated field | Exact user-facing options and whether this is seller-confirmed or Admin-only. |
| Contact method choices (call, WhatsApp, email) | Only public name and phone are currently structured per car | Which methods sellers may publish and which must be required before Live. |
| Photo angle/category (front, rear, interior, engine) | Photos have order and main-photo state but no category | Whether category improves the buyer experience enough to justify extra seller effort. |
| Plate-redaction review state | Photos have approval status but no redaction state | Whether redaction is manual, automatic, or both, and what status Admin needs to see. |

## Safe implementation order

1. **Approve this mapping.** Confirm which of the optional fields are truly needed for the first live seller form.
2. **Run a read-only completeness report.** Check how often existing imported records already have each core field, without changing any data.
3. **Use an additive migration only for approved gaps.** Add nullable fields or a new related table; never replace or rename existing production fields in place.
4. **Backfill only when rules are clear.** Preserve original source data and mark any derived values as such.
5. **Build the seller/Admin form change after the migration passes locally.** Test it with existing listings before any remote deployment.

## Current conclusion

The first seller form does **not** need a database redesign for its main TriniCars vehicle-information fields. Make, model, year, price, mileage, transmission, colour, engine specification, Features, Additional Info, seller identity/public phone, and seller photos already have an appropriate home.

The next safe database decision is therefore not “add every TriniCars field.” It is to choose which of the optional gaps above are necessary for the first buyer-ready seller listing, then add only those fields with a small additive migration.
