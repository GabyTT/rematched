# RevMatched Data Dictionary

This document defines the current and near-future domain structure for RevMatched based on the existing app experience and the product direction implied by the current flows.

It is intentionally focused on business entities and meaning, not database-specific implementation.

## 1. Core Entities

### Vehicle Listing
A vehicle listing is the core inventory object shown throughout Define, Discover, Liked, Top Picks, and comparison flows.

It represents a single car that a user can browse, like, pass, shortlist, compare, and inspect in more detail.

Key responsibilities:
- power matching and filtering
- provide inventory details for browsing
- support comparison and selection workflows
- act as the anchor object for user interaction state

### User
A user represents the person moving through the RevMatched journey.

In the current app, user identity is lightweight and partially session-based, but the product direction suggests a fuller user profile over time.

Key responsibilities:
- own preferences
- own car interaction history
- own notes, shortlist state, and saved journey progress

### Preference Profile
A preference profile captures what a user says they want in a vehicle.

In the current product this includes:
- budget range
- vehicle type
- preferred brands
- preferred model text

Future direction suggests this profile may also include:
- lifestyle-based guidance output from the car-type wizard
- financing comfort range
- ownership goals or timeline

### Vehicle Interaction
A vehicle interaction records how a user has responded to a specific vehicle listing.

Current examples:
- liked
- passed
- top pick / shortlisted
- notes added

This is a user-to-vehicle relationship, not a vehicle attribute.

### Comparison Set / Top Picks
A comparison set is the small shortlist of vehicles a user is actively evaluating side by side.

In the current app:
- this is capped at 3 vehicles
- these are called Top Picks
- order matters because “earliest Top Pick” can be replaced

### Vehicle Note
A vehicle note is user-authored context attached to a specific vehicle.

Purpose:
- preserve impressions
- remember follow-up checks
- support later comparison and decision-making

### Care / Garage Vehicle
In Life Together, a vehicle can move from “listing under consideration” into a garage-style ownership object used for maintenance and lifecycle management.

This is conceptually separate from a marketplace listing, even though the current app seeds some of it from matched cars.

### Service / Support Provider
A provider is a business or organization that supports post-purchase needs.

Current examples:
- service centers
- tyre shops
- battery specialists
- insurance providers
- licensing / inspection support

### Sponsored Placement
A sponsored placement is promotional content inserted into browsing or support experiences.

It is not a vehicle listing, but it participates in the discovery UI.

## 2. Vehicle Listing Fields

These are the current and recommended business fields for a vehicle listing.

| Field | Meaning |
|---|---|
| `listing_id` | Unique identifier for the vehicle listing shown in RevMatched. |
| `display_name` | User-facing combined title, such as year + make/brand + model. |
| `year` | Model year of the vehicle. |
| `brand_name` | Consumer-facing brand/manufacturer name. |
| `model_name` | Model or series name. |
| `vehicle_type` | Canonical type used for matching and filtering, such as sedan, hatchback, compact SUV, pickup, van. |
| `category_label` | User-facing merchandising/category label, such as “Luxury SUV” or “City hatchback.” |
| `price_amount` | Numeric asking price used for matching, filtering, and sorting. |
| `price_display` | Formatted display string for UI, such as `$148,000 TTD`. |
| `mileage_value` | Odometer value, ideally numeric. |
| `mileage_display` | Display-ready mileage string if formatting is preserved separately. |
| `fuel_type` | Fuel/powertrain label, such as gasoline, diesel, hybrid, EV. |
| `transmission_type` | Transmission label, such as automatic, manual, CVT. |
| `location_label` | User-facing location text for where the vehicle is available. |
| `primary_image_url` | Main image shown in cards and comparison views. |
| `availability_status` | Whether the listing is currently browseable/active. |

Recommended business distinction:
- `vehicle_type` should drive logic
- `category_label` should drive user-facing merchandising language

## 3. User Interaction / Status Fields

These fields describe how a user has interacted with a vehicle.

They belong to a user-to-vehicle relationship, not the vehicle itself.

| Field | Meaning |
|---|---|
| `user_id` | The user who performed the interaction. |
| `listing_id` | The vehicle listing the interaction refers to. |
| `journey_state` | Current status of the listing for the user. |
| `note_text` | Freeform user note attached to that vehicle. |
| `top_pick_added_at` | Timestamp for when the vehicle was promoted into Top Picks. |
| `liked_at` | Optional timestamp for when the user first liked the vehicle. |
| `passed_at` | Optional timestamp for when the user passed on the vehicle. |
| `last_interacted_at` | Most recent interaction timestamp for sorting/history. |

