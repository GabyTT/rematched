# Rev Matched — Supabase Schema Direction

## Purpose

This document outlines the recommended first-pass Supabase schema direction for Rev Matched.

It is meant to bridge:

- product thinking
- ingestion architecture
- admin review workflow
- buyer-facing discovery logic
- and future ownership / seller evolution

This is not a SQL migration file.

It is a schema-direction document that explains:

- what kinds of tables Rev Matched likely needs
- how those tables should relate to each other
- what should be stored raw vs normalized vs derived
- what belongs in MVP
- and what should be left for later

---

## Core Modeling Principle

Rev Matched should not model the marketplace as a single flat `cars` table.

The product already implies several different kinds of entities:

- a user
- a user preference profile
- a marketplace listing
- a normalized discovery object
- a real underlying vehicle identity
- a user-to-listing interaction
- an ownership record
- and an ingestion/admin review workflow

The most important schema principle is this:

> a listing is not always the same thing as a vehicle, and a buyer interaction is not a property of the listing itself

That separation matters for:

- duplicate handling
- reposts across sources
- recommendation trust
- seller claiming later
- and long-term ownership flows

---

## Recommended Schema Layers

Rev Matched should think about Supabase/Postgres in four broad layers.

### 1. Identity and User Layer

This covers:

- auth users
- user profiles
- preference profiles
- buyer interactions
- future ownership records

### 2. Inventory and Discovery Layer

This covers:

- normalized listings shown to buyers
- future canonical vehicles
- listing images
- listing recommendation eligibility
- listing visibility state

### 3. Ingestion and Admin Operations Layer

This covers:

- raw source listings
- extraction and normalization outputs
- ingestion runs
- duplicate warnings
- review records

### 4. Future Seller and Ownership Layer

This covers:

- seller claiming
- seller-managed listings
- native Rev Matched listings
- garage / owned vehicles
- maintenance and lifecycle records

---

## Core Entity Direction

Below is the recommended entity direction based on the current product and the docs already in the repo.

Current implementation note:

Phase 1 is complete locally. The app now uses Supabase Auth for sign-up, sign-in, and sign-out; creates `profiles` rows for signed-up users; stores user names in `profiles.display_name`; and saves/loads Define-stage preferences through `preference_profiles` and `preference_profile_brands`.

User-specific preference separation has been confirmed through local RLS smoke tests and manual testing with separate users.

The inventory, recommendation, admin ingestion, buyer interaction, ownership, and seller layers remain future phases.

### 1. `profiles`

Purpose:

- app-level profile for a signed-in user

Likely fields:

- `id`
- `auth_user_id`
- `display_name`
- `phone`
- `whatsapp_enabled`
- `role`
- `created_at`
- `updated_at`

Notes:

- `auth_user_id` should likely reference `auth.users.id`
- `role` should eventually support at least:
  - `buyer`
  - `seller`
  - `admin`

For MVP:

- keep this simple
- do not over-model identity before the buyer flow and ingestion pipeline are stable

---

### 2. `preference_profiles`

Purpose:

- store what a buyer defines in the `Define` flow

Likely fields:

- `id`
- `profile_id`
- `budget_min`
- `budget_max`
- `vehicle_type`
- `model_query`
- `created_at`
- `updated_at`

Notes:

- this should represent the current active preference profile, not every UI keystroke
- brand choices are better modeled in a join table rather than a comma-separated field

Related table:

### `preference_profile_brands`

Likely fields:

- `id`
- `preference_profile_id`
- `brand_name`

---

### 3. `listing_sources`

Purpose:

- represent marketplace/dealer source definitions

Likely fields:

- `id`
- `source_name`
- `source_type`
- `base_url`
- `ingestion_enabled`
- `notes`
- `created_at`
- `updated_at`

Why this matters:

- sources should not live only as string values forever
- this table gives us a cleaner way to attach runs, raw listings, and operational metadata to a source

Possible `source_type` values:

