# Normalization Edge-Case Test Dataset

## Purpose

This document defines the first realistic Trinidad marketplace edge-case dataset for hardening RevMatched's normalization and recommendation pipeline.

The goal is to stress-test the layer between raw marketplace listings and buyer-facing discovery before ingestion scales.

This dataset is intentionally messy. It includes duplicate listings, missing fields, informal seller language, inconsistent price and mileage formatting, dealer reposts, WhatsApp-only sellers, image issues, and confidence scoring examples.

The matching experience should only be as confident as the inventory underneath it. These cases help confirm that RevMatched can handle real marketplace behavior without showing buyers confusing or low-trust listings.

## Dataset File

The executable fixture lives at:

`scripts/normalizationEdgeCaseDataset.ts`

That file does not change app behavior. It exports sample raw listings and expected normalized outcomes so future test scripts can insert, normalize, compare, and report results.

## What The Dataset Covers

| Area | Covered by | Product question |
|---|---|---|
| Messy raw listings | `edge-001`, `edge-005` | Can we recover usable buyer-facing fields from informal local listing text? |
| Duplicate scenarios | `edge-001`, `edge-002` | Can we avoid showing the same private vehicle twice? |
| Missing fields | `edge-003`, `edge-004`, `edge-009` | Can we distinguish usable incomplete listings from listings that should be hidden? |
| Inconsistent price formatting | `edge-001`, `edge-004`, `edge-007`, `edge-008` | Can we parse real-world pricing without inventing values? |
| Inconsistent mileage formatting | `edge-001`, `edge-005`, `edge-006`, `edge-010` | Can we parse mileage across commas, spaces, uppercase units, and bare numbers? |
| WhatsApp-only sellers | `edge-004`, `edge-005`, `edge-008` | Can we identify WhatsApp as a seller contact behavior? |
| Dealer reposts | `edge-006`, `edge-010` | Can we group likely reposts before creating duplicate buyer cards? |
| Image issues | `edge-008`, `edge-009` | Can image weakness lower confidence without breaking the pipeline? |
| Confidence scoring | all cases | Can we communicate how trustworthy normalization is? |

## Edge-Case Listings

### edge-001: Messy but Recoverable Axio

Tests a realistic local title:

`TOYOTA AXIO 2016 PDZ HYBRID - very clean!!`

Expected result:

- recover Toyota / Axio / 2016
- parse `$90k neg` as `90000`
- parse `128000km` as `128000`
- infer sedan body type
- identify WhatsApp contact
- keep buyer-visible because the core fields are recoverable
- assign moderate-high confidence

### edge-002: Private Seller Duplicate

This is a cleaner repost of `edge-001`.

Expected result:

- identify likely duplicate based on price, mileage, contact, and image overlap
- require review before buyer visibility
- preserve high normalization confidence for the field extraction itself
- separate "we know what this listing says" from "we should show this as a separate card"

### edge-003: Sparse RORO Listing

Tests a sparse marketplace listing:

`Toyota Corolla Axio RORO`

Expected result:

- parse make/model and RORO import status
- allow missing year, mileage, seller type, and location
- mark as limited rather than fully eligible
- keep buyer-visible only if the product accepts incomplete broader exploration listings

### edge-004: Missing Price

Tests `Inbox for price`.

Expected result:

- do not invent a price
- set price to null
- hide from buyer-facing discovery until price is clarified
- retain useful parsed fields for admin review

### edge-005: WhatsApp-Only Private Seller

Tests informal seller behavior:

`w/app only 555-4404`

Expected result:

- identify WhatsApp contact method despite shorthand
- infer Nissan Note from title and description
- parse spaced mileage text
- keep visible if core fields are otherwise strong enough

### edge-006: Dealer Repost With Slight Price Variation

Tests a dealer listing that may be reposted with a new price.

Expected result:

- parse dealer seller type
- parse RORO import status
- recognize A/T as automatic in a future normalizer
- flag for duplicate review rather than creating another buyer-facing card

### edge-007: Ambiguous Yaris / Belta

Tests ambiguous model naming:

`Toyota Yaris / Belta`

Expected result:

- preserve ambiguity instead of over-normalizing
- require review
- assign low confidence
- keep hidden until model identity is clarified

### edge-008: Broken Image URL

Tests a strong listing with weak image reliability.

Expected result:

- parse Toyota Yaris Cross Hybrid confidently
- lower recommendation confidence because the image URL is broken
- keep limited visibility if the rest of the listing is strong enough

### edge-009: No Images And Sparse Dealer Fields

Tests a sparse dealer row:

`Audi Q5`

Expected result:

- recognize Audi Q5 as an SUV
- parse price and mileage
- require review because there are no images and several missing trust fields
- prevent unexpected fallback to mock data

### edge-010: Dealer Duplicate With Changed Wording

Tests a likely duplicate of `edge-006` where the title and price changed.

Expected result:

- group with the previous dealer listing
- require canonical listing selection
- prevent duplicate cards from appearing in the buyer flow

## Duplicate Handling Expectations

Duplicate detection should not rely on one signal.

The first-pass duplicate signals should include:

- same or similar seller contact
- same or very similar mileage
- same or very similar price
- same source image URL or visually overlapping image set
- same seller/dealer name
- same location
- same make/model/year cluster
- repost language such as "fresh import", "special", "new price", or dealer financing copy

Expected product behavior:

- keep the best canonical listing visible
- flag likely duplicates for review
- avoid showing buyers multiple cards for the same car
- preserve the raw records for audit and source tracking

## Missing Field Expectations

Missing data should not always mean the listing is unusable.

Some missing fields should lower confidence:

- mileage
- location
- fuel type
- transmission
- seller type

Some missing fields should usually block buyer visibility:

- price
- make/brand
- model
- usable image coverage for high-trust recommendation surfaces

The normalizer should avoid making up missing values. It is better to show uncertainty than to create false confidence.

## Confidence Scoring Examples

Confidence should describe how much RevMatched trusts the normalized interpretation of the raw listing.

It should not be treated as the same thing as buyer desirability.

| Confidence | Example | Meaning |
|---:|---|---|
| 0.88 | `edge-002` | High field confidence, but duplicate risk requires review |
| 0.76 | `edge-005` | Usable buyer-facing interpretation from informal text |
| 0.58 | `edge-009` | Recognizable vehicle, but missing trust-building fields |
| 0.48 | `edge-007` | Ambiguous model identity and missing critical context |

## Recommendation Expectations

The edge cases should produce a mix of recommendation states.

| State | Intended meaning |
|---|---|
| `eligible` | Strong enough for confident buyer-facing discovery |
| `limited` | Usable, but should be treated cautiously |
| `review_required` | Needs human review before confident display |
| `hidden` | Should not appear to buyers yet |

This distinction matters because RevMatched is a guided decision product. Showing weak or duplicated inventory too confidently can make the buyer experience feel noisy and less trustworthy.

## Next Step

Create a runner that inserts these raw listings into local Supabase, runs normalization, and compares actual normalized outputs against the expected outcomes in `scripts/normalizationEdgeCaseDataset.ts`.

The first pass should report:

- parsed price
- parsed mileage
- parsed make/model/year
- seller type
- contact method
- import status
- buyer visibility
- recommendation state
- normalization confidence
- duplicate grouping behavior
- image linkage health
