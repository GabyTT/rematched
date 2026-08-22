# Rev Matched — Matching Logic Notes

## Purpose

This document explains how matching should work in Rev Matched from a product and domain perspective.

It exists to align:

- product thinking
- UX expectations
- recommendation behaviour
- data-model decisions
- and future implementation work

This is not a low-level algorithm spec. It is a product-logic guide for how Rev Matched should decide what feels compatible, what should be shown next, and how recommendation confidence should behave.

## How To Read This Document

This document intentionally contains both:

- what is true in the current MVP
- and where the matching system is intended to evolve next

To avoid confusion:

- sections labeled `Current MVP` describe behaviour that is already present or directly represented in the current product logic
- sections labeled `Future direction` describe the intended evolution of the system, not behaviour that already exists in full

## Current MVP Snapshot

Right now, Rev Matched matching is best understood as a strict, rule-based compatibility filter with a few adjacent exploration pathways.

In the current MVP:

- direct Matches are mostly binary, not scored
- budget, vehicle type, brand, and model are treated as direct preference checks
- only vehicles with usable preferences are shown as direct discovery candidates
- already interacted vehicles are excluded from primary discovery
- near-budget logic exists as a separate adjacent recommendation path
- there is not yet a full weighted ranking, explanation engine, or behavioural learning system

This is a sensible MVP shape because it keeps the experience understandable while still feeling meaningfully personalized.

## Core Matching Principle

Rev Matched does not exist to return the largest possible list of vehicles.

It exists to reduce overwhelm and guide users toward vehicles that feel increasingly compatible with their real needs.

The matching system should therefore optimize for:

- relevance
- clarity
- progressive narrowing
- emotional reassurance

not just raw search recall.

## What a Match Means

In Rev Matched, a `Match` is a system-generated compatibility result.

It should mean:

> This vehicle appears to fit the user’s stated preferences well enough to deserve focused attention.

Important:

- a Match is not a user action
- a Match is not a guarantee
- a Match should provide reassurance, not pressure

## Matching vs Other States

The product should keep these layers separate:

| Layer | Owner | Meaning |
|---|---|---|
| Match | System | Compatible with user needs |
| Like | User | Emotionally interesting |
| Top Pick | User | Serious finalist |

This separation is central to Rev Matched’s product design.

The system should never treat:

- a Like as proof of compatibility
- or a Match as proof of emotional interest

## Matching Inputs

The matching system should primarily use the preference profile defined in `Find the One`.

### Current primary inputs

- minimum budget
- maximum budget
- vehicle type
- preferred brands
- preferred model text

### Future likely inputs

- lifestyle guidance outputs from the car-type helper
- financing comfort level
- household size
- road-condition needs
- cargo needs
- fuel-efficiency preference
- ownership priorities

## Matching Layers

The cleanest product model is to think about matching in layers rather than as one single binary rule.

In the current MVP, only parts of this layered model are fully implemented. The rest should be treated as the intended design direction.

## Layer 1 — Eligibility

Before a vehicle can be meaningfully matched, it should be eligible to appear.

Examples of eligibility checks:

- listing is active
- listing is available
- listing is not sold or hidden
- listing has not been fully removed from the experience

In the current MVP, availability is already treated as a lightweight filter.

## Layer 2 — Hard Compatibility

These are the strongest user-defined constraints.

In the current product, the clearest hard compatibility filters are:

- budget range
- vehicle type, when explicitly chosen

These should carry more weight than softer discovery signals.

### Current MVP behaviour

The current implementation treats the following as direct compatibility checks:

- price must fall within budget, when a valid budget range exists
- vehicle type must match, when a specific type is selected
- brand must match, when brands are selected
- model must contain the user’s model text, when provided

This is intentionally simple and appropriate for the current product stage.

## Layer 3 — Soft Compatibility

These are important signals, but they should behave more like confidence shapers than absolute gates.

Examples:

- selected brand affinity
- model similarity
- likely fit with lifestyle needs
- closeness to preferred budget
- similarity to vehicles the user has liked

### Future direction

Over time, this is where Rev Matched can become smarter without becoming harder to understand.

Most of this layer is not yet deeply implemented in the current MVP.

## Layer 4 — Recommendation Context

A vehicle can be worth surfacing even if it is not a direct Match.

That is why Rev Matched needs recommendation pathways beyond strict matching.

Current and future examples include:

- `Keep Exploring`
- `In Your Budget`
- `Second Chances`
- `All`
- future brand-led exploration such as `More From This Brand`

These are not all Matches. Some are adjacent recommendations that help the user keep moving without feeling stuck.

## Current MVP Matching Model

The current MVP uses a relatively strict matching model for direct discovery.

### Current product behaviour

A vehicle is directly discoverable when:

- it is available
- the user has entered usable preferences
- it has not already been interacted with
- and it satisfies the active preference checks

### What “usable preferences” means now

The current app treats preferences as usable when at least one of these exists:

- a valid budget range
- a specific vehicle type
- one or more brands
- a model text input

This is a good MVP safeguard because it prevents discovery from pretending to be personalized when the system has almost nothing to go on.

## Budget Logic

Budget should be one of the strongest matching signals in Rev Matched.

For many users, price is not just a preference. It is a practical boundary.

### Direct budget match

A vehicle is a strong budget match when:

- its asking price falls within the user’s selected range

### Near-budget recommendation

Rev Matched should also support near-budget discovery to avoid overly brittle results.

This is the product role of `In Your Budget` and adjacent budget logic.

The idea is:

- keep direct Matches strict enough to feel trustworthy
- while still surfacing nearby options when they are realistically relevant

### Current MVP

The current product already supports near-budget logic as a separate recommendation path rather than mixing it into direct Matches.

### Product guidance

Near-budget suggestions should feel:

- reasonable
- transparent
- and helpful

They should not feel like the system is ignoring what the user said.

## Vehicle Type Logic

Vehicle type is one of the clearest structural preference signals in the buyer journey.

If a user explicitly says they want:

- a sedan
- an SUV
- a hatchback
- a pickup

the system should respect that strongly.

At the same time, future matching may allow related-type recommendations in secondary exploration surfaces when the fit is still sensible.

Examples:

- compact SUV vs larger SUV
- sedan vs hatchback for city-focused users

### Future direction

Those related-type suggestions should usually live outside the strictest Match layer unless the product becomes more confidence-based later.

## Brand and Model Logic

Brand and model preferences matter, but they should be handled thoughtfully.

### Brand

If a user selects brands, those should meaningfully influence direct matching.

In the current MVP, selected brands are treated as direct preference criteria.

Future direction:
brand may later behave more like a weighted affinity signal in some recommendation contexts, rather than always functioning as a strict gate.

### Model

Model text is currently best treated as a narrowing aid rather than a perfect truth source.

Because listing data is inconsistent in the real market, model matching should stay tolerant.

That means:

- partial matching is useful
- normalization matters
- exact string dependence will become fragile over time

Current MVP note:
model matching is still relatively simple today and should be understood as tolerant narrowing, not deep vehicle identity resolution.

## Interaction-Aware Recommendation Rules

Matching should not operate in isolation from user behaviour.

The recommendation system should respect the interaction layer.

### Current MVP note

The current product already excludes interacted vehicles from primary direct discovery.

More nuanced behaviour by interaction type is still evolving.

### Passed vehicles

Passed vehicles should not remain in primary discovery.

They can reappear in:

- `Second Chances`
- history-like review spaces
- future reconsideration flows

### Liked vehicles

Liked vehicles may still appear in broader exploration contexts, but the system should visually distinguish them and avoid treating them as untouched discovery items.

### Top Picks

Top Picks are already under serious consideration.

They should remain accessible, but they should not dominate the main discovery loop as if they were still early-stage candidates.

## Match Confidence