Current user-facing states in the app:
- unreviewed
- liked
- passed
- top pick

Potential future relationship fields:
- `source_surface` (Discover, Explore More, Liked, Compare, etc.)
- `interaction_reason`
- `viewed_details_at`
- `compare_added_at`

## 4. Enumerations

These are the business enums suggested by the current app.

### Vehicle Type
Current and roadmap-aligned values may include:
- `sedan`
- `hatchback`
- `compact_suv`
- `large_suv`
- `pickup`
- `van`
- `wagon`
- `coupe`
- `luxury`

Note:
The app currently mixes user-facing types and looser category groupings. Over time, this should become a curated enum with a stable canonical set.

### Journey State
- `unseen`
- `liked`
- `passed`
- `top_pick`

Current implementation language uses:
- `liked`
- `rejected`
- `matched`
- `null`

Recommended business naming:
- `passed` instead of `rejected`
- `top_pick` instead of `matched`

### Availability Status
Potential values:
- `active`
- `inactive`
- `sold`
- `unavailable`

### Fuel Type
Potential values:
- `gasoline`
- `diesel`
- `hybrid`
- `electric`
- `plug_in_hybrid`
- `other`

### Transmission Type
Potential values:
- `automatic`
- `manual`
- `cvt`
- `dual_clutch`
- `other`

### Provider Type
Potential values:
- `service_centre`
- `mechanic`
- `tyre_shop`
- `battery_specialist`
- `insurance_provider`
- `insurance_broker`
- `inspection_centre`
- `licensing_support`

## 5. Stored vs Derived Fields

Some values should be persisted directly. Others should be derived for display or ranking.

### Best stored directly
- `listing_id`
- `year`
- `brand_name`
- `model_name`
- `vehicle_type`
- `category_label`
- `price_amount`
- `mileage_value`
- `fuel_type`
- `transmission_type`
- `location_label`
- `primary_image_url`
- `availability_status`
- `journey_state`
- `note_text`
- `top_pick_added_at`

### Best derived or generated
- `display_name`
  - can be composed from year + brand + model
- `price_display`
  - should usually be formatted from `price_amount`
- `mileage_display`
  - should usually be formatted from `mileage_value`
- `is_top_pick_full`
  - derived from how many Top Picks the user currently has
- `confidence_score`
  - derived from recommendation logic
- `best_match_vehicle_type`
  - derived from the guided car-type scoring wizard

### Potentially stored later if product needs it
- recommendation results from the vehicle-type wizard
- onboarding snapshots
- search query history
- explanation bullets generated from user answers

## 6. Future Normalization Opportunities

The app is still early, so some denormalization is reasonable. These are the most likely places to normalize later.

### Brand / Make
Current app data has both `make` and `brand`.

Future opportunity:
- introduce a canonical `brand` entity
- avoid duplicate text fields for the same concept

### Model
If inventory grows, `model_name` may eventually belong in a separate model table related to brand.

### Vehicle Type / Category
These should eventually become structured reference data:
- canonical type enum or reference table for matching
- separate merchandising labels for UI display

### Location
If location becomes operationally important:
- move from free text to a structured location entity
- support region/city/dealer relationships

### Vehicle Images
Today there is one image URL.

Future opportunity:
- image table for multiple photos
- support ordering, alt text, primary/secondary flags

### User Vehicle Interaction
This is a strong candidate for a dedicated relationship table:
- one row per user per listing
- stores liked/passed/top-pick state, notes, timestamps

### Preference Profile
Preferences currently live as a small object, but can become a more formal profile:
- budget preferences
- vehicle preferences
- wizard outputs
- evolving onboarding answers

### Garage Vehicle vs Marketplace Listing
Life Together suggests a future split between:
- a marketplace listing being considered
- a real owned vehicle in a garage/ownership domain

That likely becomes a separate `garage_vehicle` or `owned_vehicle` entity later.

### Providers
Providers are currently local dummy content, but they naturally form their own business entity with:
- provider profile
- service categories
- geography
- featured/sponsorship metadata

## Recommended Domain Direction

If RevMatched continues growing, the most stable medium-term structure is:

- `vehicle_listing`
- `user`
- `user_preference_profile`
- `user_vehicle_interaction`
- `garage_vehicle`
- `service_provider`
- `sponsored_placement`

This keeps the marketplace journey, user decision state, and ownership/support journey clearly separated while still allowing them to connect cleanly.