- `marketplace`
- `dealer_site`
- `dealer_feed`
- `native_revmatched`

For MVP:

- this can start very lightweight
- string enums in app code may coexist with this table early on

---

### 4. `ingestion_runs`

Purpose:

- operational record of each listing ingestion attempt

Likely fields:

- `id`
- `listing_source_id`
- `started_at`
- `finished_at`
- `status`
- `listings_fetched`
- `listings_normalized`
- `parser_errors`
- `duplicate_warnings`
- `run_notes`
- `created_at`

Why this matters:

- the admin workflow already assumes this entity exists
- it supports operational trust and parser debugging

Suggested statuses:

- `running`
- `completed`
- `partial`
- `failed`

---

### 5. `raw_listings`

Purpose:

- preserve source truth before interpretation

Likely fields:

- `id`
- `listing_source_id`
- `ingestion_run_id`
- `source_listing_id`
- `source_listing_url`
- `raw_title`
- `raw_description`
- `raw_price_text`
- `raw_location_text`
- `raw_contact_text`
- `raw_seller_label`
- `raw_mileage_text`
- `raw_fuel_text`
- `raw_transmission_text`
- `raw_trim_text`
- `fetched_at`
- `created_at`
- `updated_at`

Important principle:

- raw source values should be preserved, not overwritten

This is the auditable source layer that supports:

- parser improvements
- source debugging
- normalization traceability
- future reprocessing

---

### 6. `raw_listing_images`

Purpose:

- keep image URLs and source attribution separate from the core raw listing row

Likely fields:

- `id`
- `raw_listing_id`
- `image_url`
- `display_order`
- `source_attribution_required`
- `preview_allowed`
- `created_at`

Why a separate table:

- listings can have multiple images
- image policy and attribution concerns should be inspectable and extensible

This also aligns well with the ownership / attribution notes.

---

### 7. `normalized_listings`

Purpose:

- canonical buyer-facing inventory record used by discovery and matching

Likely fields:

- `id`
- `raw_listing_id`
- `listing_source_id`
- `source_listing_id`
- `source_listing_url`
- `display_name`
- `title`
- `price_amount`
- `year`
- `brand_name`
- `model_name`
- `trim_name`
- `mileage_value`
- `fuel_type`
- `transmission_type`
- `body_type`
- `location_label`
- `seller_type`
- `contact_method`
- `import_status`
- `availability_status`
- `normalization_confidence`
- `source_attribution_required`
- `source_images_allowed_for_preview`
- `created_at`
- `updated_at`

Important principle:

- this is the inventory layer buyers conceptually browse
- it should remain queryable and product-friendly
- but it should still point back to raw source truth

---

### 8. `normalized_listing_images`

Purpose:

- buyer-facing image presentation layer for a normalized listing

Likely fields:

- `id`
- `normalized_listing_id`
- `raw_listing_image_id`
- `display_url`
- `display_order`
- `is_primary`
- `created_at`

Why this helps:

- allows separation between raw image capture and buyer-facing display decisions
- supports future seller replacement images and claimed listings later

---

### 9. `listing_recommendation_profiles`

Purpose:

- store operational recommendation eligibility for each normalized listing

This is the trust gate between ingestion and buyer-facing discovery.

Likely fields:

- `id`
- `normalized_listing_id`
- `recommendation_state`
- `buyer_visibility_state`
- `normalization_confidence`
- `evaluated_at`
- `created_at`
- `updated_at`

Suggested recommendation states:

- `eligible`
- `limited`
- `review_required`
- `hidden`

Notes:

- this could be embedded directly inside `normalized_listings` in MVP
- but a separate table gives cleaner history and future extensibility

Recommended MVP direction:

- storing the recommendation state directly on `normalized_listings` is acceptable at first
- storing reasons in a child table is still worth doing

---

### 10. `listing_recommendation_reasons`

Purpose:

- structured reasons attached to a recommendation decision

Likely fields:

