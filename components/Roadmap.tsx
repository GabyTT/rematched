"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Search,
  SlidersHorizontal,
  ThumbsUp,
} from "lucide-react";

import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { getDiscoverableCars, hasUsablePreferences } from "@/lib/matching";

type RoadmapStep = "define" | "discover" | "like" | "match";

type RoadmapProps = {
  step: RoadmapStep;
};

type RoadmapTransition = {
  connectorIndex: number;
  direction: "forward" | "reverse";
  destination: RoadmapStep;
};

type DiscoverCountDetail = {
  count?: unknown;
  source?: unknown;
};

const roadmapSteps = [
  {
    key: "define",
    title: "Define",
    href: "/find-the-one",
    icon: SlidersHorizontal,
  },
  {
    key: "discover",
    title: "Discover",
    href: "/discover",
    icon: Search,
  },
  {
    key: "like",
    title: "Liked",
    href: "/like",
    icon: ThumbsUp,
  },
  {
    key: "match",
    title: "Top Picks",
    href: "/match",
    icon: Heart,
  },
] as const;

export function Roadmap({ step }: RoadmapProps) {
  const mounted = useMounted();
  const { activeInventoryCars, carProgress, preferences } = useJourney();
  const [activeTransition, setActiveTransition] =
    useState<RoadmapTransition | null>(null);
  const [activeDiscoverCount, setActiveDiscoverCount] = useState<number | null>(
    null,
  );
  const transitionFrameRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const activeIndex = roadmapSteps.findIndex((item) => item.key === step);
  const clearTransitionTimers = useCallback(() => {
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);
  const handleDiscoverClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (href === "/discover" && step === "define") {
      event.preventDefault();
      window.dispatchEvent(new Event("revmatched:save-and-discover"));
      return;
    }

    if (href === "/discover" && step === "discover") {
      window.dispatchEvent(new Event("revmatched:refresh-discover"));
    }
  };
  const fallbackDiscoverCount = getDiscoverableCars(
    activeInventoryCars,
    preferences,
    carProgress,
  ).length;
  const discoverCount = activeDiscoverCount ?? fallbackDiscoverCount;
  const shouldGuideDefine =
    mounted && step === "discover" && !hasUsablePreferences(preferences);
  const likeCount = activeInventoryCars.filter(
    (car) => ["liked", "matched"].includes(carProgress[car.id]?.state ?? ""),
  ).length;
  const matchCount = activeInventoryCars.filter(
    (car) => carProgress[car.id]?.state === "matched",
  ).length;
  const stepIndex = {
    define: 0,
    discover: 1,
    like: 2,
    match: 3,
  } as const;

  const isConnectorActive = (
    toStep: keyof typeof stepIndex,
    currentStep: keyof typeof stepIndex,
  ) => stepIndex[currentStep] >= stepIndex[toStep];

  const connectorStates = [
    mounted && isConnectorActive("discover", step),
    mounted && isConnectorActive("like", step),
    mounted && isConnectorActive("match", step),
  ];

  useEffect(() => {
    const getTransition = (
      from: RoadmapStep,
      to: RoadmapStep,
    ): RoadmapTransition | null => {
      if (from === "discover" && to === "like") {
        return { connectorIndex: 1, direction: "forward", destination: "like" };
      }

      if (from === "like" && to === "match") {
        return { connectorIndex: 2, direction: "forward", destination: "match" };
      }

      if (from === "match" && to === "like") {
        return { connectorIndex: 2, direction: "reverse", destination: "like" };
      }

      return null;
    };

    const isRoadmapStep = (value: unknown): value is RoadmapStep =>
      value === "define" ||
      value === "discover" ||
      value === "like" ||
      value === "match";

    const handleRoadmapTransition = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as { from?: unknown; to?: unknown })
          : null;

      if (!detail || !isRoadmapStep(detail.from) || !isRoadmapStep(detail.to)) {
        return;
      }

      const nextTransition = getTransition(detail.from, detail.to);

      if (!nextTransition) {
        return;
      }

      clearTransitionTimers();
      setActiveTransition(null);

      transitionFrameRef.current = window.requestAnimationFrame(() => {
        setActiveTransition(nextTransition);
        transitionTimeoutRef.current = window.setTimeout(() => {
          setActiveTransition(null);
          transitionTimeoutRef.current = null;
        }, 1900);
      });
    };

    window.addEventListener(
      "revmatched:roadmap-transition",
      handleRoadmapTransition,
    );

    return () => {
      window.removeEventListener(
        "revmatched:roadmap-transition",
        handleRoadmapTransition,
      );
      clearTransitionTimers();
    };
  }, [clearTransitionTimers]);

  useEffect(() => {
    const handleDiscoverCount = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as DiscoverCountDetail)
          : null;

      if (!detail || typeof detail.count !== "number") {
        return;
      }

      setActiveDiscoverCount(detail.count);
    };

    window.addEventListener("revmatched:discover-count", handleDiscoverCount);

    return () => {
      window.removeEventListener(
        "revmatched:discover-count",
        handleDiscoverCount,
      );
    };
  }, []);

  return (
    <section className="sticky top-0 z-40 border-b border-white/5 bg-[linear-gradient(180deg,rgba(3,11,17,0.92)_0%,rgba(3,11,17,0.76)_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-1.5 px-5 py-2 sm:gap-2 sm:px-7 sm:py-2.5 lg:px-10 lg:py-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-slate-400 sm:text-xs sm:tracking-[0.32em]">
          Journey roadmap
        </p>
        <div className="overflow-x-auto pb-0.5">
          <div className="relative min-w-[30rem] md:min-w-0">
            <div className="absolute left-[12.5%] right-[12.5%] top-6 grid grid-cols-3 gap-2 sm:top-8 sm:gap-3">
              {connectorStates.map((isActive, index) => (
                <div
                  key={roadmapSteps[index + 1]?.key}
                  className={`relative h-[2px] overflow-hidden rounded-full transition-[background-color,height] duration-300 ${
                    isActive ? "bg-accent" : "bg-slate-800"
                  } ${
                    activeTransition?.connectorIndex === index
                      ? "h-1 bg-slate-800"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {activeTransition?.connectorIndex === index ? (
                    <span
                      className={`roadmap-transition-connector-fill absolute inset-y-0 rounded-full bg-accent ${
                        activeTransition.direction === "reverse"
                          ? "right-0 roadmap-transition-connector-fill-reverse"
                          : "left-0"
                      }`}
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {roadmapSteps.map((item, index) => {
                const isCompleted = index < activeIndex;
                const isActive = index === activeIndex;
                const Icon = item.icon;
                const count =
                  item.key === "discover"
                    ? mounted
                      ? discoverCount
                      : 0
                    : item.key === "like"
                      ? mounted
                        ? likeCount
                        : 0
                    : item.key === "match"
                        ? mounted
                          ? matchCount
                          : 0
                        : null;
                const label = item.title;
                const iconShellClasses = isActive
                  ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                  : isCompleted
                    ? "border-accent bg-accent text-white"
                    : "border-slate-700 bg-[#16212b] text-slate-300";
                const shouldPulseTransitionDestination =
                  item.key === activeTransition?.destination;
                const shouldPulseDefineStep =
                  item.key === "define" && shouldGuideDefine;
                const titleClasses = isActive
                  ? "text-white"
                  : isCompleted
                    ? "text-slate-100"
                    : "text-slate-300";
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={(event) => handleDiscoverClick(event, item.href)}
                    className="nav-pill relative z-10 flex min-w-0 flex-col items-center rounded-[28px] border border-transparent px-0.5 py-1 text-center sm:px-2 sm:py-1.5"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition sm:h-12 sm:w-12 ${iconShellClasses} ${
                        shouldPulseTransitionDestination
                          ? "roadmap-transition-destination-pulse"
                          : ""
                      } ${
                        shouldPulseDefineStep ? "roadmap-define-attention" : ""
                      }`}
                    >
                      <Icon size={16} strokeWidth={2.4} aria-hidden="true" className="sm:h-5 sm:w-5" />
                    </span>
                    <span className="mt-1.5 flex items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] sm:mt-3 sm:text-[1rem] sm:tracking-[0.16em] md:text-[1.08rem]">
                      <span className={`whitespace-nowrap ${titleClasses}`}>{label}</span>
                      {count !== null ? (
                        <span className="ml-1 inline-flex min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold leading-none text-slate-200 backdrop-blur-sm transition hover:bg-white/10 sm:ml-1.5 sm:min-w-10 sm:px-3 sm:py-1 sm:text-sm">
                          {count}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { RoadmapStep };
