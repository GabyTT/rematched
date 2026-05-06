# Rev Matched — Database Implementation Plan

## Purpose

This document turns the Supabase schema direction into a practical build plan.

It is meant to help Rev Matched move from local mock data and product notes toward a real Supabase-backed database without overbuilding too early.

Use this alongside:

- [Supabase Schema Direction](./supabase-schema-direction.md)
- [RevMatched Data Dictionary](./rev-matched-data-dictionary.md)
- [Real Listing Field Analysis](./real-listing-field-analysis.md)
- [Listing Ingestion Implementation Brief](./listing-ingestion-implementation-brief.md)
- [Recommendation Eligibility Notes](./recommendation-eligibility-notes.md)
- [Admin Ingestion Workflow](./admin-ingestion-workflow.md)

---

## Implementation Goal

The first database milestone should support:

- signed-in users with app profiles
- stored buyer preference profiles
- listing ingestion from external sources
- normalized buyer-facing inventory
- admin review of listing trust and quality
- buyer interactions such as Like, Pass, Top Pick, and notes
- recommendation and visibility state that can be queried safely

The first goal is not to create the final full marketplace.

The first goal is:

> a trustworthy ingestion-backed discovery layer with clean buyer interaction storage.

---

## Guiding Principles

### 1. Keep listings, vehicles, and user interactions separate

A listing is a marketplace appearance.

A vehicle is the underlying car identity.

A buyer interaction is the relationship between a user and a listing.

Do not collapse these into one `cars` table.

### 2. Store raw and normalized data separately

Raw marketplace data should remain auditable.

Normalized listing data should support matching, browsing, admin review, and buyer-facing display.

### 3. Build for reviewable trust

Imported listings can be incomplete, stale, duplicated, or uncertain.

The database should make that uncertainty visible instead of pretending every row is equally reliable.

### 4. Defer perfect canonical vehicle modeling

Canonical `vehicles` records can come later.

For the first implementation, `normalized_listings` can act as the main buyer-facing inventory table.

### 5. Plan RLS from the beginning

Even if the first app integration is simple, tables should be designed with row-level security in mind.

---

## Phase 0: Supabase Project Setup

Status: Complete locally

Create or confirm:

- Supabase project
- local Supabase CLI setup
- environment variables for local development
- project URL and anon key
- service role key stored outside client code
- migration folder convention
- seed data convention

Recommended environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Important:

- never expose the service role key to client-side code
- keep generated types out of manual editing
- use migrations for schema changes instead of dashboard-only changes

Deliverable:

- the app can connect to Supabase locally without replacing product behavior yet

Current state:

- local Supabase CLI project is initialized under `supabase/`
- local Supabase stack runs through Docker
- `.env.local` contains the local public Supabase URL and anon/publishable key
- generated TypeScript database types live in `lib/database.types.ts`
- no service role key is exposed to client-side code

---

## Phase 1: Identity and Buyer Profile Foundation

Status: Complete locally

Create the first user-owned tables:

- `profiles`
- `preference_profiles`
- `preference_profile_brands`

Purpose:

- connect Supabase Auth users to Rev Matched app profiles
- persist Define-stage preferences
- avoid storing multi-select brand preferences as comma-separated strings

Key decisions:

- use UUID primary keys
- reference `auth.users.id` from `profiles.auth_user_id`
- allow one active preference profile per user for MVP
- keep preference fields flexible enough for current Define flow

Minimum validation:

- a user can have one profile
- a user can create or update their preferences
- brand preferences can be added and removed
- users cannot access another user's preferences

Deliverable:

- Define-stage data can be saved and loaded from Supabase

Completed implementation:

- Supabase Auth is wired to the existing sign-up, sign-in, and sign-out flow.
- Sign-up creates a local Supabase Auth user and saves a matching `profiles` row.
- User names are stored in `profiles.display_name`.
- The current logged-in user name is shown in the app chrome.
- Define preferences load from the active Supabase preference profile when a Supabase session exists.
- Define preferences save to Supabase through:
  - `preference_profiles`
  - `preference_profile_brands`
- Local UI behavior is preserved for unauthenticated or local-only use.
- RLS/user separation was confirmed with local smoke tests and manual two-user testing.

Phase 1 local validation:

- `supabase db reset` applies the Phase 1 migration cleanly.
- `supabase/tests/phase1_profile_preferences_rls_smoke.sql` confirms users can access their own profile/preferences and cannot access another user's records.
- `scripts/phase1ProfilePreferencesSmoke.ts` confirms the typed helper functions work with a signed-in local Supabase user.
- Manual testing confirmed one user's Define preferences do not appear for another signed-in user.