- `id`
- `normalized_listing_id`
- `reason_code`
- `note`
- `created_at`

Current reason direction from the app/docs:

- `freshness_untrusted`
- `missing_critical_fields`
- `duplicate_under_review`
- `normalization_uncertain`
- `attribution_review`
- `image_coverage_limited`
- `structured_fields_partial`

Why separate this out:

- supports multiple reasons per listing
- keeps logic explainable
- supports admin tooling and future analytics

---

### 11. `listing_confidence_notes`

Purpose:

- short human-readable explanation notes attached to a listing’s recommendation profile

Likely fields:

- `id`
- `normalized_listing_id`
- `note_text`
- `created_at`

This can be deferred if we want to avoid table sprawl early.

MVP alternative:

- store as a text array or JSON field on `normalized_listings`

---

### 12. `listing_review_records`

Purpose:

- admin workflow record for listings needing human review

Likely fields:

- `id`
- `normalized_listing_id`
- `review_status`
- `assigned_queue`
- `admin_note`
- `reviewed_by_profile_id`
- `reviewed_at`
- `created_at`
- `updated_at`

Suggested statuses:

- `pending`
- `needs_review`
- `approved`

Suggested queues:

- `normalization`
- `duplicates`
- `freshness`
- `attribution`

This table is central to the admin review queue workflow.

---

### 13. `listing_review_reasons`

Purpose:

- structured human-review reasons for why a listing needs attention

Likely fields:

- `id`
- `listing_review_record_id`
- `reason_code`
- `created_at`

Current review-reason direction:

- `missing_price`
- `missing_brand_model`
- `uncertain_normalization`
- `duplicate_warning`
- `stale_availability`
- `image_attribution_concern`

---

### 14. `listing_duplicate_warnings`

Purpose:

- duplicate-awareness layer for reposted or overlapping listings

Likely fields:

- `id`
- `normalized_listing_id`
- `status`
- `confidence_score`
- `created_at`
- `updated_at`

Suggested statuses:

- `open`
- `accepted`
- `dismissed`

Because duplicates can involve many listings, this likely needs a join table too.

Related table:

### `listing_duplicate_warning_members`

Likely fields:

- `id`
- `listing_duplicate_warning_id`
- `possible_duplicate_listing_id`

Optional supporting table:

### `listing_duplicate_signals`

Likely fields:

- `id`
- `listing_duplicate_warning_id`
- `signal_code`
- `signal_value`

This can be deferred until the duplicate system becomes richer.

---

### 15. `vehicles`

Purpose:

- canonical vehicle identity layer

This is not fully necessary for the first ingestion MVP, but the schema should leave room for it.

Likely fields:

- `id`
- `year`
- `brand_name`
- `model_name`
- `trim_name`
- `body_type`
- `fuel_type`
- `transmission_type`
- `import_status`
- `created_at`
- `updated_at`

Important principle:

- many listings may eventually map to one canonical vehicle identity

This becomes more useful when:

- duplicate resolution matures
- native seller listings arrive
- ownership records need to outlive marketplace listings

For MVP:

- this can remain a future table
- do not force perfect vehicle identity too early

---

### 16. `buyer_listing_interactions`

Purpose:

- user-to-listing relationship table for discovery behavior

This is one of the most important product tables.

Likely fields:

- `id`
- `profile_id`
- `normalized_listing_id`
- `journey_state`
- `liked_at`
- `passed_at`
- `top_pick_added_at`
- `last_interacted_at`
- `source_surface`
- `created_at`
- `updated_at`

Suggested `journey_state` direction:

- `unseen`
- `liked`
- `passed`
- `top_pick`

Important principle:

- this state belongs to the user’s relationship with the listing
- it should never be stored on the listing row itself

---

### 17. `buyer_listing_notes`

Purpose:

- user-authored notes attached to a listing

Likely fields:

- `id`
- `profile_id`
- `normalized_listing_id`
- `note_text`
- `created_at`
- `updated_at`

