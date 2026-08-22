# Real Listing Field Analysis

## Purpose

This document reviews real-world Trinidad used-car listing patterns to help Rev Matched design a better listing data model than the source marketplaces currently expose.

The goal is not to mirror marketplace data blindly. The goal is to identify:

- what fields appear consistently enough to store directly
- what fields are missing or embedded in free text
- what Trinidad-specific concepts should be modeled explicitly
- what fields should remain derived or heuristic until the product matures

This analysis is focused on database design implications for Rev Matched, not SQL implementation.

## Sources Reviewed

The listing notes reviewed came from the following Trinidad market sources:

- TriniCars
- PinTT Cars
- TT Motor Sales
- Facebook Marketplace (limited accessible results)
- Dealer references such as Japan Motors

## Listing Sample Table

The research sample included the following listings:

| # | Source | Title | Price | Make / Brand | Model | Year | Mileage | Transmission | Fuel Type | Body Type | Location | Seller Type | Contact Method | Photo Count | Description / visible notes |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TriniCars | Toyota Corolla Axio Hybrid | TT$59,500 | Toyota | Corolla Axio | Missing | Missing | Missing | Hybrid | Missing | Missing | Missing | Missing | Missing | Hybrid appears in title; sparse structured detail |
| 2 | TriniCars | Toyota Corolla Axio RORO | TT$110,000 | Toyota | Corolla Axio | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Missing | Missing | RORO import hint embedded in title |
| 3 | PinTT | Toyota Axio 2015 PDM | TT$50,000 | Toyota | Axio | 2015 | Missing | Missing | Petrol | Sedan implied | Cocoyea | Missing | Missing | Missing | Plate series embedded in title |
| 4 | PinTT | Toyota Axio 2016 PDZ | TT$90,000 | Toyota | Axio | 2016 | 128000 km | Missing | Hybrid | Sedan implied | Arima | Missing | Missing | Missing | Plate series embedded in title |
| 5 | PinTT | Nissan Note 2014 | TT$57,000 | Nissan | Note | 2014 | 83000 km | Missing | Petrol | Hatchback implied | D’Abadie | Missing | Missing | Missing | Body type inferred from model, not structured |
| 6 | TT Motor Sales | Nissan X-Trail | TT$85,000 | Nissan | X-Trail | 2015 | 91,000 km | Missing | Missing | SUV implied | Missing | Dealer implied | Phone implied | Missing | Sparse structured fields |
| 7 | Japan Motors | Toyota Axio EX | TT$140,000 | Toyota | Axio EX | 2021 | Missing | Missing | Hybrid | Sedan implied | Missing | Dealer | Missing | Missing | Trim embedded in title |
| 8 | TriniCars | Toyota Corolla Altis | TT$90,000 | Toyota | Corolla Altis | Missing | Missing | Missing | Missing | Sedan implied | Missing | Private | Phone | Missing | Seller uses only shorthand title |
| 9 | TriniCars | Toyota Yaris Cross Hybrid | TT$175,000 negotiable | Toyota | Yaris Cross | Missing | Missing | Missing | Hybrid | SUV/Crossover implied | Missing | Private | Phone | Missing | Negotiable stated in title |
| 10 | TriniCars | Toyota Yaris / Belta | TT$42,500 negotiable | Toyota | Yaris / Belta | Missing | Missing | Missing | Missing | Ambiguous | Missing | Private | Phone | Missing | Ambiguous model naming |
| 11 | PinTT | Toyota Axio 2009 PDG | TT$59,000 | Toyota | Axio | 2009 | Missing | Automatic | CNG | Sedan implied | Gasparillo | Private | Platform Chat | Missing | Plate series embedded in title |
| 12 | PinTT | Toyota Axio 2018 RORO | TT$89,578 | Toyota | Axio | 2018 | 53,263 km | Automatic | Petrol | Sedan implied | Piarco | Dealer | Platform Chat | Missing | RORO import status in title |
| 13 | PinTT | Nissan Note 2023 RORO | TT$130,000 | Nissan | Note | 2023 | 23,000 km | Automatic | Hybrid | Hatchback implied | Cocoyea | Dealer | Platform Chat | Missing | Hybrid not always consistently labeled |
| 14 | PinTT | Nissan Note Nismo Aura | TT$158,000 | Nissan | Note Nismo Aura | 2023 | 28,451 km | Automatic | Hybrid | Hatchback implied | Charlieville | Dealer | Platform Chat | Missing | Trim naming inconsistency |
| 15 | TT Motor Sales | Audi Q5 | TT$115,000 | Audi | Q5 | 2013 | 125,000 km | Missing | Missing | SUV | Missing | Dealer | Phone | Missing | Sparse structured fields |