Still local/mock after Phase 1:

- Discover inventory still reads mock car data from `lib/cars.ts`.
- Discover, Match, Liked, Top Pick, notes, compare state, and car progress are still local app state.
- Admin ingestion screens still use mock ingestion data.
- No listing ingestion tables exist yet.
- No `normalized_listings` table exists yet.
- No remote Supabase project has been pushed.

---

## Phase 2: Listing Source and Raw Ingestion Foundation

Status: Next recommended phase

Create ingestion source tables:

- `listing_sources`
- `ingestion_runs`
- `raw_listings`
- `raw_listing_images`

Purpose:

- track where imported listings came from
- preserve source data before normalization
- make ingestion runs inspectable
- support later debugging, attribution, and stale-listing checks

Key decisions:

- preserve source URLs and source identifiers when available
- store raw title, raw price, raw mileage, raw location, raw body text, and raw contact clues
- track `fetched_at`
- track ingestion run status
- avoid making raw listings buyer-visible

Minimum validation:

- an ingestion run can own many raw listings
- raw listings retain source attribution
- raw listing images stay associated with the raw listing
- admin users can inspect raw records
- normal buyers cannot query raw ingestion tables

Deliverable:

- external inventory can be stored without needing to be trusted or shown yet

---

## Phase 3: Normalized Buyer-Facing Inventory

Status: Not started

Create the main inventory table:

- `normalized_listings`

Optional if needed immediately:

- `normalized_listing_images`

Purpose:

- provide the canonical buyer-facing listing record for Discover, Match, Liked, Top Picks, and comparison flows
- support recommendation eligibility and buyer visibility
- separate normalized values from raw source text

Recommended stored fields:

- normalized title fields
- `brand_name`
- `model_name`
- `year`
- `price_amount`
- `mileage_value`
- `body_type`
- `fuel_type`
- `transmission_type`
- `location`
- `seller_type`
- `availability_status`
- `recommendation_state`
- `is_buyer_visible`
- `buyer_visibility_reason`
- `review_status`
- `source_listing_url`
- `raw_listing_id`
- timestamps

Recommended derived fields:

- display title
- formatted price
- formatted mileage
- UI explanation summaries
- broad match confidence text

Minimum validation:

- a normalized listing can reference a raw listing
- buyer-facing queries can exclude hidden, stale, rejected, or review-blocked listings
- normalized listings can support the existing matching logic
- buyer display values can be generated without losing normalized numeric fields

Deliverable:

- Discover can read from real normalized inventory

---

## Phase 4: Admin Review and Trust Workflow

Status: Not started

Create admin operation tables:

- `listing_review_records`
- `listing_review_reasons`
- `listing_duplicate_warnings`
- `listing_duplicate_warning_members`

Purpose:

- support human review of uncertain listings
- record why listings are blocked, approved, hidden, or softened
- preserve duplicate-review context
- make listing trust operational instead of implicit

Key decisions:

- keep review status separate from buyer interaction state
- keep duplicate warnings inspectable without automatically deleting listings
- use review reasons for traceability
- allow soft recommendation restrictions without fully hiding every imperfect listing

Minimum validation:

- an admin can approve, reject, hide, or mark a listing for review
- review reasons can be attached to a review record
- duplicate warnings can group multiple normalized listings
- buyer-facing inventory respects review and visibility state

Deliverable:

- admin review decisions can influence buyer-facing visibility

---

## Phase 5: Buyer Interaction Storage

Status: Not started

Create buyer relationship tables:

- `buyer_listing_interactions`
- `buyer_listing_notes`

Purpose:

- store user-specific relationship state with listings
- support Like, Pass, Top Pick, notes, and comparison workflows
- keep user actions out of the listing table

Recommended fields for `buyer_listing_interactions`:

- `id`
- `profile_id`
- `normalized_listing_id`
- `liked_at`
- `passed_at`
- `is_top_pick`
- `top_pick_added_at`
- `last_viewed_at`
- `created_at`
- `updated_at`

Recommended fields for `buyer_listing_notes`:

- `id`
- `profile_id`
- `normalized_listing_id`
- `body`
- `created_at`
- `updated_at`

Minimum validation:

- a user can Like a listing
- a user can Pass a listing
- a user can promote a Liked listing to Top Pick
- Top Picks remain limited to the product rule
- a user cannot see or modify another user's interactions or notes

Deliverable:

- Liked, Passed, Top Pick, and Compare behavior can persist across sessions

---

## Phase 6: Buyer-Safe Inventory View

Status: Not started

