"use client";

import Link from "next/link";
import {
  MessageCircle,
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
    label: "Set preferences",
    href: "/find-the-one",
    icon: SlidersHorizontal,
  },
  {
    key: "discover",
    title: "Discover",
    label: "Swipe matches",
    href: "/discover",
    icon: Search,
  },
  {
    key: "like",
    title: "Like",
    label: "Your shortlist",
    href: "/like",
    icon: ThumbsUp,
  },
  {
    key: "match",
    title: "Engage",
    label: "Start the conversation",
    href: "/match",
    icon: MessageCircle,
  },
] as const;

export function Roadmap({ step }: RoadmapProps) {
  const mounted = useMounted();
  const { carProgress, preferences } = useJourney();
  const activeIndex = roadmapSteps.findIndex((item) => item.key === step);
  const handleDiscoverClick = (href: string) => {
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

  return (
    <section className="border-b border-input bg-black/70">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Journey roadmap
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="relative min-w-[34rem] md:min-w-0">
            <div className="absolute left-[12.5%] right-[12.5%] top-5 grid grid-cols-3 gap-3">
              {connectorStates.map((isActive, index) => (
                <div
                  key={roadmapSteps[index + 1]?.key}
                  className={`h-px rounded-full transition-colors duration-300 ${
                    isActive ? "bg-accent" : "bg-input"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3">
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
                const iconShellClasses = isActive
                  ? "border-accent bg-accent text-white shadow-[0_0_0_4px_rgba(209,19,58,0.16)]"
                  : isCompleted
                    ? "border-accent bg-accent text-white"
                    : "border-input bg-panel text-slate-400";
                const titleClasses = isActive
                  ? "text-white"
                  : isCompleted
                    ? "text-slate-200"
                    : "text-slate-400";
                const labelClasses = isActive || isCompleted
                  ? "text-slate-300"
                  : "text-slate-500";

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => handleDiscoverClick(item.href)}
                    className="relative z-10 flex min-w-0 flex-col items-center text-center"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${iconShellClasses}`}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="mt-3 flex items-center justify-center text-sm font-semibold">
                      <span className={titleClasses}>{item.title}</span>
                      {count !== null ? (
                        <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200">
                          {count}
                        </span>
                      ) : null}
                    </span>
                    <span className={`mt-1 text-xs sm:text-sm ${labelClasses}`}>
                      {item.label}
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
