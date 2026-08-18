# TriniCars-to-Rev-Matched Field Audit

**Date:** 29 July 2026  
**Scope:** read-only discovery and comparison. No migration, database row, generated type, ingestion routine, screen, or buyer behaviour was changed.

## Evidence reviewed

### Supplied TriniCars screenshots

1. **Seller vehicle-information form** — vehicle fields, a 45-option feature checklist, and Additional Info.
2. **Published listing** — Make, Model, Year, Colour, Engine Size, Mileage, Transmission, and Features. The supplied crop shows a 2023 Hyundai Tucson example.
3. **Photo Information** — email/WhatsApp delivery options, horizontal/full-vehicle guidance, number-plate masking statement, and an illustrated photo set.

### Rev Matched sources of truth inspected

- `supabase/migrations/20260505000100_create_raw_ingestion_foundation.sql`
- `supabase/migrations/20260505000200_create_normalized_inventory_foundation.sql`
- Later migrations for source timestamps, workflow, follow-ups, run audit information, and source-presence review.
- Live local Postgres schema in `supabase_db_rev-matched` (read-only queries only).
- Generated types: `lib/database.types.ts`.
- TriniCars adapter and persistence/normalisation code:
  - `lib/ingestion/triniCarsForSaleAdapter.ts`
  - `lib/ingestion/sourceAdapter.ts`
  - `lib/ingestion/persistRawIngestion.ts`
  - `lib/normalization/normalizeRawListing.ts`
  - `lib/normalization/normalizeSourceInventory.ts`
- Buyer mapping/query code:
  - `lib/normalizedListings.ts`
  - `lib/buyerInventory.ts`
  - `lib/normalizedListingCarAdapter.ts`
  - `lib/matching.ts`
- Admin query code: `lib/adminDatabase.ts`.

## Important reading rule

The report distinguishes three things:

- **Original source value** — verbatim source text or JSON retained for audit.
- **Normalised value** — a typed value suitable for matching, filters, and workflow.
- **Formatted display value** — text constructed at display time, such as `TT$130,000` or `61,000 km`.

The same field should not be stored more than once merely to create a formatted display string.

---

# Output A — Current-schema inventory

| Table | Role | Important current fields | Authority / limitation |
|---|---|---|---|
| `listing_sources` | One source definition per marketplace/feed. | Source name/type/base URL; ingestion enablement/mode/scheduled time. | Authoritative source configuration. |
| `ingestion_runs` | One operational import run. | Start/finish/status; fetched/normalised/error counts; manual test/full metadata; selected source date and IDs. | Run audit, not listing content. `listings_normalized` currently can include refreshes beyond the current run. |
| `raw_listings` | Latest retained source record before normalisation. | Source ID/URL; raw title, description, price, location, contact, seller label, mileage, fuel, transmission, trim; JSONB `raw_payload`; fetch/post/refresh timestamps. | Authoritative current raw-source layer. It is updated in place on re-import, so it is not a historical snapshot archive. |
| `raw_listing_images` | Source image references linked to a raw record. | `image_url`, `display_order`, source attribution flag, preview permission. | Can model several source URLs and order. Existing persistence deletes and recreates image rows on refresh. |
| `normalized_listings` | Clean listing record used by the buyer/admin processes. | Source IDs, title/display name, numeric price/year/mileage, make/model/trim, fuel/transmission/body/location, review/visibility/recommendation/workflow state, confidence. | Authoritative normalised listing and workflow record. It intentionally does not store all source detail. |
| `normalized_listing_images` | Presentation image references linked to a normalised listing. | URL, order, primary flag, link back to raw image, preview/attribution flags. | Supports multiple URLs and a primary image, but has no seller-image provenance/approval model. Normalisation currently deletes and recreates these rows. |
| `listing_workflow_events` | Admin seller-contact/follow-up history. | Contact method/outcome, notes, occurred/follow-up/expected-pics times. | Workflow audit only; it is not a seller/contact entity. |
| `profiles` | Signed-in Rev Matched users. | Display name, phone, WhatsApp enabled, role. | Not appropriate for an unclaimed TriniCars seller; it represents an app user. |
| `preference_profiles`, `preference_profile_brands` | Buyer preferences. | Budget, vehicle type, model query, selected brands. | Buyer matching inputs, not source listing fields. |