Create a view or query layer for buyer-facing inventory.

Possible view:

- `buyer_visible_listings`

Purpose:

- keep messy ingestion/admin state away from normal buyer queries
- expose only listings that are safe enough for buyer-facing surfaces
- centralize visibility logic before the app spreads it across many pages

The view should likely include:

- normalized listing display fields
- recommendation state
- availability state
- buyer visibility state
- source attribution fields that are safe to expose

The view should likely exclude:

- raw source body text
- admin notes
- hidden listings
- listings blocked from buyer discovery
- attribution-sensitive records

Minimum validation:

- Discover can use the buyer-safe view
- admin-only fields are not exposed through buyer queries
- broad exploration and high-confidence recommendations can still apply different filters

Deliverable:

- buyer-facing inventory queries become simpler and safer

---

## Phase 7: Seed Data and Migration Verification

Status: Not started

Create seed data for:

- one admin profile
- one buyer profile
- one preference profile
- several listing sources
- one ingestion run
- several raw listings
- several normalized listings
- review examples
- duplicate warning examples
- buyer interaction examples

The seed data should include:

- a clean high-confidence listing
- a listing missing a key field
- a stale or unavailable listing
- a duplicate/repost candidate
- a hidden or review-required listing
- a buyer Liked listing
- a buyer Passed listing
- three Top Picks

Minimum validation:

- migrations run from a clean database
- seeds run without manual dashboard edits
- app pages can load realistic data states
- RLS policies do not block legitimate app behavior
- RLS policies do block cross-user access

Deliverable:

- a repeatable local database state for development

---

## Phase 8: Application Integration Order

Status: Not started

Recommended integration sequence:

1. Connect Supabase client and server utilities.
2. Load normalized listings into Discover.
3. Persist Define preferences.
4. Persist Like, Pass, and Top Pick interactions.
5. Persist notes.
6. Move admin ingestion views from mock data to Supabase.
7. Use buyer-safe listing queries for recommendation surfaces.
8. Generate Supabase TypeScript types and replace local duplicate types where practical.

Important:

- do not migrate every screen at once
- keep local fallback data only if it helps development
- remove mock data gradually after the equivalent database path works

Deliverable:

- the app can complete the current buyer journey using real database state

---

## Phase 9: Deferred Tables

Status: Later

Defer until the ingestion-backed buyer flow is stable:

- `owned_vehicles`
- `owned_vehicle_events`
- `listing_claims`
- `vehicles`
- `native_listings`
- seller CRM tables
- ML scoring tables
- deep media rights tables
- full audit/event-sourcing tables

Why defer:

- these are important, but not required for the first working database-backed discovery flow
- building them too early could harden assumptions before real listing and buyer behavior teaches the product what it needs

Deliverable:

- future schema room without first-milestone table sprawl

---

## First Migration Checklist

Use this order when beginning real schema work:

- [ ] `profiles`
- [ ] `preference_profiles`
- [ ] `preference_profile_brands`
- [ ] `listing_sources`
- [ ] `ingestion_runs`
- [ ] `raw_listings`
- [ ] `raw_listing_images`
- [ ] `normalized_listings`
- [ ] `listing_review_records`
- [ ] `listing_review_reasons`
- [ ] `listing_duplicate_warnings`
- [ ] `listing_duplicate_warning_members`
- [ ] `buyer_listing_interactions`
- [ ] `buyer_listing_notes`
- [ ] buyer-safe listing view
- [ ] RLS policies
- [ ] seed data
- [ ] generated TypeScript types

---

## Before Writing SQL

Resolve these decisions:

- whether enum values should be Postgres enums, lookup tables, or text with app validation
- exact Top Pick constraint strategy
- whether `normalized_listing_images` is needed immediately
- whether recommendation reasons should be stored directly on `normalized_listings` or in a child table
- admin role strategy for RLS
- whether local mock IDs need a migration map to UUIDs

---

## Completion Criteria

The first database implementation is complete when:

- migrations can recreate the database from scratch
- seed data can recreate a useful development state
- buyers can save preferences
- buyers can browse buyer-visible inventory
- buyers can Like, Pass, and Top Pick listings
- admin users can inspect ingestion and review state
- raw ingestion tables are not exposed to normal buyers
- the app no longer depends on local mock data for the core buyer journey

---

## Closing Principle

Build the database as the product's trust layer.

The schema should make it easy to tell the difference between:

- source data and normalized data
- listings and vehicles
- system recommendations and user choices
- buyer-visible inventory and admin-only uncertainty
- the current MVP and the larger ownership/seller platform Rev Matched can become