## Field Inventory Across Sites

The following table summarizes the field landscape implied by the sample and notes.

| Field | Seen in sample/notes | Observed reliability | Rev Matched implication |
|---|---|---|---|
| Vehicle title | Yes | High | Store raw listing title and parse structured fields from it. |
| Price | Yes | High | Store as core numeric field plus display formatting. |
| Year | Often, but not always | Medium | Store directly, but allow null/unknown. Some sources leave year entirely inside title context or omit it. |
| Mileage | Inconsistent and frequently missing | Medium to low | Store numeric when parsable; preserve raw source text too. Missingness itself may be a quality signal. |
| Transmission | Present in some PinTT rows, omitted elsewhere | Low to medium | Store when available, but do not assume completeness across marketplaces. |
| Fuel type | Sometimes missing and inconsistently named | Medium to low | Store canonical fuel type plus raw source value. |
| Location | Sometimes missing | Medium to low | Store when available; allow null and later normalize. Town-level text should be preserved before normalization. |
| Body type | Frequently missing or only implied by model | Low | Important missing field; Rev Matched should model it explicitly and support inference. |
| Seller type | Often not explicit, but inferable in some contexts | Low | Add as a first-class field for trust and filtering. Keep room for unknown / inferred values. |
| Contact method | Visible in some sources but not universal | Low to medium | Separate seller contact behavior from seller identity. This is useful for downstream trust and conversion UX. |
| Photo count | Not consistently visible in the sample notes | Low | Important if accessible later; can help drive listing quality and confidence. |
| Import status | Often implied by shorthand | Medium | Important Trinidad-specific field that should be structured. |
| Plate series | Often implied in title/shorthand | Medium | Valuable local trust/context field; likely store separately. |
| Trim / variant | Often embedded in title and inconsistently expressed | Medium | Store raw trim text and normalize cautiously; useful for matching and trust. |
| Transfer included | Mentioned as sales signal | Low to medium | Useful boolean or nullable field. |
| Negotiable | Often implied in listing language | Low to medium | Useful structured boolean/enum. |
| Trade accepted | Often stated informally | Low to medium | Useful structured boolean. |
| WhatsApp available | Common marketplace behavior | Low to medium | Useful seller-contact capability flag. |
| Raw description text | Often the only place where transaction signals appear | Medium as source text, low as structured source | Preserve raw description for parsing, trust cues, and future extraction. |
| Raw contact text | Often contains behavior signals rather than clean structure | Medium as source text, low as structured source | Preserve verbatim for later normalization into contact-channel flags. |
| Source marketplace metadata | Yes | Medium | Capture both marketplace name and source-native identifiers to support deduplication and auditability. |
| Lifestyle descriptors | Usually embedded in title/description | Low as source field | Good candidate for derived tags in Rev Matched. |

## Inconsistent Formatting Observed

The listing notes surfaced several recurring formatting problems:

| Area | Observed inconsistency | Database design implication |
|---|---|---|
| Mileage | `128000 km`, `91,000 km`, `Missing` | Need numeric mileage field plus raw text preservation and parsing pipeline. |
| Fuel | `Hybrid`, `Petrol`, missing, and hybrid sometimes conflated with electric | Need canonical enum plus raw source value. |
| Vehicle identity | Year, import shorthand, and trim often embedded in title | Need raw title plus extracted structured fields. |
| Price | Display formatting varies by punctuation and spacing | Store numeric amount as truth; derive formatted price display. |
| Location | Sometimes exact town, sometimes omitted | Store raw location label first, normalize later. |
| Listing completeness | Some listings include only title + price | Support sparse rows without forcing fake data. |

## Missing Data Patterns

The research notes highlighted several recurring missing-data behaviors:

- mileage is absent in a large share of the sample, especially TriniCars and some dealer-style rows
- body type is rarely structured directly and is often only implied by model familiarity
- seller type is sometimes visible through platform context, but often not explicitly structured
- transmission is missing across many listings outside the stronger PinTT samples
- fuel type is often omitted, even when it is commercially relevant
- exact trim or variant is often buried inside the title and not modeled separately
- photo count was not consistently visible in the research notes, even though it is likely meaningful for listing quality
- location is sometimes omitted entirely
- some listings expose only title + price + one or two supporting fields

These patterns matter because Rev Matched’s recommendation logic and user trust layer will need to handle incomplete listings gracefully.

### Suggested implication for Rev Matched

Rev Matched should treat listing completeness itself as meaningful metadata.

That suggests a future need for:

- `listing_quality_score`
- field-level completeness checks
- confidence-aware filtering and ranking

## Trinidad-Specific Listing Issues

The notes surfaced several locally meaningful concepts that general-purpose listing schemas often miss:

| Concept | Meaning | Why it matters for Rev Matched |
|---|---|---|
| `RORO` | Imported vehicle shipped via Roll-On Roll-Off | Important import-status signal and buyer expectation cue. |
| Foreign Used vs Local Used | Core Trinidad market distinction | Should be modeled explicitly, not buried in title text. |
| Plate series codes | Strong buyer perception signal | Useful for trust, age perception, and local context. |
| `PDM`, `PDZ`, `PDE`, etc. | Shorthand tied to plate/registration context | Indicates local metadata embedded in titles that may need parsing or storage. |
| `Lady Driven` | Cultural sales signal | Not objective vehicle truth, but meaningful marketplace language. |
| `Transfer Included` | Important transaction term | Should be structured if available. |

These are not edge cases. They are part of the actual Trinidad listing vocabulary and should influence Rev Matched’s domain model.

## Normalization Concerns

The listing notes suggest several normalization issues in the source market:

- fuel types are inconsistently represented
- hybrid vehicles are sometimes labeled electric
- transmission and drivetrain fields are often omitted
- listing titles contain embedded metadata that should really be structured fields
- duplicate listings and reposting behavior are common

### Database implications

| Concern | Recommended approach |
|---|---|
| Mixed free text and structured attributes | Store both raw source fields and normalized fields where possible. |
| Duplicate/reposted listings | Keep source-level identifiers and support future duplicate detection heuristics. |
| Sparse listings | Allow nullable fields and avoid over-constraining ingestion. |
| Embedded title metadata | Preserve raw title and add parsing pipeline outputs separately. |
| Fuel/body/transmission mismatch | Normalize into canonical enums, but keep original source values for audit/debugging. |

## Recommended Additions to Rev Matched Data Dictionary

Based on the research notes, the following fields should be considered additions or clarifications in Rev Matched’s business data model:

