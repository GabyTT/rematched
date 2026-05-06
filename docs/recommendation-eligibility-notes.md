# Rev Matched — Recommendation Eligibility Notes

## Purpose

This document defines the first-pass recommendation eligibility system for Rev Matched listing ingestion.

Its job is to answer a practical question:

> Is this imported listing trustworthy and complete enough to appear in buyer-facing discovery?

This is not a machine learning system.

It is a rule-based operational trust layer designed to:
- improve discovery quality
- protect buyer confidence
- support admin review workflows
- and create a scalable bridge between messy source listings and buyer-facing recommendation surfaces

This document complements:
- `listing-ingestion-product-notes.md`
- `listing-ingestion-implementation-brief.md`
- `admin-ingestion-workflow.md`
- `matching-logic-notes.md`

---

## Core Principle

Not every imported listing should be treated equally.

Some listings are:
- fresh
- complete
- clearly structured
- and operationally safe enough for buyer-facing discovery

Others are:
- stale
- ambiguous
- incomplete
- duplicate-prone
- or risky from an attribution perspective

Rev Matched should therefore decide recommendation readiness before a listing is allowed to influence the buyer experience.

This system is meant to support:
- stronger `Discover` quality
- calmer broader exploration
- and future match confidence

---

## Recommendation Eligibility States

The first-pass system uses four states.

| State | Meaning | Buyer-facing implication |
|---|---|---|
| `eligible` | Listing is sufficiently fresh, structured, and trustworthy | Can appear confidently in stronger discovery surfaces |
| `limited` | Listing is usable, but has confidence limitations | Better suited for broader exploration than strong recommendation |
| `review_required` | Listing needs human judgment before confident discovery | Hold for admin review before stronger buyer-facing exposure |
| `hidden` | Listing is too weak or too risky for discovery | Keep out of buyer-facing discovery until trust improves |

---

## What This System Is For

Recommendation eligibility is not the same thing as:
- match quality
- buyer preference fit
- or emotional interest

It exists one layer earlier.

It determines whether a listing should even be allowed into:
- `Discover`
- broader exploration surfaces
- and future stronger match-confidence systems

In simple terms:

1. ingestion decides what was imported
2. normalization decides what we think the listing means
3. recommendation eligibility decides whether it is trustworthy enough to show
4. matching decides how well it fits a buyer

---

## Current First-Pass Factors

The current rule-based system evaluates recommendation readiness using a small set of operational trust factors.

### 1. Freshness

The system checks whether the listing appears operationally live enough to trust.

Signals include:
- `active`
- `stale`
- `inactive`
- `unavailable`

General effect:
- `active` can remain eligible or limited
- `stale` usually limits confidence
- `inactive` or `unavailable` should generally become `hidden`

---

### 2. Missing Critical Fields

Some fields matter enough that discovery should not guess around them.

Examples:
- missing price
- missing brand
- missing model

General effect:
- listings missing critical buyer-facing fields should generally become `hidden`

---

### 3. Normalization Confidence

Some listings are parsed clearly.
Others still carry real ambiguity from the source listing.

Current confidence levels:
- `high`
- `medium`
- `low`

General effect:
- `high` supports stronger recommendation eligibility
- `medium` may still be usable, but with caution
- `low` often pushes the listing toward `review_required`

---

### 4. Duplicate Warnings

The system should not confidently recommend listings that may be reposts or overlapping vehicle records without caution.

General effect:
- high-confidence open duplicate warnings push a listing toward `review_required`
- weaker duplicate pressure can still allow `limited`

---

### 5. Attribution Concerns

Some imported listings may have constraints around source attribution or image usage.

General effect:
- attribution or image-preview concerns should reduce recommendation confidence
- stronger concerns may require human review before broader buyer-facing exposure

---

### 6. Image Availability

Listings with poor image coverage weaken buyer trust even if the structured fields are otherwise usable.

General effect:
- listings with weak or constrained image coverage may remain `limited`
- severe image constraints can contribute to `review_required`

---

### 7. Partial Structured Fields

A listing may have enough to remain visible, but still be missing meaningful fields like:
- mileage
- transmission
- fuel type

General effect:
- this usually supports `limited` rather than `eligible`

---

## Current Recommendation Reasons

The first-pass system stores structured reasons alongside the eligibility state.

Current reasons include:

| Reason | Meaning |
|---|---|
| `freshness_untrusted` | Listing freshness is not trusted enough for stronger discovery |
| `missing_critical_fields` | Critical buyer-facing fields are missing |
| `duplicate_under_review` | Duplicate risk is high enough that human review is needed |
| `normalization_uncertain` | Structured interpretation is too ambiguous |
| `attribution_review` | Source attribution or image usage needs caution |
| `image_coverage_limited` | Image availability weakens buyer confidence |
| `structured_fields_partial` | Listing is usable, but still incomplete in meaningful ways |

These reasons are intentionally explainable.

They support:
- admin review
- future analytics
- and eventual buyer-facing confidence logic if we choose to expose any of it later

---

## Confidence Notes

In addition to a state and structured reasons, the system stores short confidence notes.

These are narrative explanations that help admins understand why a listing was classified the way it was.

Examples:
- “Listing freshness is uncertain and should be treated cautiously in discovery.”
- “Critical buyer-facing fields are missing, so the listing should stay out of discovery until clarified.”
- “The listing is usable, but some structured fields are still only moderately trusted.”

Confidence notes are not scoring.

They are meant to improve:
- traceability
- operational clarity
- and future debugging of eligibility behavior

---

## Current State Logic Summary

The current system behaves roughly like this:

### `eligible`

Use when a listing is:
- active
- sufficiently structured
- not missing critical fields
- not under strong duplicate pressure
- not blocked by attribution issues

This is the strongest first-pass trust state.

---

### `limited`

Use when a listing is:
- still usable
- but weaker in freshness, completeness, image coverage, or structured certainty

This is a good fit for:
- broader exploration
- softer inventory exposure
- and lower-confidence discovery surfaces

---

### `review_required`

Use when a listing is:
- too risky to trust automatically
- but not obviously bad enough to hide completely

Common triggers:
- high-confidence open duplicate warning
- low normalization confidence
- significant attribution concern
- explicit review-needed status

This state is where admin judgment matters most.

---

### `hidden`

Use when a listing is:
- inactive or unavailable
- missing critical fields
- or otherwise too weak for buyer-facing discovery

This does not mean the listing must be deleted.

It means:

> Do not let this influence buyer confidence yet.

---

## Relationship to Buyer Flow

Recommendation eligibility exists to support discovery quality before matching logic runs.

### `Discover`

`Discover` should be built on listings that are at least operationally trustworthy.

Best fit:
- `eligible`

Possible future fit:
- selected `limited` listings in softer exploration contexts

Avoid:
- `review_required`
- `hidden`

---

### Broader Exploration

Broader exploration surfaces can tolerate more uncertainty than stronger discovery.

Best fit:
- `eligible`
- `limited`

This is where listings that are still useful but not fully trusted may still add value.

---

### Future Match Confidence

Longer term, recommendation eligibility should act as a guardrail for stronger match systems.

A listing should not feel “high-confidence matched” if the listing itself is low-confidence inventory.

That means:
- inventory trust
- recommendation eligibility
- and buyer-fit logic

should stay conceptually separate, but work together.

---

## Relationship to Admin Workflow

The admin workflow should make recommendation eligibility visible and explainable.

Admins should be able to see:
- the current recommendation state
- the recommendation reasons
- confidence notes
- related freshness / duplicate / attribution concerns

This supports:
- review queue prioritization
- listing triage
- and gradual trust improvement of the ingestion system

Recommendation eligibility should therefore appear clearly in:
- the listings table
- listing detail pages
- dashboard metrics

---

## Current MVP Boundaries

This first-pass system intentionally does **not** do:
- machine learning scoring
- predictive trust scoring
- advanced fraud detection
- image-quality analysis
- semantic duplicate clustering beyond simple rules
- buyer-personalized recommendation weighting

It is deliberately simple.

That simplicity is good for MVP because it keeps the system:
- explainable
- operationally controllable
- and easy to iterate as real ingestion behavior emerges

---

## Future Expansion

Over time, this system can become more nuanced.

Possible future directions:
- field-level confidence scoring
- stronger freshness models
- duplicate confidence clusters
- source-level trust weighting
- dealer-feed trust distinctions
- seller-claimed listing trust upgrades
- buyer-surface-specific eligibility rules

But the current rule should stay simple:

> only recommend what we can trust enough to stand behind

---

## Closing Principle

Recommendation eligibility is the trust gate between ingestion and buyer experience.

Its purpose is not to be clever.

Its purpose is to make sure Rev Matched feels:
- more reliable
- more thoughtful
- and more confidence-building

than a raw stream of imported marketplace listings.