There is **no separate source-seller/contact table** and no first-party seller-image/upload table today.

---

# Output B — Full TriniCars-to-Rev-Matched comparison matrix

## Seller form and published-listing fields

The published-listing screenshot repeats the same seven vehicle fields as the seller form. They are represented once below, with the source surface noted in the first column.

| TriniCars label / surface | Conceptual meaning | Group | Example | Entered/generated | Required? | Current Rev Matched table/column | Type / nullable | Mapping status | Buyer use | Admin use | Ingestion handling | Risk / limitation | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Make of Car** / published **Make** | Vehicle make/brand | A Canonical vehicle | Hyundai | Seller-entered | Not shown | `normalized_listings.brand_name`; raw payload `make` | `text`, nullable | Equivalent field with different name | Search, matching, card title | Verify | Adapter parses `Make`; normaliser copies it | No controlled vocabulary; spelling variation remains possible | Keep `brand_name`; retain raw `make`; later introduce normalisation rules, not a duplicate make field. |
| **Model of Car** / published **Model** | Vehicle model | A | Tucson | Seller-entered | Not shown | `normalized_listings.model_name`; raw payload `model` | `text`, nullable | Equivalent field with different name | Search, matching, card title | Verify | Adapter parses `Model`; normaliser copies it | Trim/model ambiguity | Keep; do not duplicate. |
| **Year of Manufacture** / published **Year** | Model/manufacture year | A | 2023 | Seller-entered | Not shown | `normalized_listings.year`; raw payload `year` | `integer`, nullable; checked 1900 through next calendar year | Exact match | Matching, card/detail display | Verify | Parsed as number from source text/title | Source text is not separately preserved in a named raw column, but exists in JSONB | Keep numeric normalised year and raw source value. |
| **Colour of Car** / published **Colour** | Exterior colour | A | Amazon Gray | Seller-entered | Not shown | Raw payload `colour` only | JSONB string; nullable by convention | Stored in raw source data only | None | Not shown for review today | Adapter parses it but normaliser discards it from the structured listing | Important buyer/admin detail; spelling variation is expected | Future additive canonical `colour` text plus retain raw value; normalise only if a product need emerges. |
| **Engine Size** / published **Engine Size** | Engine/displacement/engine description | A | 1600 cc Turbo | Seller-entered | Not shown | Raw payload `engine_size`; `normalized_listings.fuel_type` may be inferred | JSONB string; fuel is nullable `text` | Stored in raw source data only; partially derived into a different concept | Fuel only, when explicit | Could be checked via source panel only | Adapter parses engine text; extracts fuel only if words such as diesel/petrol/hybrid occur | `1600 cc Turbo` does not reliably identify fuel; no engine field is normalised | Future additive `engine_specification_text` if buyers/admin need it. Do not treat engine size as fuel. |
| **Mileage** / published **Mileage** | Odometer reading | A | 61,000 km | Seller-entered | Not shown | `raw_listings.raw_mileage_text` + `normalized_listings.mileage_value`; raw payload `mileage` | Raw `text`, numeric `integer`, both nullable | Split across multiple fields | Details/comparison | Verification/confidence | Parses digits to integer | Unit/qualifiers remain only in raw text; integer is sufficient for realistic mileage range | Current pattern is correct; preserve both raw and numeric forms. |
| **Transmission** / published **Transmission** | Gearbox/transmission description | A | Tiptronic | Seller-entered via selector | Not shown | `raw_listings.raw_transmission_text` + `normalized_listings.transmission_type`; raw payload `transmission` | `text`, nullable | Split across multiple fields | Details/comparison | Verification | Adapter parses source row; normaliser lowercases it | Values remain unstandardised (`Tiptronic`, CVT, automatic, etc.) | Keep raw and canonical text; a controlled enum is a later product decision. |
| **Features of Car** / published **Features** | Selected equipment/features | A | Air Condition, Bluetooth, etc. | Seller-entered checkbox set | Not shown | No dedicated raw or normalised feature field; adapter does not parse Features | N/A | Missing | None | Not currently reviewable | Omitted from `ParsedDetail`, `raw_payload`, and normalisation | A substantial part of TriniCars’ seller-entered information is lost at ingestion | Future: preserve raw feature labels first; later decide on a canonical feature join/array. Do not create display strings only. |
| **Additional Info (if any)** | Free-text seller description/condition/notes | B Marketplace listing | Blank in supplied form | Seller-entered | Explicitly optional | `raw_listings.raw_description` could hold it, but adapter supplies `null` | `text`, nullable | Present field but current ingestion handling is missing | None today | Would be useful in source review | Schema can hold unbounded text, but current adapter does not capture it | Important details are lost even though a suitable raw field exists | Future: map it to `raw_description`; decide separately whether an approved buyer-facing description is needed. |

