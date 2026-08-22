# Rev Matched — Ingestion and Admin Process

## Purpose

This is the operational source of truth for how a vehicle moves from an external source into Rev Matched, through admin work, and eventually to buyers.

It separates two things that must not be confused:

1. **Ingestion:** the system collects, preserves, and interprets source data.
2. **Admin and seller process:** a person verifies the record, contacts the seller, obtains approved pics, and decides whether to make it live.

## The Whole Process

```text
INGESTION
Source fetch
→ Raw source record
→ Normalization
→ Quality checks
→ Imported (admin-only)

ADMIN AND SELLER PROCESS
Imported
→ Verified
→ Seller Contacted
→ Pics Received
→ Live
```

The non-negotiable rule is:

> **Ingestion can create an Imported record. It can never make a listing live.**

Only the admin and seller process can make a listing buyer-visible.

## Part One — Ingestion

### 1. Confirm the source is permitted

Before a source is connected beyond a private local test, decide and document:

- permitted method of access
- source attribution to show to buyers
- stable source listing ID
- refresh schedule
- whether source images may be previewed or republished
- what happens when a listing disappears or changes

The current TriniCarsForSale adapter is a limited local-development test. It is not a production or scheduled source connection.

### 2. Fetch source data

The adapter collects what the source publicly presents for that listing, including where available:

- source name, listing URL, and stable source ID
- title, price, description, and visible vehicle fields
- source contact text for admin review only
- image URLs
- source-posted date, fetch date, and refresh date

The source URL remains the reference point for the admin to compare the Rev Matched record with the original post.

### 3. Preserve the raw record

Store the source information before making assumptions about it.

Raw data is kept so Rev Matched can:

- audit what the source actually said
- fix a parser without losing the original information
- explain doubts during admin review
- improve the normalizer over time

Re-running the same source listing should update the same raw record using its source and stable source ID, not create a duplicate raw record.

### 4. Normalize the useful fields

The normalizer creates clean fields such as:

- year, brand, model, and title
- numeric price and mileage where recoverable
- source Features and Additional Info as admin-only evidence; the seller still confirms any information that may later appear to buyers
- availability, seller, and vehicle details where supported
- source attribution and source dates
- a confidence score and a system doubt note

The normalizer must not invent missing values. When the source is unclear, preserve the raw text, leave the clean field missing, and explain the uncertainty for the admin.

### 5. Run quality checks

Before a record becomes available for review, check for:

- missing or conflicting core fields
- low confidence or a system doubt
- possible duplicates
- source listings that are sold, unavailable, or stale
- image permission and preview rules

These checks guide admin attention. They do not publish a listing.

### 6. Create an Imported listing

After normalization, the listing enters Rev Matched as **Imported**.

At this point it is:

- visible to admins only
- linked to its source URL and source information
- available for source comparison and correction
- not available to buyers
- not permission to contact the seller automatically
- not permission to use source photographs as buyer-facing images

## Part Two — Admin and Seller Process

### Main workflow

```text
Imported → Verified → Seller Contacted → Pics Received → Live
```

| Step | What it means | Main admin action |
| --- | --- | --- |
| **Imported** | The system has created an admin-only record. | Compare it with the source and verify or correct it. |
| **Verified** | The core listing fields have been checked. | Confirm the source is still active, then contact the seller. |
| **Seller Contacted** | Seller outreach and follow-up are in progress. | Record the result and manage the next follow-up date. |
| **Pics Received** | The seller has agreed and supplied pics for Rev Matched. | Check the pics and make the final go-live decision. |
| **Live** | The listing is visible to buyers. | Continue to monitor availability and retire it when needed. |

### Imported → Verified

The admin opens the source alongside the Rev Matched record and checks the essential facts:

- title, year, brand, model, and price
- source contact and contact name when captured
- availability and source dates
- saved source image for admin comparison
- confidence and any system doubt note

The admin either corrects missing or wrong details, or checks the information as accurate. Once the required checks are complete, the listing becomes **Verified**.

Verification means the record is accurate enough to work with. It does **not** mean the seller has agreed to participate or that the car is visible to buyers.

### Verified → Seller Contacted

Before contact, the admin opens the source in the right-hand panel to confirm that the source listing still appears active.

The admin then records:

- contact method, such as call or WhatsApp
- contact date
- seller outcome
- notes that help the next admin follow-up

Within the **Seller Contacted** stage:

- **Seller agreed:** record the expected date for pics. The default follow-up is the next day, and the admin may override it.
- **No response:** keep the listing in Seller Contacted and set the default retry date to the next day.
- **Seller declined:** stop this path and retain the record for admin history.
- **Sold / unavailable:** retire the listing from active work.

