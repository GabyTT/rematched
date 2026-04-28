"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowRightLeft, Heart, Wrench } from "lucide-react";

const heroImageSrc = "/hero-driver-steering-wheel-edited.png";

export default function Home() {
  const router = useRouter();
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [isHeroCtaNudging, setIsHeroCtaNudging] = useState(false);
  const heroNudgeTimersRef = useRef<number[]>([]);
  const hasStoppedHeroNudgesRef = useRef(false);
  const heroNudgeResetTimerRef = useRef<number | null>(null);

  const clearHeroNudgeTimers = useCallback(() => {
    heroNudgeTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    heroNudgeTimersRef.current = [];

    if (heroNudgeResetTimerRef.current !== null) {
      window.clearTimeout(heroNudgeResetTimerRef.current);
      heroNudgeResetTimerRef.current = null;
    }
  }, []);

  const stopHeroNudges = useCallback(() => {
    hasStoppedHeroNudgesRef.current = true;
    clearHeroNudgeTimers();
    setIsHeroCtaNudging(false);
  }, [clearHeroNudgeTimers]);

  const handleCardNavigate = (
    event: React.MouseEvent<HTMLAnchorElement> | React.KeyboardEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (
      "button" in event &&
      event.button !== 0
    ) {
      return;
    }

    if ("metaKey" in event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      return;
    }

    event.preventDefault();
    stopHeroNudges();
    setAnimatingCard(href);

    window.setTimeout(() => {
      router.push(href);
    }, 170);
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return undefined;
    }

    const runNudge = () => {
      if (hasStoppedHeroNudgesRef.current) {
        return;
      }

      setIsHeroCtaNudging(true);
      heroNudgeResetTimerRef.current = window.setTimeout(() => {
        setIsHeroCtaNudging(false);
        heroNudgeResetTimerRef.current = null;
      }, 560);
    };

    heroNudgeTimersRef.current = [
      window.setTimeout(runNudge, 1400),
      window.setTimeout(runNudge, 7800),
    ];

    const interactionEvents = ["click", "scroll", "keydown", "pointerdown"];
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, stopHeroNudges, {
        passive: true,
      });
    });

    return () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, stopHeroNudges);
      });
      clearHeroNudgeTimers();
    };
  }, [clearHeroNudgeTimers, stopHeroNudges]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(209,19,58,0.16),transparent_24%),linear-gradient(180deg,#011118_0%,#000000_44%,#04121a_100%)] text-foreground">
      <section>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-2 sm:px-8 lg:min-h-[53vh] lg:gap-1 lg:px-10 lg:py-2">
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="relative z-20 max-w-3xl lg:mr-[-11rem] lg:w-[52%] lg:max-w-none">
              <h1
                className="motion-rise-fade motion-delay-1 text-4xl font-semibold leading-[0.96] tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                <span className="block lg:whitespace-nowrap">Your next car is out there.</span>
                <span className="block">Find your match.</span>
              </h1>
              <p
                className="motion-rise-fade motion-delay-2 mt-6 max-w-2xl text-[1.7rem] font-normal leading-10 text-slate-300 sm:mt-7 sm:text-[1.85rem]"
              >
                Fits your budget, your routine, and the road ahead.
              </p>
              <div className="mt-5 flex flex-col gap-5 sm:mt-6 sm:gap-6">
                <Link
                  href="/find-the-one"
                  onClick={stopHeroNudges}
                  className={`home-hero-cta motion-rise-fade motion-delay-3 card-cta app-button inline-flex min-h-[4.5rem] w-full items-center justify-center rounded-[2.25rem] border border-[#D1133A] bg-[#D1133A] px-12 py-5 text-xl font-semibold text-[#FFFFFF] shadow-[0_18px_40px_rgba(209,19,58,0.32),0_0_30px_rgba(209,19,58,0.16)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_22px_48px_rgba(209,19,58,0.4),0_0_40px_rgba(209,19,58,0.22)] active:translate-y-0 active:scale-[0.98] sm:min-h-[4.75rem] sm:w-fit sm:px-14 sm:text-[1.35rem] ${
                    isHeroCtaNudging ? "home-hero-cta-nudge" : ""
                  }`}
                >
                  Find My Match
                </Link>
                <p
                  className="motion-rise-fade motion-delay-4 text-2xl text-slate-300"
                >
                  Define. Discover. Like. Find your match.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex w-full flex-col lg:ml-[-5%] lg:w-[68%] lg:max-w-none lg:items-end">
              <div className="home-hero-visual relative h-[22rem] w-full overflow-hidden sm:h-[27rem] lg:h-[29rem]">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[46%] bg-gradient-to-r from-[#01080d] via-[#01080d]/88 via-28% to-transparent lg:block" />
                <Image
                  src={heroImageSrc}
                  alt="A smiling woman seated in the driver’s seat of a car"
                  width={1536}
                  height={1024}
                  priority
                  className="home-hero-image h-full w-full scale-[1.1] object-cover brightness-[1.03] contrast-[1.02] saturate-[1.05]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="text-[#17212b]">
        <div className="mx-auto -mt-2 grid w-full max-w-7xl gap-4 px-5 py-1 sm:-mt-3 sm:px-8 sm:py-2 lg:-mt-5 lg:grid-cols-3 lg:items-stretch lg:px-12 lg:py-1">
          <Link
            href="/find-the-one"
            onClick={(event) => handleCardNavigate(event, "/find-the-one")}
            className={`home-stage-card page-panel group rounded-[28px] border border-[#d3dde6] bg-[#fbfaf8] p-4 shadow-[0_18px_40px_rgba(18,31,43,0.09)] sm:p-5 lg:h-full ${animatingCard === "/find-the-one" ? "home-stage-card-clicking" : ""}`}
          >
            <div className="flex h-full flex-col">
              <div className="max-w-sm flex-1">
                <div className="mb-4 flex min-h-14 items-center gap-3.5">
                  <div className="home-stage-icon-shell inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_10px_24px_rgba(20,31,40,0.18)] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#D1133A] group-hover:bg-[#D1133A] group-hover:text-white group-focus-within:border-[#D1133A] group-focus-within:bg-[#D1133A] group-focus-within:text-white">
                    <Heart size={34} strokeWidth={0} className="stage-icon fill-current" />
                  </div>
                  <p className="home-stage-label flex-1 text-left text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] transition-colors duration-300 group-hover:text-[#D1133A] group-focus-within:text-[#D1133A] sm:text-[1.45rem]">
                    FIND THE ONE
                  </p>
                </div>
                <h2 className="mt-2.5 text-2xl font-semibold text-[#17212b]">
                  Find your match
                </h2>
                <p className="mt-1.5 text-2xl leading-8 text-[#425466]">
                  Set your preferences and discover the cars that feel like the right fit.
                </p>
              </div>
              <div className="mt-5 flex justify-end text-[#536a7d] transition-colors duration-300 group-hover:text-[#203545]">
                <ArrowRight size={20} strokeWidth={2.2} />
              </div>
            </div>
          </Link>

          <Link
            href="/life-together"
            onClick={(event) => handleCardNavigate(event, "/life-together")}
            className={`home-stage-card page-panel group rounded-[28px] border border-[#d3dde6] bg-[#fbfaf8] p-4 shadow-[0_18px_40px_rgba(18,31,43,0.09)] sm:p-5 lg:h-full ${animatingCard === "/life-together" ? "home-stage-card-clicking" : ""}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-4 flex min-h-14 items-center gap-3.5">
                  <div className="home-stage-icon-shell inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_10px_24px_rgba(20,31,40,0.18)] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#D1133A] group-hover:bg-[#D1133A] group-hover:text-white group-focus-within:border-[#D1133A] group-focus-within:bg-[#D1133A] group-focus-within:text-white">
                    <Wrench size={34} strokeWidth={2.2} className="stage-icon" />
                  </div>
                  <p className="home-stage-label flex-1 text-left text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] transition-colors duration-300 group-hover:text-[#D1133A] group-focus-within:text-[#D1133A] sm:text-[1.45rem]">
                    LIFE TOGETHER
                  </p>
                </div>
                <h2 className="mt-2.5 text-2xl font-semibold text-[#17212b]">
                  Keep your car on track
                </h2>
                <p className="mt-1.5 text-2xl leading-8 text-[#425466]">
                  Stay ahead of upkeep, reminders, and the practical side of ownership.
                </p>
              </div>
              <div className="mt-5 flex justify-end text-[#536a7d] transition-colors duration-300 group-hover:text-[#203545]">
                <ArrowRight size={20} strokeWidth={2.2} />
              </div>
            </div>
          </Link>

          <Link
            href="/moving-on"
            onClick={(event) => handleCardNavigate(event, "/moving-on")}
            className={`home-stage-card page-panel group rounded-[28px] border border-[#d3dde6] bg-[#fbfaf8] p-4 shadow-[0_18px_40px_rgba(18,31,43,0.09)] sm:p-5 lg:h-full ${animatingCard === "/moving-on" ? "home-stage-card-clicking" : ""}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-4 flex min-h-14 items-center gap-3.5">
                  <div className="home-stage-icon-shell inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_10px_24px_rgba(20,31,40,0.18)] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#D1133A] group-hover:bg-[#D1133A] group-hover:text-white group-focus-within:border-[#D1133A] group-focus-within:bg-[#D1133A] group-focus-within:text-white">
                    <ArrowRightLeft size={34} strokeWidth={2.2} className="stage-icon" />
                  </div>
                  <p className="home-stage-label flex-1 text-left text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] transition-colors duration-300 group-hover:text-[#D1133A] group-focus-within:text-[#D1133A] sm:text-[1.45rem]">
                    MOVING ON
                  </p>
                </div>
                <h2 className="mt-2.5 text-2xl font-semibold text-[#17212b]">
                  Sell with more clarity
                </h2>
                <p className="mt-1.5 text-2xl leading-8 text-[#425466]">
                  Get support for listing well and making your next move with confidence.
                </p>
              </div>
              <div className="mt-5 flex justify-end text-[#536a7d] transition-colors duration-300 group-hover:text-[#203545]">
                <ArrowRight size={20} strokeWidth={2.2} />
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
