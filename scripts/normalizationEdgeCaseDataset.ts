export type ExpectedNormalizedListing = {
  body_type: string | null;
  brand_name: string | null;
  buyer_visibility_reason: string;
  contact_method: string | null;
  duplicate_group_id?: string;
  expected_duplicate_behavior?: string;
  import_status: string | null;
  is_buyer_visible: boolean;
  location_label: string | null;
  mileage_value: number | null;
  model_name: string | null;
  normalization_confidence: number;
  price_amount: number | null;
  recommendation_state: "eligible" | "limited" | "review_required" | "hidden";
  review_status: "approved" | "needs_review" | "rejected";
  seller_type: string | null;
  title: string;
  year: number | null;
};

export type EdgeCaseRawListing = {
  id: string;
  category:
    | "duplicate"
    | "missing_fields"
    | "formatting"
    | "whatsapp_only"
    | "dealer_repost"
    | "low_confidence"
    | "image_issue";
  scenario: string;
  source: "manual_edge_case";
  raw: {
    contact: string | null;
    description: string | null;
    fuel: string | null;
    id: string;
    images: string[];
    location: string | null;
    mileage: string | null;
    price: string | null;
    seller: string | null;
    title: string | null;
    transmission: string | null;
    trim: string | null;
    url: string;
  };
  expected: ExpectedNormalizedListing;
  notes: string;
};

