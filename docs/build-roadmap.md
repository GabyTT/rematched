# Rev Matched — Prioritized Build Roadmap

## Purpose

This document turns the current product notes and implementation gaps into a practical build roadmap.

Its job is to answer:

- what should be built first
- what should come next
- what depends on what
- and how Rev Matched can mature without losing clarity

This is a product roadmap, not a sprint plan.

It is organized around sequence, product value, and dependency logic rather than engineering ticket detail.

## Roadmap Framing

Rev Matched already has a strong foundation in:

- buyer preference definition
- discovery structure
- Like and Top Pick progression
- shortlist comparison
- product language and documentation

That means the roadmap should not start by reinventing the buyer flow.

It should start by:

- deepening the existing buyer experience
- creating a real lifecycle handoff into ownership
- strengthening the ownership layer
- then building the first real seller workflow

## Planning Principles

This roadmap prioritizes work that:

- sharpens the core product promise
- improves the strongest existing flow first
- creates cleaner lifecycle continuity
- and lays groundwork for real-world listing complexity later

## Roadmap Structure

The roadmap is organized into four phases:

1. Strengthen the buyer engine
2. Formalize the ownership transition
3. Make Life Together real
4. Build the first true seller workflow

## Phase 1 — Strengthen the Buyer Engine

### Goal

Make the strongest existing part of Rev Matched feel more intentional, intelligent, and product-real without changing its overall UX shape.

### Why this phase comes first

The buyer journey is already the clearest and most mature product surface.

Improving it first creates:

- immediate user-facing value
- stronger product credibility
- and a better foundation for ownership and seller transitions later

### Priority outcomes

- discovery feels more meaningfully curated
- Match logic feels smarter without becoming confusing
- recommendation groups feel more distinct
- the path from Define -> Discover -> Liked -> Top Picks feels tighter

### Major workstreams

#### 1. Matching logic improvements

Focus:

- deepen direct Match quality
- better separate strict Matches from adjacent recommendations
- begin light recommendation ranking

Likely implementation themes:

- compatibility weighting
- match explanation cues
- stronger ranking inside discovery buckets
- clearer distinction between direct Match and exploration surfaces

#### 2. Discovery bucket differentiation

Focus:

- make `Keep Exploring`, `In Your Budget`, `Second Chances`, and `All` feel more intentionally different

Likely implementation themes:

- clearer rules for which cars appear in each surface
- more meaningful sorting inside each surface
- better visual and behavioural differentiation between bucket types

#### 3. Buyer decision progression polish

Focus:

- make the Like -> Top Pick -> Compare path feel even cleaner

Likely implementation themes:

- improved state clarity
- better “why this matters” cues
- more polished comparison support

### Definition of success for Phase 1

- the buyer flow still feels simple
- but recommendation quality feels noticeably more intentional
- and discovery surfaces feel less like one logic engine wearing different labels

## Phase 2 — Formalize the Ownership Transition

### Goal

Create a real product transition from “I am considering this car” to “this is now my car.”

### Why this phase comes second

Rev Matched’s long-term differentiation depends on ownership support, but the ownership layer will feel thin until the transition into it becomes explicit and product-native.

### Priority outcomes

- the app has a clear chosen-vehicle moment
- a vehicle can move from buyer context into ownership context intentionally
- Life Together feels like the continuation of the journey, not a side area

### Major workstreams

#### 1. Final-choice handoff

Focus:

- formalize the “I chose this car” moment

Likely implementation themes:

- chosen vehicle action
- ownership start state
- move from Top Pick / comparison into owned vehicle context

#### 2. Garage entry logic

Focus:

- make garage vehicles feel product-real rather than implicitly seeded

Likely implementation themes:

- ownership start date
- acquisition status
- explicit move into Life Together

### Definition of success for Phase 2

- the buyer journey has a satisfying endpoint
- Life Together has a believable beginning
- the lifecycle story becomes structurally real

## Phase 3 — Make Life Together Real

### Goal

Evolve Life Together from promising ownership scaffolding into a genuinely useful ownership companion.

### Why this phase comes third

Once the buyer-to-ownership handoff exists, the ownership layer can become deeper and more persistent without feeling disconnected.

### Priority outcomes

- owned vehicles feel persistent
- care records feel editable and believable
- reminders and provider guidance feel more useful
- Life Together starts earning repeat engagement

### Major workstreams

#### 1. Ownership persistence

Focus:

- formal owned-vehicle records
- more stable garage state

Likely implementation themes:

- garage entity definition
- persistent ownership data
- editable vehicle records

#### 2. Care history and maintenance workflow

Focus:

- turn seeded care history into a usable ownership tool

Likely implementation themes:

- maintenance logging
- service history updates
- milestone and reminder behaviour

#### 3. Provider and support usefulness

Focus:

- make provider suggestions feel tied to real ownership needs

Likely implementation themes:

- richer provider metadata
- need-specific recommendation behaviour
- stronger location and category handling

### Definition of success for Phase 3

- Life Together feels like an actual ownership product
- not just a thoughtful concept demonstration

## Phase 4 — Build the First True Seller Workflow

### Goal

Turn Moving On from a strong vision surface into a real seller journey.

### Why this phase comes fourth

The seller flow is currently the least implemented of the three major experiences.

It is important, but it benefits from being built after:

- the buyer journey is sharper
- lifecycle transitions are clearer
- and the ownership model is more structured

### Priority outcomes

- users can begin a genuine seller flow
- listing preparation becomes guided
- the product starts expressing seller value, not just seller intent

### Major workstreams

#### 1. Seller onboarding and listing draft flow

Focus:

- help users start preparing a car for sale

Likely implementation themes:

- basic seller intake
- listing draft creation
- guided listing steps

#### 2. Listing quality support

Focus:

- help users create better listings

Likely implementation themes:

- photo guidance
- description guidance
- listing completeness feedback

#### 3. Pricing and interest cues

Focus:

- give sellers lightweight but meaningful market support

Likely implementation themes:

- pricing guidance
- engagement cues
- simple listing visibility signals

### Definition of success for Phase 4

- Moving On becomes a real product workflow
- not just a future-facing promise

## Cross-Cutting Foundation Work

These are not standalone phases, but they should progress alongside the roadmap.

## A. Naming and state alignment

Why it matters:

- product language is now strong
- code and data naming will need eventual alignment to keep complexity manageable

Examples:

- Match vs matched
- Top Pick vs shortlist state names
- Passed vs rejected-style internal naming

## B. Real-market listing model readiness

Why it matters:

- the current curated app model is good for MVP
- real marketplace ingestion will need more field structure and normalization support

Examples:

- source listing metadata
- raw vs normalized values
- availability states
- duplicate handling
- Trinidad-specific listing concepts

## C. Account and persistence maturity

Why it matters:

- ownership and seller experiences will eventually require stronger persistence than the current MVP session model

Examples:

- saved preferences
- alerts
- owned vehicle persistence
- seller identity continuity

## Recommended Build Order Summary

If Rev Matched wants the cleanest practical sequence, this is the recommended order:

1. Improve matching quality and discovery differentiation
2. Formalize the “chosen vehicle” and move-into-ownership transition
3. Deepen Life Together into a more persistent ownership product
4. Build the first true Moving On workflow
5. Continue data-model and naming alignment underneath all phases

## Roadmap Table

| Phase | Primary goal | Why now |
|---|---|---|
| Phase 1 | Strengthen buyer engine | Sharpens the strongest current experience |
| Phase 2 | Formalize ownership transition | Creates true lifecycle continuity |
| Phase 3 | Make Life Together real | Deepens the main long-term differentiator |
| Phase 4 | Build seller workflow | Closes the largest vision-to-product gap |

## Notable Dependencies

| Dependency | Why it matters |
|---|---|
| Better matching before deeper seller work | The buyer engine is the strongest leverage point today |
| Explicit chosen-vehicle state before deeper ownership systems | Ownership needs a real product starting point |
| Stronger owned-vehicle model before advanced reminders and support | Lifecycle tools need believable underlying vehicle state |
| Richer listing model before real marketplace-scale ingestion | Current curated data model will not be enough long-term |

## What Not To Do First

To keep focus, Rev Matched should avoid starting with:

- full seller analytics before seller workflow basics exist
- deep account-system investment before lifecycle persistence needs it
- advanced data normalization work that the current product cannot yet meaningfully use
- large UI redesigns before the next product behaviours are clarified

## Recommended Companion Docs

This roadmap works best alongside:

- [Implementation Gap Notes](./implementation-gap-notes.md)
- [User Journey Map](./user-journey-map.md)
- [Matching Logic Notes](./matching-logic-notes.md)
- [Screen Descriptions](./screen-descriptions.md)
- [RevMatched Data Dictionary](./rev-matched-data-dictionary.md)

## Closing Principle

The right roadmap for Rev Matched is not about building everything at once.

It is about making the existing promise more real in the right order:

- first smarter discovery
- then true lifecycle continuity
- then stronger ownership support
- then a real seller journey

That sequence gives the product the best chance to feel coherent, differentiated, and increasingly valuable over time.
