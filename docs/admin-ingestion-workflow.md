# Rev Matched — Admin Ingestion Workflow

## Purpose

This document defines the recommended admin workflow for managing listing ingestion inside Rev Matched.

Related working notes:

- `docs/ingestion-and-admin-process.md` — canonical source-to-live process
- `docs/admin-review-checklist.md`
- `docs/admin-review-field-backlog.md`

The admin ingestion layer exists to:

- monitor imported listings
- review normalization quality
- manage listing visibility
- review duplicates
- handle stale inventory
- and progressively improve marketplace quality over time

This document focuses on:

- operational workflow
- admin visibility
- review responsibilities
- and MVP admin tooling direction

## Core Principle

The ingestion system should not operate as a completely invisible backend process.

Rev Matched requires:

- visibility
- reviewability
- and operational control

especially during MVP and early ingestion phases.

The admin system should help the team:

- trust the ingestion pipeline
- identify parsing problems
- improve normalization
- and maintain inventory quality

## Current Admin Navigation

```text
/admin
  Overview
  1. Ingest
  2. Process Cars
```

These areas follow the real operational order, but each has a distinct job:

```text
Overview → Ingest → Process Cars
```

- **Overview:** What needs attention, and is the operation healthy?
- **1. Ingest:** What am I importing, and did the import succeed?
- **2. Process Cars:** Which listings am I reviewing, and what happens next?

Overview is deliberately not a second listing-processing workspace. The full interactive five-step pipeline belongs only on **2. Process Cars**.

The listings workspace contains the detailed lifecycle:

```text
Imported → Verified → Seller Contacted → Pics Received → Live
```

There is no separate top-level Review Queue. Review concerns such as missing fields, uncertainty, duplicates, staleness, or attribution are handled within the appropriate listing and workflow stage.

## Admin Workflow Overview

At a high level, the admin ingestion workflow should follow this loop:

```text
Source Ingestion
→ Admin Monitoring
→ Listing Review
→ Visibility / Eligibility Decision
→ Ongoing Refresh and Cleanup
```

The goal is not just to ingest data.

The goal is to keep the discovery inventory:

- trustworthy
- understandable
- and recommendation-ready

## Current Listing Lifecycle

The full source-fetch through go-live process is defined in [Ingestion and Admin Process](./ingestion-and-admin-process.md). This document describes the admin-screen and operating details for the part that begins after a record is Imported.

Each imported vehicle now moves through this admin-owned path:

```text
Imported → Verified → Seller Contacted → Pics Received → Live
```

- **Imported:** the record has arrived and must be checked against its source.
- **Verified:** all required listing fields have been checked or corrected.
- **Seller Contacted:** the admin is recording outreach, seller agreement, or follow-up. Seller agreement is an outcome inside this step, not the pipeline step itself.
- **Pics Received:** the seller has supplied approved pics, ready for the final go-live check.
- **Live:** visible to buyers.

When recording a seller result, the admin records the contact method, contact time, outcome, optional note, and follow-up date where needed. A seller agreement or no response remains within **Seller Contacted**. Other results can move the listing to **Pics Received**, **Seller Declined**, or **Retired** (sold/unavailable). These entries are saved as admin-only history.

## 1. Admin Dashboard

### Purpose

The dashboard is the operational summary screen. It turns real local database values into a short, action-led view; it does not duplicate the full Process Cars workflow rail or detailed listing-editing controls.

It should answer:

- what changed today
- what needs attention now
- what is ready to move forward
- whether the latest ingestion activity looks healthy

### Current Overview composition

- **Your next move:** a contextual red action such as **Review 5 new listings**, which opens Process Cars filtered to Imported. When Imported is empty, it uses a calm neutral Process Cars action instead.
- **Today at a glance:** compact cards for New imports, Needs review, Waiting on sellers, and Pictures received. These use real values only:
  - New imports uses the stored raw-record fetch timestamp in the Trinidad and Tobago timezone.
  - Needs review maps to the current Imported workflow stage.
  - Waiting on sellers maps to Seller Contacted, including No response records that remain in that stage.
  - Pictures received maps to Pics Received, the existing final-review stage; it does not imply that the listing will become live automatically.
- **Where listings are now:** a compact, linked segmented bar and five-stage legend (Imported, Verified, Seller Contacted, Pics Received, Live). It uses current workflow totals, keeps zero-count labels visible, and gives a short data-derived observation. The full interactive pipeline remains only on Process Cars.
- **Latest ingestion:** the latest `ingestion_runs` record with source, completion status, run date/time, selected listing date, run type, Found and Imported counts, and errors or duplicates only when they are non-zero. It links directly to that run's detail popup and to Ingest.

### Current data limitation

The database does not yet keep an immutable `first_imported_at` value for each normalized listing. Therefore **New imports** means listings whose stored source-fetch timestamp falls today, not a guaranteed count of records first seen today. This is intentionally documented instead of inventing a number or adding a schema change during the screen-refinement work.

### Admin value

This page should help an admin quickly decide:

- should I review newly imported records now?
- which existing stage needs action next?
- did the latest run finish cleanly?

## 2. Process Cars

### Purpose

The listings area is the working inventory table for imported records.

This is where admins should be able to inspect the normalized record that powers the buyer experience.

### Recommended MVP fields

- source
- title
- price
- year
- brand
- model
- availability status
- recommendation eligibility
- review status
- source URL

### Admin value

This view should help answer:

- what did we ingest?
- what does the normalized record currently look like?
- is the listing ready for discovery?
- does the source attribution look acceptable?

### Recommended decisions from this screen

Admins should eventually be able to:

- mark a listing as approved
- send a listing into review
- block a listing from recommendation surfaces
- inspect source attribution
- and review duplicate or availability flags

For MVP, visibility into those decisions is more important than full editing power.

## 1. Ingest

### Purpose

This area exists to monitor the health of the ingestion pipeline itself.

It should describe what happened during each source run.

### Recommended MVP fields

- source
- started at
- finished at
- status
- listings fetched
- listings normalized
- parser errors
- duplicate warnings

### Admin value

This view should help answer:

- which source ran recently?
- did it complete successfully?
- how much inventory moved through normalization?
- are parser failures increasing?
- are duplicates becoming more common?

### Recommended operational use

Admins should use this page to spot:

- broken parsers
- source instability
- run quality degradation
- and rising duplicate or stale-inventory pressure

## Recommended Admin Review Logic

Admins should not need to inspect every listing equally.

The system should use review warnings within the listing workspace to focus attention where it matters most.

### High-priority review cases

- missing or malformed price
- missing brand or model
- duplicate risk
- stale inventory signals
- attribution or image concerns

### Lower-priority cases

- minor formatting inconsistency
- weak trim normalization
- non-critical field omissions

The system should support a triage mindset, not full manual auditing of the entire inventory set.

## Recommended MVP Review Responsibilities

During MVP, admin review should focus on:

- confirming important normalized fields
- checking whether listings are fit for discovery
- catching obvious duplicate issues
- watching stale listings
- and preserving source transparency

The admin system should not require the team to manually fix every small data imperfection before value can be created.

## Visibility and Recommendation Relationship

One of the most important admin responsibilities is deciding whether a listing is ready for buyer-facing recommendation surfaces.

### Suggested visibility layers

#### Eligible

The listing is sufficiently complete, current, and trustworthy to appear in direct buyer discovery or recommendation surfaces.

#### Limited

The listing may be usable in broader exploration contexts, but should not be treated as a top-quality direct Match candidate.

#### Blocked

The listing should not currently appear in recommendation surfaces because it is too incomplete, too uncertain, too stale, or too risky from an attribution or duplicate standpoint.

This visibility framing should eventually map directly to recommendation eligibility in the ingestion admin.

## Duplicate Review Workflow

Duplicate handling should be operationally visible from the beginning.

### Recommended admin duplicate questions

- is this clearly the same listing as another record?
- is this likely the same underlying vehicle with altered copy or pricing?
- should one version be preferred over another?
- should both remain visible with lowered confidence?

### MVP duplicate philosophy

Duplicate awareness is more important than duplicate perfection.

The admin system should help the team identify likely duplicate clusters even before a more advanced vehicle identity layer exists.

## Stale Listing Workflow

Listings should not remain trusted forever.

### Recommended stale workflow questions

- has this listing refreshed recently?
- has the source removed it?
- is it likely still active?
- should it remain visible, be demoted, or be marked unavailable?

### Recommended MVP behaviour

Simple freshness handling is enough at first, but it should still be visible and reviewable in admin.

## Attribution and Ownership Workflow

Because externally sourced listings may involve attribution and ownership risk, admins should have visibility into source provenance.

### Recommended admin checks

- does this listing retain source attribution?
- is the source URL preserved?
- are there image or content ownership concerns?
- should this listing be shown only as a source-referred discovery item?

### Future direction

As Rev Matched evolves toward:

- claimed listings
- seller-managed listings
- and native Rev Matched listings

the admin workflow should also evolve to distinguish:

- imported listings
- claimed listings
- native listings

## Seller Claiming and Ecosystem Evolution

Over time, the admin system should support the transition from:

- externally sourced inventory

to:

- seller-claimed inventory
- dealer-managed inventory
- and first-party Rev Matched inventory

### Why this matters

This helps:

- reduce legal exposure
- improve freshness
- improve media quality
- and strengthen seller participation

The admin workflow should eventually include visibility into which listings are:

- imported only
- claimed by a seller
- or native to Rev Matched

## Recommended MVP Non-Goals

The first admin ingestion workflow does not need to include:

- advanced moderation tooling
- rich bulk-edit systems
- fraud investigation tooling
- deep analytics dashboards
- full seller claim operations
- or complete image rights management systems

The MVP goal is:

- operational visibility
- structured review
- and enough control to trust the ingestion layer

## Future Expansion

After MVP, the admin ingestion workflow can expand toward:

- listing detail views
- review history
- bulk review actions
- source-level parser diagnostics
- duplicate cluster management
- listing ownership state transitions
- and seller-claim review flows

## Relationship to the Current Admin UI

The current admin foundation in the app already aligns with this MVP structure:

- `/admin`
- `/admin/listings`
- `/admin/ingestion-runs`
- `/admin/review-queue`

That means this workflow doc can act as the operational product reference for further expansion of those screens.

## Recommended Companion Docs

This document works especially well alongside:

- [Listing Ingestion Product Notes](./listing-ingestion-product-notes.md)
- [Listing Ingestion Implementation Brief](./listing-ingestion-implementation-brief.md)
- [Listing Ownership, Attribution & Seller Intelligence Notes](./listing-ownership-attribution-seller-intelligence-notes.md)
- [Implementation Gap Notes](./implementation-gap-notes.md)
- [Build Roadmap](./build-roadmap.md)

## Closing Principle

The admin ingestion workflow should help Rev Matched do something very important:

turn a messy, inconsistent, and operationally risky listing ecosystem into something:

- visible
- reviewable
- improvable
- and trustworthy

That operational control is what allows the buyer experience to feel intelligent rather than fragile.