export const normalizationEdgeCaseDataset: EdgeCaseRawListing[] = [
  {
    id: "edge-001",
    category: "formatting",
    scenario: "Messy but recoverable Axio listing with local shorthand",
    source: "manual_edge_case",
    raw: {
      id: "edge-001",
      url: "manual://revmatched/edge-cases/edge-001",
      title: "TOYOTA AXIO 2016 PDZ HYBRID - very clean!!",
      description:
        "One owner. Lady driven. Transfer included. Price slightly negotiable.",
      price: "$90k neg",
      location: "Arima / East",
      contact: "Call or WhatsApp 868-555-1101",
      seller: "Private sale",
      mileage: "128000km",
      fuel: "hyb",
      transmission: "auto",
      trim: "PDZ",
      images: [
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "TOYOTA AXIO 2016 PDZ HYBRID - very clean!!",
      price_amount: 90000,
      year: 2016,
      brand_name: "Toyota",
      model_name: "Axio",
      body_type: "sedan",
      mileage_value: 128000,
      location_label: "Arima / East",
      seller_type: "private",
      contact_method: "whatsapp",
      import_status: "local_used",
      review_status: "approved",
      recommendation_state: "eligible",
      is_buyer_visible: true,
      buyer_visibility_reason:
        "Messy formatting, but core buyer fields are recoverable.",
      normalization_confidence: 0.9,
    },
    notes:
      "Tests lowercase/abbreviated price, tight mileage formatting, plate shorthand, fuel shorthand, and mixed call/WhatsApp contact.",
  },
  {
    id: "edge-002",
    category: "duplicate",
    scenario: "Same vehicle reposted with cleaner title and same seller contact",
    source: "manual_edge_case",
    raw: {
      id: "edge-002",
      url: "manual://revmatched/edge-cases/edge-002",
      title: "2016 Toyota Corolla Axio Hybrid PDZ",
      description:
        "Very clean Axio. One owner. Transfer included. Same car reposted with fresh photos.",
      price: "TTD 90,000 negotiable",
      location: "Arima",
      contact: "WhatsApp 555-1101",
      seller: "Private seller",
      mileage: "128,000 km",
      fuel: "Hybrid",
      transmission: "Automatic",
      trim: "PDZ",
      images: [
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "2016 Toyota Corolla Axio Hybrid PDZ",
      price_amount: 90000,
      year: 2016,
      brand_name: "Toyota",
      model_name: "Corolla Axio",
      body_type: "sedan",
      mileage_value: 128000,
      location_label: "Arima",
      seller_type: "private",
      contact_method: "whatsapp",
      import_status: "local_used",
      review_status: "needs_review",
      recommendation_state: "review_required",
      is_buyer_visible: false,
      buyer_visibility_reason:
        "Likely duplicate of edge-001 based on contact, mileage, price, and image overlap.",
      normalization_confidence: 0.92,
      duplicate_group_id: "dup-axio-2016-pdz",
      expected_duplicate_behavior:
        "Keep one buyer-visible canonical listing and flag the duplicate for review.",
    },
    notes:
      "Tests duplicate detection when the title is cleaner but contact, mileage, price, and image overlap strongly.",
  },
  {
    id: "edge-003",
    category: "missing_fields",
    scenario: "Sparse TriniCars-style listing with missing mileage and location",
    source: "manual_edge_case",
    raw: {
      id: "edge-003",
      url: "manual://revmatched/edge-cases/edge-003",
      title: "Toyota Corolla Axio RORO",
      description: "Fresh import. Clean interior. Call for details.",
      price: "TT$110,000",
      location: null,
      contact: "868-555-2202",
      seller: null,
      mileage: null,
      fuel: null,
      transmission: null,
      trim: null,
      images: [
        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "Toyota Corolla Axio RORO",
      price_amount: 110000,
      year: null,
      brand_name: "Toyota",
      model_name: "Corolla Axio",
      body_type: "sedan",
      mileage_value: null,
      location_label: null,
      seller_type: null,
      contact_method: "phone",
      import_status: "roro",
      review_status: "needs_review",
      recommendation_state: "limited",
      is_buyer_visible: true,
      buyer_visibility_reason:
        "Usable listing, but missing year, mileage, seller type, and location.",
      normalization_confidence: 0.69,
    },
    notes:
      "Tests sparse marketplace rows where the listing is still useful but should not be treated as a high-confidence recommendation.",
  },
  {
    id: "edge-004",
    category: "missing_fields",
    scenario: "Missing price should block buyer visibility",
    source: "manual_edge_case",
    raw: {
      id: "edge-004",
      url: "manual://revmatched/edge-cases/edge-004",
      title: "2018 Nissan Note e-Power",
      description: "Very clean. Serious buyers only. Message for price.",
      price: "Inbox for price",
      location: "Chaguanas",
      contact: "WhatsApp only 868-555-3303",
      seller: "Private",
      mileage: "53,263 km",
      fuel: "Hybrid",
      transmission: "Automatic",
      trim: "e-Power",
      images: [
        "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "2018 Nissan Note e-Power",
      price_amount: null,
      year: 2018,
      brand_name: "Nissan",
      model_name: "Note",
      body_type: "hatchback",
      mileage_value: 53263,
      location_label: "Chaguanas",
      seller_type: "private",
      contact_method: "whatsapp",
      import_status: null,
      review_status: "needs_review",
      recommendation_state: "hidden",
      is_buyer_visible: false,
      buyer_visibility_reason:
        "Missing buyer-facing price; hold until price is clarified.",
      normalization_confidence: 0.72,
    },
    notes:
      "Tests that 'Inbox for price' does not become a fake numeric price and does not enter confident discovery.",
  },
  {
    id: "edge-005",
    category: "whatsapp_only",
    scenario: "WhatsApp-only private seller with informal title",
    source: "manual_edge_case",
    raw: {
      id: "edge-005",
      url: "manual://revmatched/edge-cases/edge-005",
      title: "Note 2014 clean clean no issues",
      description:
        "Nissan Note. Cold AC. Buy and drive. WhatsApp only, no calls please.",
      price: "57,000",
      location: "D'Abadie",
      contact: "w/app only 555-4404",
      seller: "owner",
      mileage: "83 000 km",
      fuel: "gas",
      transmission: null,
      trim: null,
      images: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "Note 2014 clean clean no issues",
      price_amount: 57000,
      year: 2014,
      brand_name: "Nissan",
      model_name: "Note",
      body_type: "hatchback",
      mileage_value: 83000,
      location_label: "D'Abadie",
      seller_type: "private",
      contact_method: "whatsapp",
      import_status: "local_used",
      review_status: "approved",
      recommendation_state: "eligible",
      is_buyer_visible: true,
      buyer_visibility_reason:
        "Core fields are recoverable and seller contact channel is clear.",
      normalization_confidence: 0.88,
    },
    notes:
      "Tests WhatsApp shorthand, owner/private seller language, missing transmission, and model inference from title plus description.",
  },
  {
    id: "edge-006",
    category: "dealer_repost",
    scenario: "Dealer repost of a previously seen unit with slight price change",
    source: "manual_edge_case",
    raw: {
      id: "edge-006",
      url: "manual://revmatched/edge-cases/edge-006",
      title: "2018 Toyota Axio RORO SPECIAL",
      description:
        "Dealer unit. Fresh shipment. Financing available. Reposted with new price.",
      price: "89578",
      location: "Piarco",
      contact: "Dealer line 868-555-5505 / WhatsApp available",
      seller: "ABC Auto Imports Dealer",
      mileage: "53,263 KM",
      fuel: "Petrol",
      transmission: "A/T",
      trim: "RORO",
      images: [
        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "2018 Toyota Axio RORO SPECIAL",
      price_amount: 89578,
      year: 2018,
      brand_name: "Toyota",
      model_name: "Axio",
      body_type: "sedan",
      mileage_value: 53263,
      location_label: "Piarco",
      seller_type: "dealer",
      contact_method: "whatsapp",
      import_status: "roro",
      review_status: "needs_review",
      recommendation_state: "review_required",
      is_buyer_visible: false,
      buyer_visibility_reason:
        "Dealer repost pattern should be reviewed before creating a second buyer-facing card.",
      normalization_confidence: 0.92,
      duplicate_group_id: "dup-dealer-axio-2018-roro",
      expected_duplicate_behavior:
        "Prefer latest canonical dealer listing only after duplicate review.",
    },
    notes:
      "Tests dealer reposting, exact mileage reuse, A/T transmission shorthand, and slight price variation.",
  },
  {
    id: "edge-007",
    category: "low_confidence",
    scenario: "Ambiguous Yaris/Belta model naming",
    source: "manual_edge_case",
    raw: {
      id: "edge-007",
      url: "manual://revmatched/edge-cases/edge-007",
      title: "Toyota Yaris / Belta",
      description:
        "Good working condition. Model listed both ways by seller. Call to view.",
      price: "TT $42,500 negotiable",
      location: "San Fernando",
      contact: "868 555 6606",
      seller: "Private",
      mileage: "mileage unknown",
      fuel: null,
      transmission: "automatic",
      trim: null,
      images: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "Toyota Yaris / Belta",
      price_amount: 42500,
      year: null,
      brand_name: "Toyota",
      model_name: "Yaris / Belta",
      body_type: null,
      mileage_value: null,
      location_label: "San Fernando",
      seller_type: "private",
      contact_method: "phone",
      import_status: null,
      review_status: "needs_review",
      recommendation_state: "review_required",
      is_buyer_visible: false,
      buyer_visibility_reason:
        "Ambiguous model identity and missing year/mileage require review.",
      normalization_confidence: 0.53,
    },
    notes:
      "Tests ambiguous make/model parsing and low-confidence recommendation handling.",
  },
  {
    id: "edge-008",
    category: "image_issue",
    scenario: "Strong structured fields but broken image URL",
    source: "manual_edge_case",
    raw: {
      id: "edge-008",
      url: "manual://revmatched/edge-cases/edge-008",
      title: "2021 Toyota Yaris Cross Hybrid",
      description: "Foreign used. Clean SUV. Excellent condition.",
      price: "TT$175,000 neg.",
      location: "Curepe",
      contact: "WhatsApp 868-555-7707",
      seller: "Private seller",
      mileage: "41,500 km",
      fuel: "Hybrid",
      transmission: "Automatic",
      trim: "Cross",
      images: ["https://example.invalid/revmatched/broken-yaris-cross.jpg"],
    },
    expected: {
      title: "2021 Toyota Yaris Cross Hybrid",
      price_amount: 175000,
      year: 2021,
      brand_name: "Toyota",
      model_name: "Yaris Cross",
      body_type: "suv",
      mileage_value: 41500,
      location_label: "Curepe",
      seller_type: "private",
      contact_method: "whatsapp",
      import_status: "foreign_used",
      review_status: "needs_review",
      recommendation_state: "limited",
      is_buyer_visible: true,
      buyer_visibility_reason:
        "Structured fields are strong, but image reliability should lower confidence.",
      normalization_confidence: 0.83,
    },
    notes:
      "Tests that image failures reduce trust without necessarily hiding a strong listing.",
  },
  {
    id: "edge-009",
    category: "missing_fields",
    scenario: "No images and very sparse dealer title",
    source: "manual_edge_case",
    raw: {
      id: "edge-009",
      url: "manual://revmatched/edge-cases/edge-009",
      title: "Audi Q5",
      description: "Dealer listing. Call for full details.",
      price: "115,000",
      location: null,
      contact: "868-555-8808",
      seller: "TT dealer",
      mileage: "125000",
      fuel: null,
      transmission: null,
      trim: null,
      images: [],
    },
    expected: {
      title: "Audi Q5",
      price_amount: 115000,
      year: null,
      brand_name: "Audi",
      model_name: "Q5",
      body_type: "suv",
      mileage_value: 125000,
      location_label: null,
      seller_type: "dealer",
      contact_method: "phone",
      import_status: null,
      review_status: "needs_review",
      recommendation_state: "review_required",
      is_buyer_visible: false,
      buyer_visibility_reason:
        "No image coverage and missing year/location/fuel reduce buyer trust.",
      normalization_confidence: 0.63,
    },
    notes:
      "Tests sparse dealer rows and no-image handling before fallback images are introduced.",
  },
  {
    id: "edge-010",
    category: "dealer_repost",
    scenario: "Dealer duplicate with changed wording and reused mileage",
    source: "manual_edge_case",
    raw: {
      id: "edge-010",
      url: "manual://revmatched/edge-cases/edge-010",
      title: "Toyota Corolla Axio 2018 fresh import",
      description:
        "ABC Auto Imports. Same Piarco unit. Financing and warranty options.",
      price: "90,000 TTD",
      location: "Piarco",
      contact: "868-555-5505",
      seller: "ABC Auto Imports",
      mileage: "53263 km",
      fuel: "gas",
      transmission: "Automatic",
      trim: null,
      images: [
        "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    expected: {
      title: "Toyota Corolla Axio 2018 fresh import",
      price_amount: 90000,
      year: 2018,
      brand_name: "Toyota",
      model_name: "Corolla Axio",
      body_type: "sedan",
      mileage_value: 53263,
      location_label: "Piarco",
      seller_type: "dealer",
      contact_method: "phone",
      import_status: "foreign_used",
      review_status: "needs_review",
      recommendation_state: "review_required",
      is_buyer_visible: false,
      buyer_visibility_reason:
        "Likely dealer repost of edge-006 despite changed title and price.",
      normalization_confidence: 0.92,
      duplicate_group_id: "dup-dealer-axio-2018-roro",
      expected_duplicate_behavior:
        "Group with edge-006 and require canonical listing selection.",
    },
    notes:
      "Tests dealer repost detection where title order changes and RORO is replaced by fresh import language.",
  },
];

export const normalizationConfidenceExamples = [
  {
    confidence: 0.92,
    meaning: "High confidence: core fields agree and duplicate risk is the main concern.",
    example_id: "edge-002",
  },
  {
    confidence: 0.88,
    meaning: "Moderate confidence: enough buyer-facing data, but informal source text.",
    example_id: "edge-005",
  },
  {
    confidence: 0.63,
    meaning: "Low-medium confidence: recognizable vehicle, but missing trust-building fields.",
    example_id: "edge-009",
  },
  {
    confidence: 0.53,
    meaning: "Low confidence: ambiguous model identity and missing critical context.",
    example_id: "edge-007",
  },
];
