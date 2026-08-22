export type SponsorAd = {
  id: string;
  sponsorName: string;
  title: string;
  body: string;
  cta: string;
  image: string;
  imageAlt: string;
};

export const sponsorAds: SponsorAd[] = [
  {
    id: "summit-payment-estimator",
    sponsorName: "Summit Bank",
    title: "Know your budget before you fall in love",
    body: "Estimate what you can afford before you decide.",
    cta: "Estimate Payment",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A calculator and budget paperwork on a desk",
  },
  {
    id: "shield-insurance-estimator",
    sponsorName: "Shield Insurance",
    title: "Compare real ownership costs",
    body: "Estimate your insurance cost before you choose.",
    cta: "Estimate Insurance",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Insurance and ownership documents arranged on a desk",
  },
  {
    id: "summit-preapproval-check",
    sponsorName: "Summit Bank",
    title: "Shop with a stronger number",
    body: "Check a comfortable range before you shortlist.",
    cta: "Check Range",
    image:
      "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Financial documents and a pen on a desk",
  },
  {
    id: "shield-family-coverage",
    sponsorName: "Shield Insurance",
    title: "Protect the car that fits your life",
    body: "Preview coverage options before the next test drive.",
    cta: "View Coverage",
    image:
      "https://images.unsplash.com/photo-1554224154-22dec7ec8818?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A signed document beside a laptop and pen",
  },
  {
    id: "summit-trade-in-planner",
    sponsorName: "Summit Bank",
    title: "Plan the deal around your next move",
    body: "Balance down payment, trade-in, and monthly comfort.",
    cta: "Plan Budget",
    image:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "A desk with financial planning notes and a laptop",
  },
];
