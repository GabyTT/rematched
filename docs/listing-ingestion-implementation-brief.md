# Rev Matched — Listing Ingestion Implementation Brief

## Purpose

This document defines the recommended implementation direction for the Rev Matched listing ingestion system.

It translates the concepts from:

- `listing-ingestion-product-notes.md`

into:

- engineering structure
- ingestion flow direction
- normalization responsibilities
- database guidance
- MVP implementation boundaries
- and operational principles

This document is intended to guide:

- Codex
- developers
- future architecture decisions
- and implementation consistency

## Core Architectural Principle

The ingestion layer exists to transform fragmented and inconsistent Trinidad marketplace inventory into trustworthy discovery inputs for the Rev Matched buyer experience.

The system should prioritize:

- flexibility
- traceability
- progressive enhancement
- graceful handling of imperfect data
- and future recommendation capability

The system should avoid:

- premature optimization
- rigid assumptions
- over-normalization too early
- irreversible transformations of source data
- and over-engineering during MVP

## High-Level Pipeline Flow

The ingestion pipeline should conceptually follow this sequence:

```text
Source Fetch
→ Raw Listing Preservation
→ Structured Extraction
→ Normalization
→ Deduplication
→ Availability Evaluation
→ Listing Quality Evaluation
→ Recommendation Eligibility
```

Each stage should remain logically separable.

This allows:

- debugging
- parser upgrades
- source-specific logic
- and reprocessing later

## Recommended MVP Architecture

### Suggested Service Areas

```text
/apps
  /ingestion
    /sources
    /extractors
    /normalizers
    /dedupe
    /availability
    /quality
```

### Suggested Responsibilities

| Area | Responsibility |
|---|---|
| `sources` | Fetch raw marketplace data |
| `extractors` | Parse structured signals from raw content |
| `normalizers` | Convert inconsistent values into canonical forms |
| `dedupe` | Detect likely duplicate listings |
| `availability` | Determine stale vs active listings |
| `quality` | Evaluate listing completeness and trustworthiness |

## Recommended MVP Source Strategy

### MVP Recommendation

Start with:

- 1–2 Trinidad listing sources
- relatively stable structures
- manageable listing volume

Avoid initially:

- broad Facebook ingestion
- complex anti-bot systems
- high-frequency refresh infrastructure
- distributed scraping systems

The first goal is:

- ingestion reliability
- normalization quality
- and a stable ingestion spine

### Recommended Initial Sources

Potential candidates:

- TriniCars
- PinTT Cars

These provide:

- meaningful local inventory
- real-world formatting challenges
- and strong buyer relevance

## Source Adapter Principle

Each marketplace source should remain isolated behind its own adapter.

Example:

```text
/sources
  trinicars/
  pintt/
  facebook/
```

This prevents:

- source-specific parsing leakage
- fragile shared scrapers
- and tightly coupled ingestion logic

## Raw Data Preservation Rules

### Critical Principle

Raw source values should never be overwritten.

The system should preserve:

- raw title
- raw price text
- raw description
- raw location text
- raw seller labels
- raw contact text
- raw image URLs

This enables:

- parser improvement later
- extraction debugging
- normalization auditing
- and future AI-assisted extraction

## Recommended Data Layers

### Layer 1 — Raw Listings

Purpose:

- preserve source truth

Characteristics:

- minimally transformed
- ingestion-oriented
- source-specific

### Layer 2 — Extracted Fields

Purpose:

- parse candidate structured values

Characteristics:

- partially trusted
- may contain uncertainty
- extraction-oriented

### Layer 3 — Normalized Listings

Purpose:

- provide canonical business fields for Rev Matched UX and matching

Characteristics:

- consistent
- queryable
- recommendation-friendly

## Listing Identity Philosophy

### Important Principle

A listing is not always the same thing as a vehicle.

#### Listing

A marketplace appearance of a vehicle.

#### Vehicle

The canonical identity of the actual car itself.

A single vehicle may:

- appear across multiple marketplaces
- be reposted by brokers
- appear with modified pricing
- or be re-uploaded later

For MVP purposes these concepts may remain partially combined.

However, the architecture should avoid assuming:

> one listing = one vehicle

Long-term recommendation quality depends on this distinction.

## Recommended MVP Tables

These are directional recommendations only.

### Core Tables

```text
raw_listings
normalized_listings
listing_images
ingestion_runs
listing_duplicates
```

### Possible Future Tables

```text
vehicles
listing_sources
listing_quality_scores
listing_refresh_history
listing_extraction_results
```

## Recommended Raw Listing Fields

### Minimum MVP Fields

```text
source_name
source_listing_id
source_listing_url
raw_title
raw_description
raw_price_text
raw_location_text
raw_contact_text
raw_seller_label
raw_mileage_text
raw_fuel_text
raw_trim_text
image_urls
fetched_at
```

## Recommended Normalized Fields

### Core Buyer-Relevant Fields

```text
price_amount
year
brand_name
model_name
trim_name
mileage_value
fuel_type
transmission_type
body_type
location_name
seller_type
import_status
availability_status
```