Over time, Rev Matched should move toward confidence-aware matching rather than a purely binary result.

### Recommended future model

Instead of only asking:

- matched or not matched

the system should also think in terms of:

- strong match
- reasonable match
- adjacent recommendation
- low-confidence exploration item

This does not mean the UI must expose all of those labels directly.

It means the recommendation engine should gradually become more nuanced while the user experience stays simple.

### Current MVP note

The current MVP does not yet expose or compute a fuller weighted match-confidence system.

## Explanation Logic

As matching becomes smarter, the system should also become better at lightly explaining itself.

Good explanation examples:

- fits your budget
- matches your preferred vehicle type
- from a brand you’ve shown interest in
- worth a look if you want a slightly newer option

These explanations should:

- increase confidence
- reduce mystery
- and never feel overly technical

### Current MVP note

The current system does not yet have a dedicated explanation layer for why a vehicle matched.

## Match Freshness and Stability

Match behaviour should feel stable enough to build trust.

Users should not feel like the system is changing its mind unpredictably.

### A Match should change when:

- the user updates preferences
- listing data changes meaningfully
- availability changes
- recommendation rules are intentionally revised

### A Match should not change because:

- the system is being noisy
- minor formatting changes occurred
- unrelated inventory changed elsewhere

## Sparse Listing Reality

Because Trinidad listing data is often incomplete, the matching system must handle imperfect data gracefully.

Examples of unreliable or missing fields:

- mileage
- fuel type
- body type
- transmission
- seller type
- exact trim

### Product implication

The system should not over-promise precision that the source data cannot support.

That means:

- use strong fields confidently
- use weak fields cautiously
- leave room for uncertainty

## Recommended Matching Priorities

If Rev Matched needs a simple product hierarchy for matching importance, this is a strong current order:

1. Availability
2. Budget fit
3. Vehicle type fit
4. Brand fit
5. Model fit
6. Secondary recommendation context
7. Behavioural adaptation over time

This order can evolve, but it is a sensible starting framework.

## Current MVP vs Future Direction

| Area | Current MVP | Future direction |
|---|---|---|
| Match logic | Mostly rule-based | More weighted and confidence-aware |
| Budget | Direct filter plus near-budget support | More nuanced affordability logic |
| Vehicle type | Direct match filter | Related-type recommendations in secondary surfaces |
| Brand/model | Direct preference checks | Better normalization and affinity scoring |
| Explanations | Minimal | Clear user-facing explanation cues |
| Behavioural adaptation | Basic interaction filtering | Smarter personalization over time |

## Recommended Interpretation

If there is ever a conflict between how this document sounds and how the current app behaves, interpret the document in this order:

1. `Current MVP Snapshot`
2. explicit `Current MVP` notes inside sections
3. `Current MVP vs Future Direction`
4. future-facing recommendation guidance

That keeps the document honest about what exists today while still preserving the intended direction of the product.

## Open Questions

These are the main questions to keep open as matching evolves:

1. How strict should direct Matches remain as the inventory gets larger?
2. When should a related vehicle type be surfaced as a smart alternative rather than a mismatch?
3. Should budget be treated as a hard boundary for all users, or should financing comfort later soften it for some?
4. How much behavioural learning should influence recommendations before the user explicitly changes preferences?
5. What level of explanation is helpful without becoming noisy?

## Recommended Companion Docs

This document pairs closely with:

- [Product Vision](./product-vision.md)
- [Terminology](./terminology.md)
- [Interaction Rules](./interaction-rules.md)
- [User Journey Map](./user-journey-map.md)
- [RevMatched Data Dictionary](./rev-matched-data-dictionary.md)

## Closing Principle

Matching in Rev Matched should feel like a smart guide helping the user make sense of a noisy market.

It should not feel like:

- a rigid search engine
- a black-box ranking machine
- or a generic marketplace feed

The best matching behaviour is the kind that quietly helps users feel:

- understood
- reassured
- and closer to the right decision