### Seller Contacted → Pics Received

Move a listing to **Pics Received** only after the seller has supplied pics for Rev Matched or has otherwise approved the assets to use.

Source-site pictures are not a substitute for seller-approved buyer-facing pics. They may be used only within the agreed admin-preview rules.

### Pics Received → Live

Before going live, the admin confirms:

- the seller has agreed to participate
- the listing is still available
- approved pics are present
- buyer-facing details are complete enough to be trustworthy
- at least one seller-confirmed public contact method is present and will be shown to buyers
- the listing is not a duplicate or otherwise blocked

Selecting **Go live** makes the listing visible to buyers.

## Exception and Cleanup States

These outcomes are retained for admin understanding. They must not be treated as successful live inventory.

| State | Meaning |
| --- | --- |
| **No response** | Follow-up is still needed; it remains within Seller Contacted. |
| **Seller declined** | The seller does not wish to participate. Keep the admin history; do not publish. |
| **Sold / unavailable** | The source or seller indicates that the vehicle is no longer available. Retire it. |
| **Hidden / on hold** | Keep the record out of buyer discovery while an issue is investigated. |
| **Retired** | Removed from active workflow and buyer discovery, while preserving the admin record. |

## Refresh and Ongoing Cleanup

Ingestion does not end when a record is imported. Each source refresh should:

- update the raw source record using the stable source ID
- record the refresh time
- detect changed price, availability, or key details
- flag a changed record for admin attention where necessary
- never silently turn a retired or hidden record live

Admins should periodically review:

- failed ingestion runs
- low-confidence or doubtful records
- duplicate candidates
- listings due for seller follow-up
- stale, sold, unavailable, hidden, and retired records

## Current Scope and Guardrails

For the current local testing phase:

- TriniCarsForSale ingestion is limited and manual.
- Public contact information is stored for admin review only.
- No automated seller messaging is permitted.
- Source image URLs may be used for local admin comparison only under the current test rules.
- A seller must provide or approve buyer-facing pics before a listing can go live.
- Buyer views receive only clean, buyer-safe listing information and source attribution.

### Admin ingestion console

The Admin → **1. Ingest** screen is the operational starting point. It imports external source listings into Rev Matched and hands successful records to **2. Process cars** as Imported records.

The screen must answer, quickly:

1. Which ingestion mode is active?
2. Which source and source-listing date will be used?
3. Which ingestion action can be run?
4. Is a run in progress, complete, or failed?
5. Where can detailed run results be reviewed?
6. How does the admin continue to Imported listing processing?

It must not publish listings, contact sellers, or activate a scheduler as part of ingestion.

### Ingestion modes

#### Manual — default during testing

Manual is the default working mode. Selecting it saves the mode immediately and clearly marks it as **Active**; there is no separate save button.

In Manual mode:

- the source-listing date is editable and defaults to the current local Trinidad and Tobago date
- the admin may choose today or an earlier date, never a future date
- the date means **import listings posted on this exact date**, not listings posted on or after that date
- two actions are available:
  - **Import 5 test listings** — the primary testing action
  - **Import all listings for this date** — a secondary action

Both actions store and normalize successful records as Imported, keep them hidden from buyers, and create or update an ingestion-run history record. Each action requires confirmation before starting.

#### Automatic daily — future workflow only

Automatic daily is visible so the future workflow can be designed, but it is not an active scheduler.

When selected:

- it is visibly selected and immediately shows a **Coming soon** message
- it must not claim that a scheduled run is active or start one
- the listing-date field becomes read-only and explains that the current day will be used automatically
- the two Manual ingestion actions are hidden
- a future time-of-day control remains visible, with a default of **12:00 AM**

The future intended behaviour is one full run per day at the selected local time, using that day’s exact listing date. It cannot be enabled until both the approved source arrangement and the real scheduled worker exist.

### Manual ingestion actions

#### Import 5 test listings

This is the limited test action. It imports no more than five source listings posted on the selected exact date.

Before starting, the admin confirms wording such as:

> Import up to 5 test listings posted on July 23, 2026?

#### Import all listings for this date

This is the full manual daily action. It imports all available source listings posted on the selected exact date.

Before starting, the admin confirms wording such as:

> Import all listings posted on July 23, 2026?

### Run state and feedback

While either manual action is running:

- show an indeterminate circular progress indicator
- show **Importing listings…** without a percentage
- disable both actions
- prevent a second run from starting