## TriniCars checkbox catalogue

These are all options visibly offered under **Features of Car**. They are individual seller selections but one conceptual repeated field: `selected vehicle features`.

| Form options visible in the screenshot | Current mapping | Status |
|---|---|---|
| Air Condition; Power Windows; Power Locks; Power Mirrors; Power Steering; Anti-Locking Brakes; 4 Wheel Disc Brakes; 4 Wheel Drive; Airbags; Crystal Lights; Projector Lights; HiD Lights; LED Running Lights; Fog Lamps; Chrome Accessories | None | Missing |
| CD Player; CD Changer; MP3 Deck; USB Deck; DVD Deck / Screen; Bluetooth; Alloy Rims; Chrome Rims; Low Profile Tyres; Chrome Exhaust; Rear Spoiler; Body Kit; Side Steps; Duraliner; Tray Cover | None | Missing |
| Sunroof; Tint; Alarm; GPS Tracking; Keyless Entry; Intelligent Key; Remote Start; Push Button Start; Steering Controls; Reverse Sensors; Reverse Camera; Fabric Interior; Leather Interior; Wood Grain Finish; Mirror Indicators | None | Missing |

## Source-page fields currently parsed by the adapter, but not visible in the supplied published-listing crop

These are included because the live adapter has explicit source-label parsers for them. They are not claimed to be visible in the supplied screenshots.

| TriniCars label | Conceptual meaning | Group | Current Rev Matched table/column | Type / nullable | Mapping status | Buyer use | Admin-only use | Ingestion handling | Risk / limitation | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|
| **Asking Price** | Source asking price | B Marketplace | `raw_listings.raw_price_text` + `normalized_listings.price_amount`; raw payload `asking_price` | Raw `text`, numeric `integer`; nullable | Split across multiple fields | Price/filter/matching | Check source price | Parsed digits, including `k`; raw text retained | `Quick sale`/negotiation wording is not in numeric value; money has no currency-code field | Current raw + integer design is adequate for TTD test source. Keep raw text; format in UI. |
| **Date Added** | Source publication date | B/D | `raw_listings.source_posted_text` + `source_posted_at`; run also records selected `source_listing_date` | `text` + `timestamptz`; nullable | Split across multiple fields | None | Freshness, date-scoped imports | Adapter parses unambiguous dates | Ambiguous/invalid dates remain text-only; no normalised listing column | Keep source metadata admin-only; do not duplicate as buyer display data by default. |
| **Contact Name** | Public source contact name | C Seller/contact | `raw_listings.raw_seller_label`; raw payload `public_contact_name` | `text`, nullable | Equivalent field with different name | None | Admin review/contact | Adapter parses it | No separate identity or verification; current value is overwritten when raw row refreshes | Keep admin-only raw source contact until seller claims a listing. |
| **Contact Phone # / Contact Phone #'s** | One or more public source phone numbers | C | `raw_listings.raw_contact_text`; raw payload `public_contact_text` | `text`, nullable | Combined into one field | None | Admin contact | Adapter reads list summary Contact or detail phone field | Multiple numbers are preserved as text but cannot be individually queried/labelled | Keep raw admin-only; later add structured channel/number records only if seller workflow needs it. |
| **WhatsApp #** | Separate WhatsApp contact number | C | No specific field; potentially embedded in `raw_contact_text` | N/A | Missing as a separate concept | None | Admin contact | Current parser only detects WhatsApp wording for `contact_method`; it does not extract a WhatsApp number | Cannot distinguish call versus WhatsApp number | Future product decision: structured/admin-only channel fields, additive and nullable. |
| **Contact Email** | Seller email | C | No source-listing field | N/A | Missing | None | Possible later seller contact | Not parsed | Email cannot be preserved or used | Future only if visible/allowed and needed; keep admin-only. |
| **Source listing number** | Stable marketplace listing identifier | B/D | `raw_listings.source_listing_id`, `normalized_listings.source_listing_id`, `ingestion_runs.source_listing_ids` | `text` / JSONB array | Exact match | Source attribution/link target | Audit, de-duplication, source-presence check | Parsed from URL/list | Correctly supports source-specific IDs | Keep. |
| **Source URL** | Original public listing URL | B/D | `raw_listings.source_listing_url`, `normalized_listings.source_listing_url` | `text`, nullable | Exact match | Link back where buyer-visible | Admin source panel | Constructed from source ID | No URL-length constraint issue because Postgres `text` is unbounded | Keep. |
| **Page views** | Marketplace engagement counter | D Source metadata | No current field/parser | N/A | Missing / not visible in supplied screenshots | None | Potentially contextual only | Not captured | Cannot assess stability or usefulness from supplied evidence | Do not add until a real decision confirms it is stable and useful. |
| **Sold/unavailable report link** | Source-specific availability action | D | `availability_status`, `workflow_status`, `source_missing_at` are internal alternatives; no source action URL | `text` statuses/timestamps | Semantic meaning differs | None | Admin availability review | Listing may be flagged missing after later full run | No direct source-report action preserved | Keep source-specific unless an approved workflow requires a saved source action URL. |