| Proposed field | Why it matters |
|---|---|
| `source_marketplace` | Identifies where the listing came from and supports source-specific parsing, ranking, and trust analysis. |
| `source_listing_id` | Preserves the marketplace-native identifier when available for deduplication and syncing. |
| `source_listing_url` | Keeps an auditable pointer back to the original listing source. |
| `import_status` | Captures foreign-used / local-used / RORO distinctions explicitly. |
| `plate_series` | Reflects locally meaningful shorthand and buyer perception signals. |
| `seller_type` | Distinguishes dealer, private seller, broker, etc. |
| `whatsapp_available` | Captures a common marketplace contact expectation. |
| `negotiable` | Important transaction signal often buried in copy. |
| `trade_accepted` | Helps classify seller flexibility and buyer pathways. |
| `transfer_included` | Important transactional value signal in Trinidad listings. |
| `body_type` | Frequently missing in source data, but important for Rev Matched filtering and matching. |
| `raw_description` | Preserves the original marketplace language so structured extraction can improve over time. |
| `raw_contact_text` | Preserves seller contact phrasing that may imply channel availability or response preference. |
| `photo_count` | Helps assess listing completeness and buyer confidence. |
| `trim_raw` | Captures trim or variant text exactly as seen in the source listing. |
| `trim_normalized` | Creates a cleaner canonical trim field when normalization is possible. |
| `availability_status` | Distinguishes active, sold, unavailable, or stale listings as ingestion matures. |
| `lifestyle_tags` | Supports Rev Matched’s emotionally guided experience better than raw marketplace copy alone. |
| `listing_quality_score` | Helps rank complete, trustworthy listings over sparse ones. |
| `duplicate_confidence_score` | Helps identify reposts and duplicates across fragmented marketplaces. |

## Fields to Keep Stored vs Derived

### Best kept stored

These fields are meaningful enough and stable enough to persist directly:

- raw listing title
- price amount
- year
- mileage raw value and/or parsed numeric mileage
- raw fuel value
- normalized fuel type
- location label
- import status
- seller type
- body type
- plate series
- WhatsApp availability
- negotiable
- trade accepted
- transfer included
- source marketplace
- source URL or listing reference

### Best kept derived or heuristic

These fields are useful, but may be better derived from source data, quality rules, or model outputs:

- `display_name`
- formatted `price_display`
- formatted `mileage_display`
- `listing_quality_score`
- `duplicate_confidence_score`
- `lifestyle_tags`
- normalized trust/relevance scoring

### Best stored as both raw and normalized

For several fields, the right answer is not either/or. It is both.

| Raw source field | Normalized counterpart |
|---|---|
| raw listing title | parsed year / brand / model / trim / import hints |
| raw fuel text | canonical fuel enum |
| raw mileage text | numeric mileage |
| raw location text | normalized locality reference later |
| raw description text | extracted seller signals and transaction terms |

## Open Questions Before Schema Design

Before moving into schema design, these business questions should be resolved:

1. Should Rev Matched treat a marketplace listing and a vehicle identity as separate entities?
   - Example: the same physical car may appear in reposts or across channels.

2. How much source-marketplace language should be preserved verbatim?
   - Especially for culturally meaningful phrases like `Lady Driven` or `Transfer Included`.

3. Do we want to model Trinidad-specific market concepts as first-class fields from the start?
   - `import_status`
   - `plate_series`
   - `seller_type`

4. Should body type be sourced, inferred, or both?
   - Many source listings omit it, but Rev Matched needs it for meaningful matching.

5. How should duplicate detection work across reposted or low-quality listings?
   - exact URL match
   - fuzzy title + price + year + location
   - image matching later

6. How should sparse listings be ranked in the product?
   - hide low-quality listings
   - demote them
   - show them with lower confidence

7. Should lifestyle-oriented fields be stored as editorial tags, ML-derived tags, or both?
   - This matters because Rev Matched is not only a marketplace mirror; it is a decision-support layer.

## Summary Insight

Existing Trinidad marketplaces optimize for human shorthand and marketplace familiarity, not clean structured data.

Rev Matched’s opportunity is to translate fragmented, incomplete, and culturally specific listing information into a cleaner vehicle model that supports:

- better matching
- better trust cues
- better comparison
- better emotional decision support

That means the Rev Matched data model should not just copy marketplace fields. It should preserve raw source information while introducing normalized business fields that make the user experience smarter and more consistent.
