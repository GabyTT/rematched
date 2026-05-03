# Rev Matched — Listing Ingestion Notes

## Purpose

This document defines the listing ingestion and normalization workstream that needs to exist underneath the Rev Matched buyer experience.

Its job is to explain:

- why listing ingestion matters to the product
- what kinds of source data Rev Matched needs to pull in
- how raw marketplace listings should move into Rev Matched inventory
- what normalization steps are required
- and how this should evolve from MVP to a more mature listing pipeline

This is not a scraper implementation doc and not a database schema doc.

It is a product-and-systems bridge for the inventory layer.

## Why This Matters

Rev Matched already has a strong buyer-facing flow:

- Define
- Discover
- Liked
- Top Picks
- Compare

But that buyer flow can only become truly useful at scale if it is fed by a real inventory pipeline.

Without listing ingestion, the product is limited to:

- curated demo listings
- manually maintained datasets
- or incomplete discovery coverage

With listing ingestion, Rev Matched can begin to behave like a real relationship-driven discovery platform grounded in live market data.

## Core Product Principle

Rev Matched should not merely copy listings from other marketplaces.

It should:

- ingest real listings
- preserve important raw source information
- normalize inconsistent source data
- remove noise where possible
- and transform messy marketplace inventory into a cleaner discovery layer

The ingestion system exists to support:

- smarter matching
- cleaner browsing
- better trust cues
- better comparison
- and better long-term marketplace intelligence

## Relationship to the Buyer Journey

The listing pipeline directly powers:

- `Discover`
- `Keep Exploring`
- `In Your Budget`
- `Second Chances`
- future recommendation pathways
- and eventually seller pricing and market comparison tools

If the ingestion layer is weak, the buyer flow will eventually feel:

- repetitive
- sparse
- unreliable
- or less intelligent than the product story suggests

## Source Types

Rev Matched should be designed to support multiple kinds of listing sources over time.

## 1. Marketplace Sites

Examples:

- TriniCars
- PinTT Cars
- Facebook Marketplace

These sources are likely to provide:

- broad inventory
- inconsistent structure
- duplicate listings
- sparse fields
- informal seller language

## 2. Dealer Sites

Examples:

- TT Motor Sales
- Japan Motors
- future dealer inventory pages

These sources are likely to provide:

- more structured inventory
- stronger dealer identity
- but still inconsistent formatting between sites

## 3. Future Direct Seller Input

This will eventually come from:

- Rev Matched’s own seller flow inside `Moving On`

This is important because it will likely become the cleanest listing source over time, even if external ingestion comes first.

## Core Ingestion Stages

The listing pipeline should be thought of as a sequence of stages.

## Stage 1 — Source Fetching

### Goal

Collect raw listing data from external sources.

### What this stage should capture

- source marketplace name
- source listing URL
- source listing ID, when available
- title
- price text
- description text
- contact text
- image URLs
- visible structured fields
- crawl or fetch timestamp

### Product principle

This stage should preserve raw source truth, even if it is messy.

Do not over-normalize too early.

## Stage 2 — Raw Listing Preservation

### Goal

Store what the marketplace actually said before interpretation begins.

### Important raw fields

- raw title
- raw price text
- raw mileage text
- raw fuel text
- raw location text
- raw description
- raw contact text
- raw seller label
- raw trim text

### Why this matters

Raw data is important for:

- debugging parsers
- improving extraction over time
- auditing normalization decisions
- and preserving culturally meaningful source language

## Stage 3 — Structured Extraction

### Goal

Extract usable structured values from raw source content.

### Likely extracted fields

- year
- brand
- model
- trim
- mileage
- fuel type
- transmission
- body type
- location
- seller type
- negotiable
- trade accepted
- transfer included
- contact method
- import status
- plate series

### Product principle

Extraction should be cautious.

It is better to preserve uncertainty than to confidently invent structure that the source did not actually support.

## Stage 4 — Normalization

### Goal

Convert inconsistent source values into Rev Matched’s canonical business fields.

### Examples

- convert price text into numeric `price_amount`
- convert raw mileage text into numeric `mileage_value`
- normalize fuel values into canonical fuel types
- normalize seller labels into seller-type categories
- normalize location values without discarding raw location text

### Product principle

Normalization should make inventory cleaner for matching and browsing, while preserving raw values for traceability.

## Stage 5 — Deduplication

### Goal

Reduce repeated listings and repeated vehicle appearances across fragmented sources.

### Why this matters

In a Trinidad listing environment, the same car may appear:

- across multiple sites
- in reposted forms
- with lightly changed titles
- with slightly different prices
- or through broker and dealer reposting behaviour

### Likely duplicate signals

- same source listing ID
- same source URL
- very similar title + year + price + location
- same image set
- same plate-series clues
- same mileage and seller combination

### Product principle

Deduplication does not need to be perfect at first, but the product should be designed with duplicate-awareness from the beginning.

## Stage 6 — Availability and Freshness Tracking

### Goal

Understand whether a listing is still meaningfully live.

### Important states

- active
- inactive
- sold
- unavailable
- stale

### Why this matters

The buyer flow should not feel full of dead inventory.

Availability freshness directly affects:

- trust
- discovery quality
- and recommendation usefulness

## Stage 7 — Listing Quality and Recommendation Readiness

### Goal

Judge whether a listing is complete and trustworthy enough to be shown prominently.

### Important dimensions

- completeness
- image coverage
- structured field coverage
- source credibility
- freshness
- duplicate confidence

### Product principle

Not every listing should be treated equally.

Some should be:

- promoted
- demoted
- withheld from direct Matches
- or shown only in broader exploration contexts

## Raw vs Normalized Field Strategy

For ingestion, Rev Matched should assume that many fields need both raw and normalized forms.

| Raw source field | Normalized counterpart |
|---|---|
| raw title | parsed year / brand / model / trim |
| raw price text | `price_amount` |
| raw mileage text | `mileage_value` |
| raw fuel text | canonical `fuel_type` |
| raw location text | normalized location value later |
| raw contact text | normalized contact-method flags |
| raw description | extracted seller and listing signals |

This is important because ingestion quality improves over time. The raw layer lets the system get smarter without losing source truth.

## Trinidad-Specific Ingestion Concerns

The ingestion system should be explicitly designed for Trinidad market realities.

## 1. Import terminology

Examples:

- `RORO`
- foreign used
- local used

These should not remain trapped in free text if Rev Matched wants meaningful matching and trust cues.

## 2. Plate-series hints

Examples:

- `PDM`
- `PDZ`
- `PDG`

These may appear in titles rather than structured fields, but they are locally meaningful and worth capturing.

## 3. Sparse and shorthand listings

Many marketplace rows include little more than:

- title
- price
- maybe a location

The system must handle sparse ingestion gracefully.

## 4. Informal seller phrasing

Examples:

- negotiable
- transfer included
- lady driven
- WhatsApp only
- trade accepted

These often appear in descriptions or informal notes rather than structured fields.

## Ingestion and Matching Relationship

The ingestion pipeline is not separate from matching. It is what makes matching credible.

Matching depends on ingestion quality for:

- clean price data
- meaningful vehicle type classification
- brand and model consistency
- freshness and availability
- duplicate awareness
- and recommendation trust

If ingestion quality is weak, matching will either:

- become too brittle
- become too noisy
- or overstate certainty

## Current MVP vs Future Direction

| Area | Current MVP reality | Future direction |
|---|---|---|
| Inventory source | Curated local dataset | Multi-source imported inventory |
| Raw source capture | Minimal | Full raw source preservation |
| Normalization | Manual / implicit | Explicit parsing and normalization pipeline |
| Deduplication | Minimal | Duplicate-aware listing identity layer |
| Availability tracking | Lightweight | Ongoing freshness and stale-listing handling |
| Listing quality | Mostly implicit | Structured completeness and quality scoring |
| Recommendation readiness | Curated by hand | Derived from ingestion and normalization quality |

## Recommended MVP Ingestion Scope

The first real ingestion phase should stay disciplined.

### Recommended MVP goals

- ingest a small number of known Trinidad sources
- preserve raw listing data
- normalize core buyer-relevant fields
- support direct discovery and budget exploration
- introduce lightweight duplicate handling
- support basic availability freshness

### Recommended MVP field priorities

- source marketplace
- source listing ID
- source listing URL
- raw title
- raw description
- raw contact text
- price amount
- year
- brand
- model
- mileage
- fuel type
- transmission
- location
- seller type
- import status
- availability status
- image URLs

### Recommended MVP non-goals

Do not try to solve all of these at once:

- perfect duplicate detection
- perfect trim normalization
- deep image matching
- fully automated trust scoring
- complete seller analytics

Those can come later once the ingestion spine is working.

## Recommended Future Expansion

Once the MVP ingestion layer is stable, Rev Matched can expand toward:

- richer dealer ingestion
- stronger duplicate detection
- image-level comparison
- listing quality scoring
- better seller trust signals
- more nuanced vehicle identity resolution
- direct connection to the seller flow inside `Moving On`

## Open Questions

These are the main product and systems questions to answer as this work begins:

1. Which source or sources should be ingested first?
2. How much raw HTML or source-page structure should be preserved versus transformed immediately?
3. Should duplicate handling happen at the listing level first, or should we define vehicle identity early?
4. What listing-quality threshold is required before a listing can appear in direct Matches?
5. How often should source listings refresh?
6. When a listing disappears, how long should it remain visible before being treated as stale or unavailable?
7. What ingestion signals should later feed seller pricing and market comparison tools?

## Recommended Companion Docs

This document works especially well alongside:

- [Real Listing Field Analysis](./real-listing-field-analysis.md)
- [RevMatched Data Dictionary](./rev-matched-data-dictionary.md)
- [Matching Logic Notes](./matching-logic-notes.md)
- [Implementation Gap Notes](./implementation-gap-notes.md)
- [Build Roadmap](./build-roadmap.md)

## Closing Principle

Listing ingestion is not just a backend concern for Rev Matched.

It is the operational foundation of the buyer experience.

If Rev Matched wants to feel:

- smart
- trustworthy
- locally relevant
- and meaningfully guided

then the ingestion layer must do more than collect listings.

It must translate a messy real-world market into clean, trustworthy discovery inputs.