## Photo-information fields and requirements

| TriniCars label/instruction | Conceptual meaning | Group | Current Rev Matched representation | Mapping status | Recommendation |
|---|---|---|---|---|---|
| **Email Us your Photos as ATTACHMENTS** + `cars@TriniCarsForSale.com` | TriniCars’ own photo-submission channel | E Images/media | None per listing | Not appropriate to store as seller listing data | Treat as source-operation guidance, not a seller contact field. |
| **WhatsApp your Photos** + `689-4695` / `683-4474` | TriniCars’ own photo-submission channel | E | None per listing | Not appropriate to store as seller listing data | Same: source-operation guidance only. |
| **Hold Camera / Phone Horizontally** | Desired photo orientation | E | None | Missing as a media requirement | If Rev Matched later accepts seller uploads, record this as upload guidance/policy, not as a listing field. |
| **Take Full View of the Vehicle** | Desired composition | E | None | Missing as a media requirement | Same approach: guidance/policy, not a vehicle attribute. |
| **We will Block all Number Plates** | Image privacy/moderation policy | E | No plate-redaction state | Missing | A future upload flow needs a deliberate moderation/redaction decision; do not imply Rev Matched currently masks plates. |
| Illustrated exterior/interior/cargo/engine photo set | Example coverage/angle set; the individual images are not labelled in the screenshot | E | Separate image tables with URL/order only | Present but semantic meaning differs | The tables can store URLs/order, but cannot record an angle/category or completeness of the requested set. |

---

# Capacity and constraint assessment

| Concern | Current capacity/behaviour | Assessment |
|---|---|---|
| Text fields | PostgreSQL `text` has no configured length limit in the relevant columns. | Long names, multiple phone numbers, email strings, descriptions, feature text, and URLs will fit where a matching column exists. |
| Price | `price_amount integer`, non-negative; original source price is `raw_price_text text`. | Integer is sufficient for normal TTD asking prices. It cannot preserve negotiation wording, but raw text does. No fractional-price requirement is evident. |
| Mileage | `mileage_value integer`, non-negative; raw text retained. | Safe for realistic odometer values and missing values. Unit/context remains in raw text. |
| Year | Integer with range 1900 through next calendar year. | Safe for source listings, subject to intentionally rejecting unusual historic/invalid values. |
| Engine size | No structured column; raw JSONB only. | The source text fits, but it is not queryable as a normalised field. |
| Colour | No structured column; raw JSONB only. | The source text fits, but it is not available for buyer/admin list/query use. |
| Transmission | Raw plus normalised `text`, nullable. | Storage capacity is safe; values are not canonicalised to a controlled set. |
| Features | No raw or normalised feature collection. | Not preserved by current TriniCars ingestion. |
| Additional Info | `raw_description text` exists. | Capacity is safe, but the current adapter sets it to `null`; information is lost at mapping time. |
| Multiple phones / WhatsApp | One `raw_contact_text` field. | Capacity is safe but semantic separation is not. Separate numbers/channels cannot be queried or confirmed. |
| Blank contact/email | Relevant raw fields are nullable. | Safe for missing data; no email field exists. |
| Duplicate listing identity | Unique partial index on source + source listing ID in raw and normalised layers. | Good protection for same-source same-ID duplicates. It does not identify a cross-source repost of the same physical car. |
| Image URLs | `text`, non-empty; order is non-negative integer. | URL capacity is safe. There is no uniqueness check on order or guarantee of a single primary image. |
| Source image refresh | Persistence deletes/recreates raw images; normalisation deletes/recreates normalised images. | Current latest image set is retained, not image history. Future seller-upload images would be at risk if placed in the normalised table without a provenance-safe change. |

