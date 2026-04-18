"use client";

import { useMemo, useState } from "react";
import {
  Battery,
  CarFront,
  ClipboardCheck,
  MapPin,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";

type NeedId =
  | "service"
  | "tyres"
  | "battery"
  | "insurance"
  | "licensing";

type NeedCard = {
  id: NeedId;
  title: string;
  description: string;
  status: string;
  providerHeading: string;
  providerHelper: string;
  icon: typeof Wrench;
};

type Provider = {
  id: string;
  needId: NeedId;
  name: string;
  category: string;
  location: string;
  description: string;
  featured?: boolean;
};

type CarStatus = "active" | "sold";

type GarageCar = {
  id: string;
  year: number;
  make: string;
  model: string;
  plate: string;
  mileage: string;
  lastServiceDate: string;
  insuranceRenewalDate: string;
  licensingDate: string;
  status: CarStatus;
};

type CareHistoryEntry = {
  id: string;
  date: string;
  title: string;
  provider: string;
  note: string;
};

type CarDrawerMode = "view" | "edit";

const needs: NeedCard[] = [
  {
    id: "service",
    title: "Service / oil change",
    status: "Due this month",
    description:
      "Keep things running smoothly by staying ahead of your next service.",
    providerHeading: "Providers for Service",
    providerHelper: "Showing providers related to this need.",
    icon: Wrench,
  },
  {
    id: "tyres",
    title: "Tyres",
    status: "Check soon",
    description:
      "It may be worth checking tread, wear, and alignment soon.",
    providerHeading: "Providers for Tyres",
    providerHelper: "Showing providers related to this need.",
    icon: CarFront,
  },
  {
    id: "battery",
    title: "Battery",
    status: "Monitor",
    description:
      "A quick battery check now can save you from an inconvenient surprise.",
    providerHeading: "Providers for Battery",
    providerHelper: "Showing providers related to this need.",
    icon: Battery,
  },
  {
    id: "insurance",
    title: "Insurance renewal",
    status: "Upcoming",
    description:
      "Stay ahead of renewal deadlines so nothing sneaks up on you.",
    providerHeading: "Providers for Insurance",
    providerHelper: "Showing providers related to this need.",
    icon: ShieldCheck,
  },
  {
    id: "licensing",
    title: "Licensing / inspection",
    status: "Plan ahead",
    description:
      "Keep the admin side tidy before the next deadline comes around.",
    providerHeading: "Providers for Licensing / Inspection",
    providerHelper: "Showing providers related to this need.",
    icon: ClipboardCheck,
  },
];

const providers: Provider[] = [
  {
    id: "provider-1",
    needId: "service",
    name: "North Coast Auto Care",
    category: "Service Centre",
    location: "Port of Spain",
    description: "Routine servicing, diagnostics, and fluid changes.",
    featured: true,
  },
  {
    id: "provider-2",
    needId: "service",
    name: "Southern Garage Works",
    category: "Mechanic",
    location: "San Fernando",
    description: "General servicing with a focus on daily-driver reliability.",
  },
  {
    id: "provider-3",
    needId: "tyres",
    name: "GripLine Tyre House",
    category: "Tyre Shop",
    location: "Chaguanas",
    description: "Tyres, balancing, alignment, and wear checks.",
    featured: true,
  },
  {
    id: "provider-4",
    needId: "tyres",
    name: "Wheelwise",
    category: "Alignment Centre",
    location: "Arima",
    description: "Wheel alignment and tread-friendly setup checks.",
  },
  {
    id: "provider-5",
    needId: "battery",
    name: "Volt Auto Supplies",
    category: "Battery Specialist",
    location: "Port of Spain",
    description: "Battery testing, replacement, and charging checks.",
  },
  {
    id: "provider-6",
    needId: "battery",
    name: "Ready Start Auto",
    category: "Electrical Shop",
    location: "San Fernando",
    description: "Starter, charging, and battery support for quick fixes.",
    featured: true,
  },
  {
    id: "provider-7",
    needId: "insurance",
    name: "Harbour Cover",
    category: "Insurance Provider",
    location: "Westmoorings",
    description: "Motor policy renewals and coverage reviews.",
    featured: true,
  },
  {
    id: "provider-8",
    needId: "insurance",
    name: "Island Policy Partners",
    category: "Broker",
    location: "San Fernando",
    description: "Quote comparisons and renewal support.",
  },
  {
    id: "provider-9",
    needId: "licensing",
    name: "Inspection Lane TT",
    category: "Inspection Centre",
    location: "Barataria",
    description: "Vehicle inspections and licensing prep support.",
    featured: true,
  },
  {
    id: "provider-10",
    needId: "licensing",
    name: "RoadReady Assist",
    category: "Licensing Support",
    location: "Arima",
    description: "Help getting inspection and licensing paperwork in order.",
  },
];

const carHistory: Record<string, CareHistoryEntry[]> = {
  "bmw-x3-2021": [
    {
      id: "history-1",
      date: "14 January 2026",
      title: "Routine service",
      provider: "North Coast Auto Care",
      note: "Oil change, filters, and a general inspection.",
    },
    {
      id: "history-2",
      date: "12 September 2025",
      title: "Battery replacement",
      provider: "Ready Start Auto",
      note: "Battery replaced before rainy season commuting picked up.",
    },
  ],
};

export default function LifeTogetherPage() {
  const mounted = useMounted();
  const { carProgress } = useJourney();
  const baseGarageCars = useMemo<GarageCar[]>(() => {
    return cars
      .filter((car) => carProgress[car.id]?.state === "matched")
      .map((car, index) => ({
        id: car.id,
        year: car.year,
        make: car.brand,
        model: car.model,
        plate: ["PDL 4821", "PDM 7744", "PDU 1902"][index] ?? "PDX 0000",
        mileage: car.mileage,
        lastServiceDate:
          ["14 January 2026", "8 December 2025", "2 February 2026"][index] ??
          "Not logged",
        insuranceRenewalDate:
          ["29 June 2026", "18 August 2026", "3 November 2026"][index] ??
          "Not logged",
        licensingDate:
          ["18 August 2026", "7 October 2026", "12 December 2026"][index] ??
          "Not logged",
        status: "active",
      }));
  }, [carProgress]);
  const [garageCars, setGarageCars] = useState<GarageCar[]>(baseGarageCars);
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [handledNeedsByCar, setHandledNeedsByCar] = useState<
    Record<string, NeedId[]>
  >({});
  const [activeNeedId, setActiveNeedId] = useState<NeedId | null>(null);
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [openGarageMenuCarId, setOpenGarageMenuCarId] = useState<string | null>(
    null,
  );
  const [drawerCarId, setDrawerCarId] = useState<string | null>(null);
  const [carDrawerMode, setCarDrawerMode] = useState<CarDrawerMode>("view");
  const [newCarYear, setNewCarYear] = useState("");
  const [newCarMake, setNewCarMake] = useState("");
  const [newCarModel, setNewCarModel] = useState("");
  const [newCarPlate, setNewCarPlate] = useState("");
  const [newCarMileage, setNewCarMileage] = useState("");
  const [newCarLastServiceDate, setNewCarLastServiceDate] = useState("");
  const [newCarInsuranceDate, setNewCarInsuranceDate] = useState("");
  const [newCarLicensingDate, setNewCarLicensingDate] = useState("");
  const [addCarError, setAddCarError] = useState<string | null>(null);
  const [editYear, setEditYear] = useState("");
  const [editMake, setEditMake] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editLastServiceDate, setEditLastServiceDate] = useState("");
  const [editInsuranceDate, setEditInsuranceDate] = useState("");
  const [editLicensingDate, setEditLicensingDate] = useState("");
  const [editCarError, setEditCarError] = useState<string | null>(null);

  const activeGarageCars = garageCars.filter((car) => car.status === "active");
  const selectedCar =
    activeGarageCars.find(
      (car) => car.id === (activeCarId ?? activeGarageCars[0]?.id),
    ) ?? null;
  const drawerCar = drawerCarId
    ? garageCars.find((car) => car.id === drawerCarId) ?? null
    : null;
  const selectedCarHandledNeeds = selectedCar
    ? handledNeedsByCar[selectedCar.id] ?? []
    : [];
  const activeNeeds = selectedCar
    ? needs.filter((need) => !selectedCarHandledNeeds.includes(need.id))
    : [];
  const activeNeed = activeNeedId
    ? needs.find((need) => need.id === activeNeedId) ?? null
    : null;
  const relevantProviders = activeNeed
    ? providers.filter((provider) => provider.needId === activeNeed.id)
    : [];
  const selectedCarHistory = selectedCar ? carHistory[selectedCar.id] ?? [] : [];

  const resetAddCarForm = () => {
    setNewCarYear("");
    setNewCarMake("");
    setNewCarModel("");
    setNewCarPlate("");
    setNewCarMileage("");
    setNewCarLastServiceDate("");
    setNewCarInsuranceDate("");
    setNewCarLicensingDate("");
    setAddCarError(null);
  };

  const closeAddCarDrawer = () => {
    setIsAddCarOpen(false);
    resetAddCarForm();
  };

  const openCarDrawer = (carId: string, mode: CarDrawerMode) => {
    const car = garageCars.find((item) => item.id === carId);
    if (!car) {
      return;
    }

    setDrawerCarId(carId);
    setCarDrawerMode(mode);
    setEditYear(String(car.year));
    setEditMake(car.make);
    setEditModel(car.model);
    setEditPlate(car.plate === "Not added yet" ? "" : car.plate);
    setEditMileage(car.mileage === "Not logged" ? "" : car.mileage);
    setEditLastServiceDate(
      car.lastServiceDate === "Not logged" ? "" : car.lastServiceDate,
    );
    setEditInsuranceDate(
      car.insuranceRenewalDate === "Not logged" ? "" : car.insuranceRenewalDate,
    );
    setEditLicensingDate(
      car.licensingDate === "Not logged" ? "" : car.licensingDate,
    );
    setEditCarError(null);
    setOpenGarageMenuCarId(null);
  };

  const closeCarDrawer = () => {
    setDrawerCarId(null);
    setCarDrawerMode("view");
    setEditCarError(null);
  };

  const handleSaveCar = () => {
    const numericYear = Number(newCarYear);
    const numericMileage = Number(newCarMileage.replace(/[^\d]/g, ""));

    if (!newCarYear || !Number.isFinite(numericYear)) {
      setAddCarError("Enter a valid year.");
      return;
    }

    if (!newCarMake.trim()) {
      setAddCarError("Make is required.");
      return;
    }

    if (!newCarModel.trim()) {
      setAddCarError("Model is required.");
      return;
    }

    if (newCarMileage && !Number.isFinite(numericMileage)) {
      setAddCarError("Mileage needs to be numeric.");
      return;
    }

    const newCar: GarageCar = {
      id: `garage-${Date.now()}`,
      year: numericYear,
      make: newCarMake.trim(),
      model: newCarModel.trim(),
      plate: newCarPlate.trim() || "Not added yet",
      mileage: newCarMileage
        ? `${new Intl.NumberFormat("en-US").format(numericMileage)} km`
        : "Not logged",
      lastServiceDate: newCarLastServiceDate || "Not logged",
      insuranceRenewalDate: newCarInsuranceDate || "Not logged",
      licensingDate: newCarLicensingDate || "Not logged",
      status: "active",
    };

    setGarageCars((current) => [...current, newCar]);
    setActiveCarId(newCar.id);
    closeAddCarDrawer();
  };

  const handleSaveCarEdits = () => {
    if (!drawerCar) {
      return;
    }

    const numericYear = Number(editYear);

    if (!editYear || !Number.isFinite(numericYear)) {
      setEditCarError("Enter a valid year.");
      return;
    }

    if (!editMake.trim()) {
      setEditCarError("Make is required.");
      return;
    }

    if (!editModel.trim()) {
      setEditCarError("Model is required.");
      return;
    }

    setGarageCars((current) =>
      current.map((car) =>
        car.id === drawerCar.id
          ? {
              ...car,
              year: numericYear,
              make: editMake.trim(),
              model: editModel.trim(),
              plate: editPlate.trim() || "Not added yet",
              mileage: editMileage.trim() || "Not logged",
              lastServiceDate: editLastServiceDate || "Not logged",
              insuranceRenewalDate: editInsuranceDate || "Not logged",
              licensingDate: editLicensingDate || "Not logged",
            }
          : car,
      ),
    );
    setCarDrawerMode("view");
    setEditCarError(null);
  };

  const markCarAsSold = (carId: string) => {
    setGarageCars((current) =>
      current.map((car) =>
        car.id === carId
          ? {
              ...car,
              status: "sold",
            }
          : car,
      ),
    );

    setHandledNeedsByCar((current) => {
      const next = { ...current };
      delete next[carId];
      return next;
    });

    if (activeCarId === carId || selectedCar?.id === carId) {
      const nextActiveCar = activeGarageCars.find((car) => car.id !== carId);
      setActiveCarId(nextActiveCar?.id ?? null);
    }

    if (drawerCarId === carId) {
      closeCarDrawer();
    }

    setOpenGarageMenuCarId(null);
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-7">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            LIFE TOGETHER
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Life Together is where the rubber meets the road.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Keep track of what&apos;s due next, what&apos;s been done, and what
            helps your car stay reliable day to day.
          </p>
          <button
            type="button"
            onClick={() => setIsAddCarOpen(true)}
            className="app-button mt-6 inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          >
            {activeGarageCars.length ? "Add another car" : "Add your first car"}
          </button>
        </section>

        <section className="page-panel motion-rise-fade motion-delay-1 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Your Garage
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Keep one car in focus while the rest stay close by
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCarOpen(true)}
              className="app-button inline-flex w-fit rounded-full border border-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
            >
              Add another car
            </button>
          </div>

          {activeGarageCars.length ? (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-1">
              {activeGarageCars.map((car) => {
                const isActive = selectedCar?.id === car.id;

                return (
                  <article
                    key={car.id}
                    className={`page-panel relative min-w-72 rounded-[24px] border p-5 transition ${
                      isActive
                        ? "border-accent bg-accent/10 shadow-[0_18px_40px_rgba(225,20,79,0.14)]"
                        : "border-input bg-input/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setActiveCarId(car.id)}
                        className="flex flex-1 items-start gap-4 text-left"
                      >
                        <div className="rounded-2xl border border-input bg-panel/70 p-3 text-slate-200">
                          <CarFront size={20} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm uppercase tracking-[0.18em] text-slate-400">
                              {isActive ? "Active car" : "In your garage"}
                            </span>
                            {isActive ? (
                              <span className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-slate-100">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-white">
                            {car.year} {car.make} {car.model}
                          </h3>
                          <p className="mt-2 text-sm text-slate-300">
                            {car.plate}
                          </p>
                        </div>
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGarageMenuCarId((current) =>
                              current === car.id ? null : car.id,
                            )
                          }
                          className="app-button rounded-full border border-input bg-input px-3 py-2 text-sm text-white transition hover:border-accent"
                          aria-label={`Manage ${car.make} ${car.model}`}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {openGarageMenuCarId === car.id ? (
                          <div className="absolute right-0 top-12 z-10 w-44 rounded-2xl border border-input bg-panel p-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                            <button
                              type="button"
                              onClick={() => openCarDrawer(car.id, "view")}
                              className="nav-pill flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-input"
                            >
                              View details
                            </button>
                            <button
                              type="button"
                              onClick={() => openCarDrawer(car.id, "edit")}
                              className="nav-pill flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-input"
                            >
                              Edit details
                            </button>
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCarId(car.id);
                                  setOpenGarageMenuCarId(null);
                                }}
                                className="nav-pill flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-input"
                              >
                                Set as active
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => markCarAsSold(car.id)}
                              className="nav-pill flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-input"
                            >
                              Mark as sold
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-input bg-input/60 p-6">
              <h3 className="text-xl font-semibold text-white">
                {garageCars.length
                  ? "No active cars in your garage right now."
                  : "No cars in your garage yet."}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {garageCars.length
                  ? "Add another car to keep Life Together moving in the right direction."
                  : "Add your current car to start tracking the practical side of life together."}
              </p>
              <button
                type="button"
                onClick={() => setIsAddCarOpen(true)}
                className="app-button mt-5 inline-flex rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
              >
                {garageCars.length ? "Add another car" : "Add your first car"}
              </button>
            </div>
          )}
        </section>

        {selectedCar ? (
          <>
            <section className="space-y-5">
              <div className="page-panel motion-rise-fade motion-delay-2 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  What needs attention next
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Stay ahead of the important stuff
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  For this car, here&apos;s what may need attention next.
                </p>
              </div>

              {activeNeeds.length ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {activeNeeds.map((need) => {
                    const Icon = need.icon;

                    return (
                      <article
                        key={need.id}
                        className="page-panel interactive-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-input bg-input p-3 text-slate-200">
                              <Icon size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {need.title}
                              </h3>
                              <span className="mt-2 inline-flex rounded-full border border-input bg-input px-3 py-1 text-xs font-medium text-slate-300">
                                {need.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-300">
                          {need.description}
                        </p>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setActiveNeedId(need.id)}
                            className="app-button inline-flex justify-center rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
                          >
                            See providers
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setHandledNeedsByCar((current) => ({
                                ...current,
                                [selectedCar.id]: [
                                  ...(current[selectedCar.id] ?? []),
                                  need.id,
                                ],
                              }))
                            }
                            className="app-button inline-flex justify-center rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
                          >
                            Mark as handled
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-input bg-panel/70 p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                  <h3 className="text-2xl font-semibold text-white">
                    Nothing urgent right now for this car.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    You&apos;re in a good spot. Keep the details up to date and
                    check back when something changes.
                  </p>
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="page-panel motion-rise-fade motion-delay-3 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Care history
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  A clearer record of what&apos;s been done and what this car has
                  needed over time.
                </h2>

                {selectedCarHistory.length ? (
                  <div className="mt-6 space-y-4">
                    {selectedCarHistory.map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-[24px] border border-input bg-input/60 p-5"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {entry.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                              {entry.date}
                            </p>
                          </div>
                          <span className="rounded-full border border-input bg-panel px-3 py-1 text-xs font-medium text-slate-300">
                            {entry.provider}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {entry.note}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[24px] border border-dashed border-input bg-input/60 p-6">
                    <h3 className="text-xl font-semibold text-white">
                      No care history yet for this car.
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Start logging services, repairs, and replacements so you
                      can keep a clearer record over time.
                    </p>
                  </div>
                )}
              </section>

              <section className="page-panel motion-rise-fade motion-delay-4 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Actions for this car
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Keep this car up to date with a few practical next steps.
                </h2>

                <div className="mt-6 grid gap-3">
                  {[
                    "View details",
                    "Log a service",
                    "Set a reminder",
                    "Update mileage",
                    "Edit car details",
                  ].map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        if (action === "View details") {
                          openCarDrawer(selectedCar.id, "view");
                        }

                        if (action === "Edit car details") {
                          openCarDrawer(selectedCar.id, "edit");
                        }
                      }}
                      className="app-button inline-flex justify-center rounded-2xl border border-input bg-input px-5 py-4 text-sm font-semibold text-white transition hover:border-accent"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <section className="page-panel motion-rise-fade motion-delay-2 rounded-[28px] border border-dashed border-input bg-panel p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-2xl font-semibold text-white">
              {garageCars.length
                ? "No active cars in your garage right now."
                : "No cars in your garage yet."}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {garageCars.length
                ? "Mark another car active or add a new one to keep the ownership flow moving."
                : "Add your current car to start tracking the practical side of life together."}
            </p>
            <button
              type="button"
              onClick={() => setIsAddCarOpen(true)}
              className="app-button mt-6 inline-flex rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
            >
              {garageCars.length ? "Add another car" : "Add your first car"}
            </button>
          </section>
        )}
      </div>

      {activeNeed && selectedCar ? (
        <div className="fixed inset-0 z-50 bg-black/70">
          <button
            type="button"
            aria-label="Close provider drawer"
            className="absolute inset-0"
            onClick={() => setActiveNeedId(null)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-input bg-panel p-5 shadow-[-24px_0_60px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  {activeNeed.providerHeading}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {activeNeed.providerHelper}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNeedId(null)}
                className="app-button rounded-full border border-input bg-input px-3 py-2 text-sm font-medium text-white transition hover:border-accent"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {relevantProviders.map((provider) => (
                <article
                  key={provider.id}
                  className="rounded-[24px] border border-input bg-input/70 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {provider.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {provider.category}
                      </p>
                    </div>
                    {provider.featured ? (
                      <span className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-medium text-slate-200">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <MapPin size={16} className="text-slate-400" />
                    {provider.location}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {provider.description}
                  </p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="app-button inline-flex justify-center rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      className="app-button inline-flex items-center justify-center gap-2 rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
                    >
                      <Phone size={16} className="text-slate-300" />
                      Contact / Call
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {drawerCar ? (
        <div className="fixed inset-0 z-50 bg-black/70">
          <button
            type="button"
            aria-label="Close car details drawer"
            className="absolute inset-0"
            onClick={closeCarDrawer}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-input bg-panel p-5 shadow-[-24px_0_60px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  {carDrawerMode === "edit" ? "Edit car" : "Car details"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {drawerCar.year} {drawerCar.make} {drawerCar.model}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Manage the deeper details for this car without leaving Life
                  Together.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCarDrawer}
                className="app-button rounded-full border border-input bg-input px-3 py-2 text-sm font-medium text-white transition hover:border-accent"
              >
                Close
              </button>
            </div>

            {carDrawerMode === "view" ? (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-input bg-input/70 p-4">
                    <p className="text-sm text-slate-400">Vehicle</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {drawerCar.year} {drawerCar.make} {drawerCar.model}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-input bg-input/70 p-4">
                    <p className="text-sm text-slate-400">Plate number</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {drawerCar.plate}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-input bg-input/70 p-4">
                    <p className="text-sm text-slate-400">Mileage</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {drawerCar.mileage}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-input bg-input/70 p-4">
                    <p className="text-sm text-slate-400">Last service date</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {drawerCar.lastServiceDate}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-input bg-input/70 p-4">
                    <p className="text-sm text-slate-400">Insurance renewal</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {drawerCar.insuranceRenewalDate}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-input bg-input/70 p-4">
                    <p className="text-sm text-slate-400">
                      Licensing / inspection
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {drawerCar.licensingDate}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-input bg-input/70 p-4 sm:col-span-2">
                    <p className="text-sm text-slate-400">Status</p>
                    <span className="mt-2 inline-flex rounded-full border border-input bg-panel px-3 py-1 text-sm font-medium text-slate-200">
                      {drawerCar.status === "active" ? "Active" : "Sold"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openCarDrawer(drawerCar.id, "edit")}
                    className="app-button inline-flex justify-center rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
                  >
                    Edit car
                  </button>
                  {drawerCar.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => markCarAsSold(drawerCar.id)}
                      className="app-button inline-flex justify-center rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
                    >
                      Mark as sold
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Year
                    </span>
                    <input
                      value={editYear}
                      onChange={(event) => setEditYear(event.target.value)}
                      inputMode="numeric"
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Make
                    </span>
                    <input
                      value={editMake}
                      onChange={(event) => setEditMake(event.target.value)}
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Model
                    </span>
                    <input
                      value={editModel}
                      onChange={(event) => setEditModel(event.target.value)}
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Plate number
                    </span>
                    <input
                      value={editPlate}
                      onChange={(event) => setEditPlate(event.target.value)}
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Mileage
                    </span>
                    <input
                      value={editMileage}
                      onChange={(event) => setEditMileage(event.target.value)}
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Last service date
                    </span>
                    <input
                      type="date"
                      value={editLastServiceDate}
                      onChange={(event) =>
                        setEditLastServiceDate(event.target.value)
                      }
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Insurance renewal date
                    </span>
                    <input
                      type="date"
                      value={editInsuranceDate}
                      onChange={(event) => setEditInsuranceDate(event.target.value)}
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Licensing / inspection date
                    </span>
                    <input
                      type="date"
                      value={editLicensingDate}
                      onChange={(event) => setEditLicensingDate(event.target.value)}
                      className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                    />
                  </label>
                </div>

                {editCarError ? (
                  <p className="mt-4 text-sm text-red-300">{editCarError}</p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSaveCarEdits}
                    className="app-button inline-flex justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCarDrawerMode("view")}
                    className="app-button inline-flex justify-center rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {isAddCarOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70">
          <button
            type="button"
            aria-label="Close add car drawer"
            className="absolute inset-0"
            onClick={closeAddCarDrawer}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-input bg-panel p-5 shadow-[-24px_0_60px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Add your car
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start tracking the practical side of life together by adding
                  your current car.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddCarDrawer}
                className="app-button rounded-full border border-input bg-input px-3 py-2 text-sm font-medium text-white transition hover:border-accent"
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Year
                </span>
                <input
                  value={newCarYear}
                  onChange={(event) => setNewCarYear(event.target.value)}
                  inputMode="numeric"
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Make
                </span>
                <input
                  value={newCarMake}
                  onChange={(event) => setNewCarMake(event.target.value)}
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Model
                </span>
                <input
                  value={newCarModel}
                  onChange={(event) => setNewCarModel(event.target.value)}
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Plate number
                </span>
                <input
                  value={newCarPlate}
                  onChange={(event) => setNewCarPlate(event.target.value)}
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Current mileage
                </span>
                <input
                  value={newCarMileage}
                  onChange={(event) => setNewCarMileage(event.target.value)}
                  inputMode="numeric"
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Last service date
                </span>
                <input
                  type="date"
                  value={newCarLastServiceDate}
                  onChange={(event) =>
                    setNewCarLastServiceDate(event.target.value)
                  }
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Insurance renewal date
                </span>
                <input
                  type="date"
                  value={newCarInsuranceDate}
                  onChange={(event) => setNewCarInsuranceDate(event.target.value)}
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Licensing / inspection date
                </span>
                <input
                  type="date"
                  value={newCarLicensingDate}
                  onChange={(event) => setNewCarLicensingDate(event.target.value)}
                  className="app-input min-h-12 w-full rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none"
                />
              </label>
            </div>

            {addCarError ? (
              <p className="mt-4 text-sm text-red-300">{addCarError}</p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveCar}
                className="app-button inline-flex justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Save car
              </button>
              <button
                type="button"
                onClick={closeAddCarDrawer}
                className="app-button inline-flex justify-center rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
              >
                Cancel
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
