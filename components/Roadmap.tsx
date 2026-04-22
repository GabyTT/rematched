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
import { cars } from "@/lib/cars";
import { getDiscoverableCars } from "@/lib/matching";

type RoadmapStep = "define" | "discover" | "like" | "match";

type RoadmapProps = {
  step: RoadmapStep;
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
  const { carProgress, preferences } = useJourney();
  const [isLikedPulseActive, setIsLikedPulseActive] = useState(false);
  const likedPulseFrameRef = useRef<number | null>(null);
  const likedPulseTimeoutRef = useRef<number | null>(null);
  const activeIndex = roadmapSteps.findIndex((item) => item.key === step);
  const clearLikedPulseTimers = useCallback(() => {
    if (likedPulseFrameRef.current !== null) {
      window.cancelAnimationFrame(likedPulseFrameRef.current);
      likedPulseFrameRef.current = null;
    }

    if (likedPulseTimeoutRef.current !== null) {
      window.clearTimeout(likedPulseTimeoutRef.current);
      likedPulseTimeoutRef.current = null;
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
  const discoverCount = getDiscoverableCars(cars, preferences, carProgress).length;
  const likeCount = Object.values(carProgress).filter(
    (value) => value.state === "liked",
  ).length;
  const matchCount = Object.values(carProgress).filter(
    (value) => value.state === "matched",
  ).length;
  const topPicksLabel = matchCount === 1 ? "The One" : "Top Picks";
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
    const handleLikedStepPulse = () => {
      clearLikedPulseTimers();
      setIsLikedPulseActive(false);

      likedPulseFrameRef.current = window.requestAnimationFrame(() => {
        setIsLikedPulseActive(true);
        likedPulseTimeoutRef.current = window.setTimeout(() => {
          setIsLikedPulseActive(false);
          likedPulseTimeoutRef.current = null;
        }, 1900);
      });
    };

    window.addEventListener("revmatched:liked-step-pulse", handleLikedStepPulse);

    return () => {
      window.removeEventListener(
        "revmatched:liked-step-pulse",
        handleLikedStepPulse,
      );
      clearLikedPulseTimers();
    };
  }, [clearLikedPulseTimers]);

  return (
    <section className="sticky top-0 z-40 border-b border-white/5 bg-[linear-gradient(180deg,rgba(3,11,17,0.92)_0%,rgba(3,11,17,0.76)_100%)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3 sm:px-8 lg:px-12 lg:py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          Journey roadmap
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="relative min-w-[34rem] md:min-w-0">
            <div className="absolute left-[12.5%] right-[12.5%] top-[2rem] grid grid-cols-3 gap-3 sm:top-9 sm:gap-4">
              {connectorStates.map((isActive, index) => (
                <div
                  key={roadmapSteps[index + 1]?.key}
                  className={`relative h-[2px] overflow-hidden rounded-full transition-[background-color,height] duration-300 ${
                    isActive ? "bg-accent" : "bg-slate-800"
                  } ${
                    index === 1 && isLikedPulseActive
                      ? "h-1 bg-slate-800"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {index === 1 && isLikedPulseActive ? (
                    <span className="roadmap-liked-connector-fill absolute inset-y-0 left-0 rounded-full bg-accent" />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
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
                const label = item.key === "match" ? topPicksLabel : item.title;
                const iconShellClasses = isActive
                  ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                  : isCompleted
                    ? "border-accent bg-accent text-white"
                    : "border-slate-700 bg-[#16212b] text-slate-300";
                const shouldPulseLikedStep =
                  item.key === "like" && isLikedPulseActive;
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
                    className="nav-pill relative z-10 flex min-w-0 flex-col items-center rounded-[28px] border border-transparent px-2 py-2 text-center sm:px-3"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className={`inline-flex h-[2.625rem] w-[2.625rem] items-center justify-center rounded-full border transition sm:h-[3.375rem] sm:w-[3.375rem] ${iconShellClasses} ${
                        shouldPulseLikedStep ? "roadmap-liked-pulse" : ""
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.4} aria-hidden="true" className="sm:h-6 sm:w-6" />
                    </span>
                    <span className="mt-3 flex items-center justify-center text-[0.92rem] font-semibold uppercase tracking-[0.12em] sm:mt-4 sm:text-[1.12rem] sm:tracking-[0.16em] md:text-[1.2rem]">
                      <span className={titleClasses}>{label}</span>
                      {count !== null ? (
                        <span className="ml-1.5 inline-flex min-w-8 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold leading-none text-slate-200 backdrop-blur-sm transition hover:bg-white/10 sm:ml-2 sm:min-w-10 md:text-base">
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