---

# Image-model audit

| Requirement | Current result |
|---|---|
| Store multiple imported source URLs | **Schema yes**: both image tables support many rows per listing. |
| Preserve source order | **Schema yes**: `display_order`. **Current TriniCars adapter no**: it reads only the page `og:image`, so currently only one image is ingested. |
| Mark primary image | **Yes**: `normalized_listing_images.is_primary`; normaliser marks index 0. No database constraint prevents more than one primary. |
| Preserve a remote source URL | **Yes**: `raw_listing_images.image_url` and `normalized_listing_images.display_url`. |
| Store a copied/local image URL | **No distinct model**: a URL could be placed in `display_url`, but there is no storage key, origin, or local-copy flag. |
| Distinguish source image from seller-approved image | **No**. The raw-image foreign key and attribution flags identify a source relationship, but there is no image origin/approval/replacement state. |
| Record seller upload time | **Not reliably**. `created_at` is the database-row time, not a seller upload event or provenance record. |
| Record required photo angle/category | **No**. |
| Reject/retire an image independently | **No**. Only listing-level workflow/availability state exists. |
| Add image caption/notes | **No**. |
| Safe future seller upload path | **Not yet**. The normaliser’s delete-and-recreate step means a future first-party/seller image layer must be separate from source-derived normalised image refreshes, or otherwise explicitly protected. |

---

# Buyer-facing compatibility inventory

The current buyer inventory query reads `normalized_listings`, `listing_sources`, and `normalized_listing_images`, then maps them to the `Car` type.

| Buyer purpose | Current dependent fields |
|---|---|
| Card title | `display_name` (with `title` fallback) |
| Price and budget matching | `price_amount` → formatted `price` and numeric `priceValue` |
| Matching/filtering/search | `brand_name`, `model_name`, `body_type`, `price_amount`, `year`, plus mapped display name |
| Details/comparison | `year`, `mileage_value`, `fuel_type`, `transmission_type`, `location_label`, `body_type` |
| Images | `normalized_listing_images.display_url`, `display_order`, `is_primary`, `preview_allowed` |
| Source attribution | `listing_sources.source_name`, `source_listing_url` |
| Visibility/trust gate | `is_buyer_visible`, `review_status`, `recommendation_state`, `availability_status` |
| Likes and Top Picks | Client-side journey state keyed by `Car.id`; this audit found no source-listing schema dependency for those interactions. |

Any future schema work must therefore be **additive and nullable** at first. Do not rename/reuse `price_amount`, `brand_name`, `model_name`, image fields, visibility fields, or source identifiers.

---

# Raw-source preservation findings

## What exists now

- Every raw record has `raw_payload jsonb not null` and the source-specific raw columns.
- The current local data includes TriniCars keys for make, model, year, colour, engine size, mileage, transmission, asking price, date added, source URL/ID, admin-only contact information, and the one admin review image reference.
- Raw records remain after normalisation and are linked from `normalized_listings.raw_listing_id`.

## What it does not guarantee

- The TriniCars adapter currently fills only the fields it explicitly parses. It does **not** include Features or Additional Info in its payload.
- It receives only the first/`og:image` source image, not the full source photo set.
- Re-importing updates the same `raw_listings` row and replaces its raw images. Therefore this is a latest-source-record store, **not** an immutable historical archive of every source version.

Raw JSONB is a useful recovery safeguard for fields that are actually captured. It cannot recover source information that the adapter never reads.

---

# Output C — Gap and risk summary

## 1. Fully supported now