## Extraction Principles

Extraction logic should be conservative.

### Important Rule

Do not invent certainty where the source is ambiguous.

It is better to:

- preserve uncertainty
- omit a value
- or mark a field unknown

than to confidently store incorrect normalized data.

## Trinidad-Specific Parsing Concerns

The ingestion layer should explicitly support local marketplace realities.

### Examples

#### Import terminology

```text
RORO
Foreign Used
Local Used
```

#### Informal seller language

```text
Negotiable
Transfer Included
Trade Accepted
WhatsApp Only
Lady Driven
```

#### Plate-series clues

```text
PDM
PDZ
PDG
```

These may appear:

- in titles
- descriptions
- or image text later

## Deduplication Philosophy

Deduplication does not need to be perfect in MVP.

The goal is:

- duplicate awareness
- not duplicate perfection

### Suggested Duplicate Signals

```text
same source listing ID
same source URL
similar title
similar price
similar mileage
same image set
same seller + mileage combination
plate-series similarity
```

## Availability Philosophy

Listings should not remain permanently active.

The system should support states such as:

```text
active
inactive
sold
stale
unavailable
```

### MVP Availability Recommendation

Simple freshness rules are sufficient initially.

Example approach:

- listing refreshed recently -> active
- listing missing repeatedly -> stale
- listing removed permanently -> unavailable

## Listing Quality Philosophy

Not all listings should be treated equally.

The system should eventually evaluate:

- completeness
- image quality
- field coverage
- freshness
- source credibility
- duplicate confidence

## Recommendation Eligibility

A listing should eventually become eligible for:

- Discover
- Matches
- Budget Exploration
- Recommendations

based on:

- normalization quality
- freshness
- completeness
- and duplicate confidence

## Error Handling Philosophy

### Important Principle

Partial ingestion is better than failed ingestion.

If:

- one parser fails
- one field fails extraction
- or one image cannot be fetched

the listing should still ingest whenever possible.

## Scheduler Direction

### MVP Recommendation

Simple scheduled ingestion is sufficient.

Example:

- periodic cron-based ingestion
- every few hours

Avoid initially:

- event-driven infrastructure
- distributed queue systems
- real-time ingestion architecture

during MVP.

## Logging Recommendations

The ingestion system should log:

- ingestion runs
- source failures
- parser failures
- normalization issues
- duplicate confidence results

This is critical for debugging real-world listing behavior.

## Image Usage & Attribution Philosophy

Rev Matched should avoid assuming ownership rights over externally sourced marketplace images.

For MVP:

- preserve source attribution
- preserve source URLs
- link users back to original listings where appropriate
- avoid aggressive image rehosting strategies
- and position Rev Matched primarily as a discovery and matching layer

rather than:

- a content ownership platform

Long-term direction should prioritize:

- seller-authorized uploads
- dealer-authorized inventory feeds
- and first-party marketplace inventory through `Moving On`

## Seller Claiming Direction

Rev Matched should eventually support:

- seller-managed listings
- listing claiming flows
- and seller-uploaded replacement images

This helps:

- reduce legal exposure
- improve listing freshness
- improve listing quality
- and transition inventory toward first-party participation

## Suggested Future Listing States

### Imported Listing

- source-attributed
- externally sourced
- limited seller participation

### Claimed Listing

- seller-managed
- refreshed information
- enhanced analytics
- seller-uploaded media

### Native Rev Matched Listing

- fully platform-managed
- highest trust level
- richest recommendation quality

## Seller Intelligence Direction

Rev Matched should eventually provide sellers with behavioral marketplace insights such as:

- likes
- Top Pick additions
- comparison frequency
- repeat engagement
- Top Pick duration
- buyer segment trends

These signals are strategically valuable because they indicate:

- emotional interest
- shortlist progression
- and buyer intent

rather than:

- simple page views

## MVP Non-Goals

Do not attempt all of these initially:

- AI image recognition
- VIN resolution
- advanced fraud detection
- deep seller trust scoring
- perfect vehicle identity resolution
- advanced recommendation engines
- large-scale scraping infrastructure

The goal is:

a stable ingestion foundation first.

## Recommended Future Expansion

Once the ingestion foundation is stable, Rev Matched can progressively expand toward:

- stronger duplicate intelligence
- canonical vehicle identity resolution
- image-level similarity detection
- AI-assisted extraction
- seller analytics
- pricing intelligence
- dealer integrations
- direct seller ingestion from `Moving On`

## Relationship to Buyer Experience

The ingestion layer directly affects:

- Discover quality
- recommendation trust
- budget exploration
- duplicate frustration
- and overall emotional confidence in the platform

The buyer experience will only feel intelligent if the ingestion layer produces inventory that feels:

- fresh
- trustworthy
- locally relevant
- and meaningfully structured

## Closing Principle

The ingestion system should not simply collect marketplace listings.

It should progressively transform a fragmented Trinidad used-car ecosystem into:

- cleaner discovery
- trustworthy inventory
- emotionally intelligent matching
- and stronger marketplace confidence for both buyers and sellers
