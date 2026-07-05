# Duplicate Candidate Reporter

## Purpose

The duplicate candidate reporter is a local dry-run utility for finding possible duplicate vehicle listings.

It supports RevMatched's marketplace trust work by identifying listings that may represent the same car before any admin, buyer-facing, or schema-level duplicate workflow exists.

## What It Does

The reporter:

- reads normalized listings from local Supabase
- joins available raw listing contact/title data
- joins normalized listing image URLs
- compares listings inside broad make/model/year clusters
- computes deterministic duplicate signals
- prints possible duplicate candidate pairs
- recommends `review_possible_duplicate`

It does not write to the database.

It does not merge listings.

It does not hide listings.

It does not change buyer-facing behavior.

## How To Run

Run:

```bash
npm run report:duplicate-candidates
```

The reporter expects local Supabase to be running and `.env.local` to contain:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

The reporter refuses to run against non-local Supabase URLs.

## Why Dry-Run Only

Duplicate detection is judgment-sensitive.

Two listings can look similar because they are the same car, or because Trinidad marketplace inventory often contains many similar vehicles, especially Toyota Axio, Nissan Note, and dealer-import units.

For MVP safety, the reporter only produces review candidates. An admin should inspect possible duplicates before any future merge, hide, or canonical-listing decision.

## Signals Used

The reporter uses explainable deterministic signals:

- same `source_listing_id`: very high confidence
- same image URL: high confidence
- same seller/contact text where available: high confidence
- same make/model/year: medium confidence
- exact mileage: medium-high confidence
- close mileage: medium confidence
- price within 5 percent: supportive
- same location: supportive
- low normalization confidence: reduces duplicate confidence
- ambiguous model identity: reduces duplicate confidence

Signals are combined into a duplicate confidence score between `0` and `0.95`.

## How To Interpret Confidence

Confidence is not proof.

It means the pair has enough overlapping evidence to deserve review.

Suggested interpretation:

- `0.80+`: strong possible duplicate; inspect first
- `0.60-0.79`: likely enough overlap for review
- `0.50-0.59`: weak but still worth checking
- below `0.50`: not reported

## Why Admin Review Is Required

The reporter intentionally recommends:

`review_possible_duplicate`

instead of auto-merging.

Admin review is required because:

- dealers may list multiple similar units
- mileage can be missing or copied incorrectly
- titles often use shorthand
- prices can change between reposts
- one seller may have many vehicles
- image reuse can happen accidentally or through dealer templates

The safe MVP behavior is to surface possible duplicates for moderation, not make irreversible inventory decisions.

## How This Supports Marketplace Trust

Duplicate intelligence helps RevMatched:

- reduce repeated buyer cards
- protect buyer confidence
- avoid inflated inventory counts
- identify dealer repost behavior
- preserve source records for audit
- prepare for future canonical listing workflows

This is a bridge toward stronger marketplace moderation without overbuilding the first version.

## Future Improvements

Possible future additions:

- a `listing_duplicate_reviews` table
- admin review UI for possible duplicates
- duplicate status: `possible`, `confirmed`, `dismissed`
- canonical listing selection
- cross-source duplicate grouping
- image perceptual hashing
- phone/contact normalization at ingestion time

Those should come after the dry-run reporter has proven useful on local and real marketplace data.