- Source listing ID and source URL.
- Make, model, year, mileage, transmission, asking price, source posting date (where parseable), source contact name/text, and one remote source image reference.
- Numeric price/mileage alongside raw source text.
- Source attribution, buyer visibility controls, workflow state, confidence, source missing/staleness review, and admin seller-contact event history.

## 2. Supported through a different field name

- TriniCars **Make** → `normalized_listings.brand_name`.
- TriniCars **Contact Name** → `raw_listings.raw_seller_label`.
- TriniCars **Contact Phone #s** → `raw_listings.raw_contact_text`.
- TriniCars **Date Added** → `raw_listings.source_posted_at` / `source_posted_text`.

## 3. Derivable and should not be duplicated

- Combined title: built safely from year + brand + model as `display_name`.
- Formatted price and mileage strings: derived from numeric values for display while keeping raw source text separately.
- Primary source image: derived from image order during normalisation.
- Fuel should remain a separate derived value only when source engine text actually declares fuel; engine displacement alone must not be treated as fuel.

## 4. Preserved only in raw source data

- Colour.
- Engine-size text.
- Original year/mileage/transmission/price wording.
- Source posting text and date parsing result.
- Contact name/text and current TriniCars adapter-specific flags.

## 5. Missing but likely important

| Future information | Why it matters | Who needs it | Recommended future shape | Backward compatible? |
|---|---|---|---|---|
| Colour | Useful buyer comparison and admin verification. | Buyers, admins | Additive nullable canonical text + retain raw source value. | Yes. |
| Engine specification | Helps compare otherwise similar vehicles. | Buyers, admins | Additive nullable text first; normalise only if requirements become clear. | Yes. |
| Selected feature list | Major portion of seller-entered vehicle detail; aids discovery and trust. | Buyers, admins, sellers | Preserve raw feature labels; later choose a canonical feature model. | Yes. |
| Additional Info | Captures condition, extras, and context. | Admins; possibly buyers after seller approval | Use existing `raw_description` for raw capture; later decide on approved first-party public description. | Yes; raw mapping needs no schema change. |
| Separate WhatsApp/email channels | Clearer contact workflow. | Admins/sellers | Additive nullable admin-only contact-channel model if/when needed. | Yes. |

## 6. Existing field may be too restrictive

No relevant `text` fields have a length limit. Numeric fields are safe for ordinary TTD prices and mileage values. The main restrictions are semantic, not storage size:

- contact is one unstructured text field;
- colour and engine size are not normalised;
- features are absent;
- image provenance/approval has no model;
- source records/images are overwritten on refresh rather than historically versioned.

## 7. Source-specific metadata that should remain admin-only by default

- Source contact name, phone, WhatsApp/email if later captured.
- Source listing ID/URL and source posting/fetch/refresh timestamps.
- Source-page views, if later confirmed useful and available.
- Parser confidence, raw values, and source-missing warnings.
- TriniCars’ own photo-submission email/WhatsApp details.

## 8. Image-model gaps

The schema has a good base for ordered source URLs, but the current TriniCars adapter brings in only one image. It cannot currently represent:

- every source photo;
- photo angle/category;
- seller-owned vs source-owned vs copied image provenance;
- seller approval/replacement/rejection;
- upload/moderation time;
- captions/notes; or
- an immutable history of image changes.

This is why the planned **Pics Received** step should be designed as a separate, deliberate feature—not by reusing the source-image refresh path.

## 9. Product decisions needed before any future schema work

1. Which seller-form fields must be buyer-visible after seller approval: colour, engine text, selected features, Additional Info, or only some of them?
2. Should the feature checklist be preserved as source labels exactly, mapped to a Rev Matched vocabulary, or both?
3. Should source contact remain entirely admin-only until a seller claims/accepts the listing? The current policy and implementation say yes.
4. Which photo coverage is required before Go Live, and should each photo be categorised (front, rear, interior, engine, etc.)?
5. Is plate masking required before an image can become buyer-visible, and who performs/approves it?
6. Does Rev Matched need source-history snapshots, or is retaining only the latest raw source version enough for the MVP?

## Bottom line

Rev Matched already has a safe core: source identity, price, make/model/year, mileage, transmission, raw payload, workflow, and ordered source image URLs. The largest information-loss gaps are **Features**, **Additional Info**, and the lack of structured **colour/engine** fields. The largest future design risk is **images**: seller-approved media must not be mixed into the source-image refresh path without new provenance and approval safeguards.

