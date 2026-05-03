# Rev Matched — Listing Ownership, Attribution & Seller Intelligence Notes

## Purpose

This document defines the strategic direction for how Rev Matched should handle:

- externally sourced listing images
- source attribution
- listing ownership evolution
- seller claiming flows
- seller analytics
- and the gradual transition from marketplace aggregator to platform ecosystem

This document complements:

- `listing-ingestion-product-notes.md`
- `listing-ingestion-implementation-brief.md`

It focuses specifically on:

- trust
- legal exposure reduction
- seller participation
- and long-term marketplace evolution

## Core Strategic Principle

Rev Matched should not position itself as a platform that simply copies listings from other marketplaces.

Instead, Rev Matched should evolve toward becoming:

- a discovery layer
- a buyer intelligence platform
- a relationship-driven matching system
- and eventually a first-party marketplace ecosystem

The goal is not merely to display listings.

The goal is to:

- help buyers make better decisions
- help sellers better understand buyer interest
- and create a more emotionally intelligent marketplace experience

## Image Usage Philosophy

### Important Principle

Externally sourced listing images may:

- belong to sellers
- belong to marketplaces
- or be protected by platform terms and copyright restrictions

Rev Matched should therefore avoid assuming ownership rights over externally sourced images.

## Recommended MVP Image Strategy

### Early Phase Recommendation

For MVP, Rev Matched should prioritize:

- source attribution
- preservation of source URLs
- limited image handling
- and referral back to original listings where appropriate

The platform should behave primarily as:

- a discovery and matching layer

rather than:

- a content ownership platform

## Recommended MVP Behaviors

### Recommended

- preserve source attribution
- preserve original listing URLs
- link users back to source listings where appropriate
- maintain source transparency
- preserve listing provenance

### Avoid Initially

- aggressive image rehosting
- implying ownership of source images
- removing source attribution
- large-scale Facebook image scraping
- permanent full-resolution image replication

## Facebook Marketplace Considerations

Facebook Marketplace introduces significantly higher operational and platform risk.

Potential concerns include:

- anti-scraping enforcement
- Terms of Service violations
- aggressive automation detection
- and image/content ownership concerns

For MVP:

- prioritize dealer feeds
- public listing sites
- and lower-risk listing sources first

before:

- Facebook-heavy ingestion strategies

## Recommended Source Attribution UX

Example:

```text
Toyota Fielder 2015

$89,000 TTD

Source: TriniCars

View Original Listing ->
```
