# Rev Matched — Buyer Inventory Visibility Rules

## Purpose

This document defines how buyer-facing inventory should respect recommendation eligibility and listing trust.

Its purpose is to answer a simple product question:

> Which listings are allowed to appear in which buyer-facing surfaces?

This document sits between:
- `recommendation-eligibility-notes.md`
- `matching-logic-notes.md`
- the buyer-facing discovery flow

It is intended to keep inventory visibility:
- trustworthy
- easy to explain
- consistent across screens
- and emotionally confidence-building for buyers

---

## Core Principle

A listing should not appear in buyer-facing surfaces just because it exists.

Before a listing is shown to buyers, Rev Matched should first decide:

1. is the listing operationally trustworthy enough to show?
2. if yes, how confidently should it be shown?

This means buyer visibility depends on:
- listing freshness
- recommendation eligibility
- and the type of buyer-facing surface being rendered

The system should protect the buyer experience from:
- stale inventory
- low-trust records
- duplicate confusion
- and listings that are too weak to support confident discovery

---

## Inventory Visibility Layers

Buyer-facing inventory is now governed by three visibility concepts.

| Layer | Meaning |
|---|---|
| `isBuyerVisibleListing()` | Can this listing appear in buyer-facing inventory at all? |
| `isPrimaryDiscoveryEligible()` | Can this listing appear in strong discovery / Match contexts? |
| `isBroadExplorationEligible()` | Can this listing appear in softer exploration surfaces? |

These functions intentionally separate:
- visibility
- stronger recommendation confidence
- and broader exploratory visibility

---

## Recommendation Eligibility States

The buyer-facing visibility rules depend on the recommendation eligibility system.

Current states:

| State | Meaning |
|---|---|
| `eligible` | Trusted enough for stronger discovery |
| `limited` | Usable, but should be shown more cautiously |
| `review_required` | Needs admin review before buyer-facing discovery |
| `hidden` | Should not appear in buyer-facing discovery |

---

## Visibility Rules

### Rule 1 — `eligible` listings may appear in primary discovery

Listings marked `eligible` may appear in:
- primary discovery
- stronger preference-matched flows
- and stronger match-style buyer surfaces

This is the highest buyer-facing trust state.

---

### Rule 2 — `limited` listings may appear only in broader exploration

Listings marked `limited` may still be useful, but they should not be treated as strong Matches.

They may appear in:
- broader exploration
- `Keep Exploring`
- `In Your Budget`
- and similar softer inventory surfaces

They should not be promoted as:
- strong direct Matches
- or high-confidence primary discovery candidates

---

### Rule 3 — `review_required` listings must not appear in buyer-facing discovery

Listings marked `review_required` need human judgment before they are safe to expose.

They must not appear in:
- primary discovery
- stronger match areas
- or broader exploration

These listings should remain internal until review resolves the trust issue.

---

### Rule 4 — `hidden` listings must not appear in buyer-facing discovery

Listings marked `hidden` are too weak or too risky for buyer-facing visibility.

They must not appear in:
- primary discovery
- broader exploration
- or any confidence-bearing buyer surface

This usually reflects:
- missing critical fields
- untrusted availability
- or a listing that should remain operationally suppressed

---

### Rule 5 — stale or unavailable listings should not be promoted as strong Matches

Even when a listing seems structurally usable, stale or unavailable inventory should not be promoted as high-confidence buyer-facing matches.

This supports emotional confidence by avoiding:
- disappointment
- broken trust
- and “great match, but not really available” experiences

---

## Current Buyer-Facing Mapping

The current first-pass visibility mapping is:

| Buyer surface | Allowed states |
|---|---|
| Primary discovery / strong Matches | `eligible` only |
| Broader exploration | `eligible`, `limited` |
| Review queue / admin surfaces | all internal states |

This keeps the buyer flow calm and interpretable:
- strong discovery stays stronger
- broader exploration stays broader
- and low-trust inventory stays out of sight

