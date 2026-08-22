# Current Listing Field Completeness Report

**Status:** read-only local database snapshot. No data, database schema, ingestion rule, or screen was changed.

**Checked:** 31 July 2026
**Related:** [TriniCars Seller Form — Rev Matched Field Mapping](./trinicars-seller-field-mapping.md).

## What was checked

This report counts whether fields are present. It does not copy seller names, phone numbers, source URLs, or other record-level private information.

The local database currently contains:

- **21** normalized listings — the clean inventory/workflow records.
- **18** retained raw source records — source records currently held by the ingestion layer.
- **1** seller-confirmed vehicle submission.
- **5** seller-uploaded photos, all approved, for **1** listing.

The difference between normalized and raw record counts is expected in a local development database that contains helper/manual records as well as source imports. It should not be interpreted as a missing import without looking at the individual records.

## Core vehicle fields in the normalized listing layer

| Field | Present | Missing | Reading |
| --- | ---: | ---: | --- |
| Make | 21 of 21 | 0 | Strong coverage. |
| Model | 21 of 21 | 0 | Strong coverage. |
| Year | 18 of 21 | 3 | Needs review where absent. |
| Asking price | 20 of 21 | 1 | Strong coverage, with one missing value. |
| Mileage | 15 of 21 | 6 | A meaningful import/review gap. |
| Transmission | 16 of 21 | 5 | A meaningful import/review gap. |
| Fuel type | 11 of 21 | 10 | Incomplete and should not be inferred from engine text without a clear rule. |
| Import status | 11 of 21 | 10 | This may reflect manual/helper records rather than missing source information. |

## Seller-confirmed supplementary fields

| Field | Present | Missing | Reading |
| --- | ---: | ---: | --- |
| Seller submissions | 1 of 1 | 0 | One seller has completed the first submission flow. |
| Colour | 1 of 1 | 0 | Current seller field works. |
| Engine specification | 1 of 1 | 0 | Current seller field works. |
| Selected Features | 0 of 1 | 1 | The seller’s submission has no selected feature values yet. This is a completeness issue, not a missing database field. |
| Additional Info | 0 of 1 | 1 | Optional and currently blank. |
| Public contact name | 1 of 1 | 0 | Current seller field works. |
| Public contact phone | 1 of 1 | 0 | Current seller field works. |
| Details confirmed | 1 of 1 | 0 | The seller confirmation flow works. |
| Submitted to Admin | 1 of 1 | 0 | The seller submission flow works. |

## Information already present in retained source records

| Source detail | Present | Missing | Reading |
| --- | ---: | ---: | --- |
| Colour in source payload | 5 of 18 | 13 | Available in some source records, but not consistent enough to treat as a dependable core field. |
| Engine specification in source payload | 5 of 18 | 13 | Same pattern as colour. Keep it as source evidence; seller confirmation remains the safer buyer-ready value. |
| Source description / Additional Info | 13 of 18 | 5 | Source descriptions exist in many retained records, but the adapter’s treatment needs separate review before relying on it as a standard field. |
| Source contact text | 18 of 18 | 0 | Available for Admin outreach only. Never buyer- or seller-visible. |

## Seller photo baseline

| Measure | Count | Reading |
| --- | ---: | --- |
| Seller-uploaded photos | 5 | The separate seller-media flow is storing uploads. |
| Approved seller photos | 5 | All current uploads have been approved. |
| Listings with approved seller photos | 1 | One listing currently has buyer-ready seller photo coverage. |
| Selected main photos | 1 | The current one-main-photo rule is working. |

## What this means

1. **The main TriniCars seller form does not need a database redesign.** Its key fields already have suitable seller-submission columns.
2. **The immediate data-quality gaps are imported mileage, transmission, fuel, and year—not missing seller-form columns.** Those are handled through Admin verification and seller correction.
3. **Features and Additional Info should be encouraged in the seller form before creating more schema.** They are already stored; the first submission simply left them blank.
4. **Do not automatically turn source colour or engine text into buyer-ready fields.** It is incomplete source evidence. The seller-confirmed values are the right source for a live listing.
5. **A future field migration is only needed after choosing a genuinely new field**, such as explicit WhatsApp/call preferences, negotiable price, trade accepted, or photo categories.

## Recommended next decision

Choose one of these paths before any migration:

1. **Improve the existing seller form first** — make Features and Additional Info clearer to complete, then test another seller submission.
2. **Add one new field only** — for example, a per-listing WhatsApp/call contact preference, if that is needed before the first real live listing.
3. **Improve source ingestion** — separately capture and preserve source Additional Info more consistently for Admin comparison. This is an ingestion task, not a seller-account schema change.