This can remain simple for a long time.

---

### 18. `owned_vehicles`

Purpose:

- represent a car after the buyer has moved into `Life Together`

Likely fields:

- `id`
- `profile_id`
- `normalized_listing_id`
- `vehicle_id`
- `display_name`
- `acquired_at`
- `ownership_status`
- `created_at`
- `updated_at`

Why this matters:

- an owned vehicle is not the same thing as a live marketplace listing
- `Life Together` needs a lifecycle object that persists after discovery

---

### 19. `owned_vehicle_events`

Purpose:

- maintenance and lifecycle history

Likely fields:

- `id`
- `owned_vehicle_id`
- `event_type`
- `event_date`
- `note_text`
- `provider_name`
- `cost_amount`
- `created_at`
- `updated_at`

This can support:

- oil changes
- tyres
- repairs
- inspections
- insurance milestones

---

### 20. `listing_claims`

Purpose:

- support the future transition from imported listing to seller-managed listing

Likely fields:

- `id`
- `normalized_listing_id`
- `claimed_by_profile_id`
- `claim_status`
- `claim_note`
- `created_at`
- `updated_at`

Suggested statuses:

- `pending`
- `verified`
- `rejected`

Why this matters:

- the ownership / attribution notes already imply this future
- seller claiming helps reduce legal and freshness risk over time

---

### 21. `native_listings`

Purpose:

- future first-party Rev Matched listings created directly inside `Moving On`

Likely fields:

- `id`
- `profile_id`
- `vehicle_id`
- `status`
- `created_at`
- `updated_at`

This likely converges with `normalized_listings` over time, but it is helpful to conceptually separate:

- imported listings
- claimed imported listings
- native Rev Matched listings

---

## Recommended MVP Table Set

If we keep the first real Supabase implementation focused, the first-pass schema should likely prioritize:

### Identity and buyer flow

- `profiles`
- `preference_profiles`
- `preference_profile_brands`
- `buyer_listing_interactions`
- `buyer_listing_notes`

### Ingestion and inventory

- `listing_sources`
- `ingestion_runs`
- `raw_listings`
- `raw_listing_images`
- `normalized_listings`

### Trust and operations

- `listing_review_records`
- `listing_review_reasons`
- `listing_duplicate_warnings`
- `listing_duplicate_warning_members`

Recommended MVP simplification:

- keep recommendation state directly on `normalized_listings`
- store recommendation reasons as a child table only if needed immediately

That gives us a practical ingestion + discovery + admin foundation without overbuilding.

---

## Suggested Key Relationships

High-level relationship direction:

```text
profiles
  -> preference_profiles
  -> buyer_listing_interactions
  -> buyer_listing_notes
  -> owned_vehicles

listing_sources
  -> ingestion_runs
  -> raw_listings

ingestion_runs
  -> raw_listings

raw_listings
  -> raw_listing_images
  -> normalized_listings

normalized_listings
  -> normalized_listing_images
  -> listing_review_records
  -> listing_duplicate_warnings
  -> buyer_listing_interactions
  -> buyer_listing_notes
  -> owned_vehicles
  -> listing_claims

listing_review_records
  -> listing_review_reasons

listing_duplicate_warnings
  -> listing_duplicate_warning_members
```

---

## What Should Be Stored vs Derived

### Best stored directly

- source listing identifiers
- raw source text fields
- normalized buyer-facing fields
- recommendation eligibility state
- review status
- duplicate warning status
- user interaction timestamps
- ownership records

### Best derived

- `display_name`
- formatted price and mileage strings
- top-pick fullness / slot pressure
- explanation summaries for UI
- broader “match confidence” language

### Best stored as both raw and normalized

- title
- price
- mileage
- fuel type
- transmission
- location
- seller/contact language
- trim/import hints

---

## Enum Direction

Rev Matched already implies several enums that should be standardized early.

Recommended candidates:

- `availability_status`
- `recommendation_state`
- `review_status`
- `review_reason`
- `duplicate_warning_status`
- `journey_state`
- `seller_type`
- `contact_method`
- `fuel_type`
- `transmission_type`
- `body_type`
- `import_status`

Recommendation:

- keep enum design conservative
- do not lock too many values too early if the source market is still messy

For some fields, lookup tables or plain text + app-level validation may be healthier than hard DB enums in early MVP.

---

## Supabase-Specific Direction

### 1. Use `auth.users` for identity, `profiles` for app data

This is the standard clean split.

### 2. Use UUID primary keys

Even if mock data currently uses readable IDs, UUIDs are a better long-term choice for Supabase.

### 3. Add timestamps everywhere

At minimum:

- `created_at`
- `updated_at`

For operational tables also include:

- `fetched_at`
- `started_at`
- `finished_at`
- `reviewed_at`
- `evaluated_at`

### 4. Plan RLS from the beginning

Even before full auth is implemented, the schema should assume:

- buyers can only see their own interactions, notes, preferences, and owned vehicles
- admins can see ingestion/admin tables
- public buyer discovery should only query buyer-visible normalized listings

### 5. Consider views for buyer-facing inventory

A Supabase view can eventually help expose only listings that are:

- buyer-visible
- recommendation-eligible enough for the relevant surface
- not stale in a misleading way

This can help separate:

- messy internal ingestion state
- from calm buyer-facing inventory queries

---

## Recommended RLS Direction

First-pass conceptual RLS:

### Buyer-owned tables

Restrict by current user:

- `profiles`
- `preference_profiles`
- `preference_profile_brands`
- `buyer_listing_interactions`
- `buyer_listing_notes`
- `owned_vehicles`
- `owned_vehicle_events`

### Admin-only operational tables

Restrict to admin users:

- `listing_sources`
- `ingestion_runs`
- `raw_listings`
- `raw_listing_images`
- `listing_review_records`
- `listing_review_reasons`
- `listing_duplicate_warnings`
- `listing_duplicate_warning_members`

### Semi-public discovery inventory

`normalized_listings` likely needs careful handling.

Recommended direction:

- do not treat the full raw normalized table as public
- instead expose buyer-safe inventory through:
  - a curated view
  - or strict policies that only allow visible rows

This matters because the admin/ops layer may contain listings that are:

- hidden
- review-required
- stale
- or attribution-sensitive

---

## What Not To Overbuild Yet

The schema should leave room for growth, but MVP should avoid getting trapped in premature complexity.

Do not overbuild yet:

- perfect canonical `vehicles` resolution
- VIN-level identity systems
- deep seller CRM models
- ML scoring tables
- event sourcing for every listing change
- complex media rights systems

The first real goal is:

> a trustworthy ingestion-backed discovery layer with clean user interaction storage

---

## Recommended First Migration Sequence

If we were sequencing this into actual Supabase work, a healthy first order would likely be:

1. `profiles`
2. `preference_profiles`
3. `preference_profile_brands`
4. `listing_sources`
5. `ingestion_runs`
6. `raw_listings`
7. `raw_listing_images`
8. `normalized_listings`
9. `listing_review_records`
10. `listing_review_reasons`
11. `listing_duplicate_warnings`
12. `listing_duplicate_warning_members`
13. `buyer_listing_interactions`
14. `buyer_listing_notes`

Then later:

15. `owned_vehicles`
16. `owned_vehicle_events`
17. `listing_claims`
18. `vehicles`
19. `native_listings`

---

## Closing Principle

The Supabase schema for Rev Matched should not be designed like a generic classifieds database.

It should reflect the actual product shape:

- discovery is guided
- recommendation trust matters
- ingestion is imperfect and reviewable
- users build relationships with listings over time
- ownership continues after purchase
- and seller participation should grow gradually from imported inventory toward first-party marketplace activity

If the schema preserves those distinctions early, the product will have much more room to mature without painful rewrites later.