---

## Surface-by-Surface Guidance

### Discover

`Discover` should feel curated and trustworthy.

It should therefore use:
- `isPrimaryDiscoveryEligible()`

This means:
- `eligible` listings may appear
- `limited` listings do not appear as strong discovery candidates
- `review_required` and `hidden` listings do not appear

This helps preserve the emotional meaning of discovery:

> these are listings Rev Matched is reasonably confident showing you first

---

### Matches / Strong Match Areas

Strong Match surfaces should be stricter than general browsing.

They should use:
- `isPrimaryDiscoveryEligible()`

This keeps the Match concept aligned with trust.

A listing should not feel like:
- a strong fit
- a strong recommendation
- and a high-confidence candidate

if the listing itself is still weak operationally.

---

### Keep Exploring

`Keep Exploring` is intentionally broader and more exploratory than the strongest discovery flow.

It should use:
- `isBroadExplorationEligible()`

This allows:
- `eligible`
- `limited`

but still excludes:
- `review_required`
- `hidden`

This keeps exploration richer without becoming messy or untrustworthy.

---

### In Your Budget

Budget-oriented exploration is still a buyer-facing trust surface, even if it is softer than direct matching.

It should use:
- `isBroadExplorationEligible()`

That means it may include:
- `eligible`
- `limited`

but should not surface:
- `review_required`
- `hidden`

---

### Second Chances

Second Chances should still respect buyer trust.

A listing being previously passed does not override recommendation eligibility.

This means Second Chances may show:
- `eligible`
- `limited`

but should still exclude:
- `review_required`
- `hidden`

---

### All

Even the broadest buyer-facing inventory surface should still respect minimum trust boundaries.

The `All` view may be broad in terms of:
- user interaction history
- previously seen inventory
- wider exploration

but it should still only include listings that are buyer-visible at all.

That means it should use:
- `isBuyerVisibleListing()`

and exclude:
- `review_required`
- `hidden`

---

## Why This Matters Emotionally

These rules are not only technical.

They support the emotional design of Rev Matched.

If low-trust listings appear too aggressively, buyers experience:
- uncertainty
- disappointment
- noise
- and lower confidence in the platform

If stronger discovery remains trust-aware, buyers are more likely to feel:
- guided
- reassured
- and confident that what they are seeing is worth considering

That is especially important because Rev Matched is not trying to feel like a raw listings dump.

It is trying to feel:
- thoughtful
- emotionally intelligent
- and selective in a way that helps users think clearly

---

## Implementation Philosophy

This system should stay easy to understand.

That means:
- visibility helpers should remain small and explicit
- recommendation eligibility should stay the source of truth
- buyer pages should reuse shared helper functions instead of duplicating custom rules

Current shared helpers:
- `isBuyerVisibleListing()`
- `isPrimaryDiscoveryEligible()`
- `isBroadExplorationEligible()`

This keeps the filtering logic:
- readable
- maintainable
- and scalable as ingestion grows

---

## Current MVP Boundaries

This first-pass system does **not** attempt:
- per-user trust weighting
- machine-learned visibility decisions
- dynamic marketplace confidence models
- source-specific advanced ranking logic

It is intentionally rule-based and simple.

That simplicity is a feature at this stage.

---

## Future Expansion

Over time, visibility rules can become more nuanced.

Possible future refinements:
- surface-specific thresholds for `limited`
- dealer-feed trust upgrades
- claimed-listing trust upgrades
- source-level visibility policies
- more explicit confidence tiers for broader exploration

But the current product rule should remain simple:

> show buyers only what we trust enough for the context they are in

---

## Closing Principle

Buyer inventory visibility is where ingestion trust becomes lived product experience.

It is the layer that makes Rev Matched feel:
- cleaner than a marketplace dump
- more trustworthy than a raw listing feed
- and more emotionally confidence-building for the buyer

The goal is not to hide inventory unnecessarily.

The goal is to protect the meaning of what buyers see.