After success, show only **Import complete**. Detailed counts belong in Run History.

If one or more usable Imported records exist, also show **Process imported listings**. It opens the existing Imported listing-processing workspace and shows all listings currently in the Imported stage, not merely those from the latest run.

If a run produces no usable Imported records because everything was skipped, duplicated, or failed, do not show the processing action.

After failure, show **Import failed. View run history for details.** and provide a **Try again** action.

### Run History

Run History is the detailed audit view for each ingestion run. It may show:

- source
- start and completion times
- run type: Test or Full
- selected source-listing date
- records fetched
- records normalized or imported
- records skipped
- duplicates
- errors and warnings
- run status
- other technically accurate implementation details

The main ingestion console should not repeat all of these metrics in its success message.

### Handoff to Imported listing processing

The existing listing-processing workflow is not redesigned by ingestion work. The handoff opens all current **Imported** listings.

When grouping is added to the existing Imported screen, the rules are:

- group by individual ingestion run, never merely by date
- make each run group collapsible, with the newest expanded by default
- allow Newest first and Oldest first group ordering
- keep the source-site order within each run group
- reuse the existing listing cards

Each group heading shows the run date and time, Test run or Full run, source name, and Imported count. It shows errors or duplicates only when those values are greater than zero.

### Current implementation gap — July 24, 2026

The agreed console above is the target workflow. The current local TriniCarsForSale implementation is deliberately more limited:

- Manual mode is stored in `listing_sources` immediately when selected; there is no separate save action.
- Automatic daily is only a saved preference. It shows a Coming soon popup and has no scheduler.
- Manual mode lets the admin select a current or past source-listing date, then choose the red primary **Import 5 test listings** action or the quieter **Import all listings for this date** action. Either choice first performs a read-only source check: it fetches source detail pages, counts cars whose captured Date Added matches the selected day, and shows that count before any import can be confirmed. The test action imports the five oldest matching source IDs returned by the check; the full action imports every matching source ID returned by the check. The check stops only after it reaches an earlier source date, relying on the source's current newest-first listing order, and limits itself to the newest three pages so a manual check cannot crawl the entire marketplace. If it cannot safely finish the count within that boundary, it does not offer an import. Confirmed imports show **Importing listings…** with a spinner, then **Import complete** with a route to Process imported listings after success, or **Import failed** with links to Run history and Try again after failure.
- A later **full** import for the same source-listing date compares its complete source-ID set with earlier full imports for that date. A previously seen ID that is now absent is flagged **Source no longer found — review needed** on its admin card. Rev Matched never deletes, retires, or automatically hides that listing; the admin decides whether it is sold, unavailable, or should remain active. Test-five imports never perform this comparison because they are intentionally incomplete.
- The current normalizer processes the source's current stored raw records; it does not yet limit normalization to records posted on the chosen date.
- **To do — clarify Run History normalization counts:** the current `Normalized` total can include older saved source records that were refreshed during the run, not only the records fetched by that run. Change the history display and stored metrics to distinguish newly normalized records from refreshed existing records.
- The Admin Overview reads the same local database data used by Process Cars and Run History, but it is an operational summary rather than a second workflow workspace. It offers a contextual Imported-review action, compact Today at a glance counts, a compact linked five-stage snapshot, and one Latest ingestion summary. The full interactive pipeline remains only on Process Cars. When there are no runs after a reset, Overview shows a calm no-run state instead of sample data. Its New imports card currently uses the stored fetch timestamp because a separate immutable first-import timestamp does not yet exist.
- `ingestion_runs` now records the confirmed manual run type, selected source-listing date, source count found before confirmation, and the selected source listing IDs. Run History keeps its table compact and shows those IDs in an on-demand detail popup. It does not yet record skipped count or a general warning count.
- The existing Imported workspace filters by workflow stage but does not yet group cards by ingestion run or preserve a per-run source ordering.

These gaps are intentional implementation work and must be completed one feature at a time, with approval after each feature.

## Related Documents

- [Controlled Ingestion Adapter](./controlled-ingestion-adapter.md) — commands and adapter guardrails.
- [Admin Ingestion Workflow](./admin-ingestion-workflow.md) — screen and operating guidance for admin work.
- [Admin Review Checklist](./admin-review-checklist.md) — the field-by-field verification checklist.
- [Listing Ingestion Product Notes](./listing-ingestion-product-notes.md) — broader product and data strategy.
- [Buyer Inventory Visibility Rules](./buyer-inventory-visibility-rules.md) — rules for buyer-facing inventory.
