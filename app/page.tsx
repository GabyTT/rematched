"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ArrowRightLeft, Heart, Wrench } from "lucide-react";

const heroImageSrc = "/hero-driver-smile-v2.png";

export default function Home() {
  const router = useRouter();
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);

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
    setAnimatingCard(href);

    window.setTimeout(() => {
      router.push(href);
    }, 170);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(225,20,79,0.16),transparent_24%),linear-gradient(180deg,#011118_0%,#000000_44%,#04121a_100%)] text-foreground">
      <section>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3 sm:px-8 lg:min-h-[58vh] lg:gap-2 lg:px-10 lg:py-3">
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="relative z-20 max-w-3xl lg:mr-[-5.5rem] lg:w-[44%] lg:max-w-none">
              <h1
                className="motion-rise-fade motion-delay-1 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                <span className="block whitespace-nowrap">Good looks matter.</span>
                <span className="block">So does real compatibility.</span>
              </h1>
              <p
                className="motion-rise-fade motion-delay-2 mt-2.5 max-w-2xl text-[1.7rem] font-normal leading-10 text-slate-300 sm:text-[1.85rem]"
              >
                Find a car that fits your budget, your routine, and the road ahead.
              </p>
              <div className="mt-4 flex flex-col gap-1.5">
                <Link
                  href="/find-the-one"
                  className="motion-rise-fade motion-delay-3 card-cta app-button inline-flex min-h-15 w-full items-center justify-center rounded-full border border-[#E1144F] bg-[#E1144F] px-8 py-4 text-base font-semibold text-[#FFFFFF] shadow-[0_18px_40px_rgba(225,20,79,0.28)] hover:brightness-110 sm:w-fit"
                >
                  Enter Find The One
                </Link>
                <p
                  className="motion-rise-fade motion-delay-4 text-2xl text-slate-300"
                >
                  Define. Discover. Like. Choose The One.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex w-full flex-col lg:w-[62%] lg:max-w-none lg:items-end">
              <div className="home-hero-visual relative w-full overflow-hidden rounded-[32px] bg-[#07131b]">
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.2),transparent_18%),radial-gradient(circle_at_66%_34%,rgba(255,226,215,0.16),transparent_19%),linear-gradient(180deg,rgba(2,8,12,0.0)_0%,rgba(2,8,12,0.04)_52%,rgba(2,8,12,0.16)_100%)]" />
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-36 bg-gradient-to-r from-[#01080d]/84 via-[#020b11]/38 via-34% to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-[#02080d]/38 via-[#02080d]/14 to-transparent" />
                <Image
                  src={heroImageSrc}
                  alt="A smiling woman seated in the driver’s seat of a car"
                  width={1536}
                  height={1024}
                  priority
                  className="home-hero-image h-auto w-full object-cover brightness-[1.03] contrast-[1.02] saturate-[1.05]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="text-[#17212b]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-3 sm:px-8 lg:grid-cols-3 lg:items-stretch lg:px-12 lg:py-2">
          <Link
            href="/find-the-one"
            onClick={(event) => handleCardNavigate(event, "/find-the-one")}
            className={`home-stage-card page-panel group rounded-[28px] border border-[#d3dde6] bg-[#fbfaf8] p-5 shadow-[0_18px_40px_rgba(18,31,43,0.09)] sm:p-6 lg:h-full ${animatingCard === "/find-the-one" ? "home-stage-card-clicking" : ""}`}
          >
            <div className="flex h-full flex-col">
              <div className="max-w-sm flex-1">
                <div className="mb-5 flex min-h-16 items-center gap-4">
                  <div className="home-stage-icon-shell inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_10px_24px_rgba(20,31,40,0.18)] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#E1144F] group-hover:bg-[#E1144F] group-hover:text-white group-focus-within:border-[#E1144F] group-focus-within:bg-[#E1144F] group-focus-within:text-white">
                    <Heart size={34} strokeWidth={2.2} className="stage-icon" />
                  </div>
                  <p className="home-stage-label flex-1 text-left text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] transition-colors duration-300 group-hover:text-[#E1144F] group-focus-within:text-[#E1144F] sm:text-[1.45rem]">
                    FIND THE ONE
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-[#17212b]">
                  Find your match
                </h2>
                <p className="mt-2 text-2xl leading-8 text-[#425466]">
                  Set your preferences and discover the cars that feel like the right fit.
                </p>
              </div>
              <div className="mt-6 flex justify-end text-[#536a7d] transition-colors duration-300 group-hover:text-[#203545]">
                <ArrowRight size={20} strokeWidth={2.2} />
              </div>
            </div>
          </Link>

          <Link
            href="/life-together"
            onClick={(event) => handleCardNavigate(event, "/life-together")}
            className={`home-stage-card page-panel group rounded-[28px] border border-[#d3dde6] bg-[#fbfaf8] p-5 shadow-[0_18px_40px_rgba(18,31,43,0.09)] sm:p-6 lg:h-full ${animatingCard === "/life-together" ? "home-stage-card-clicking" : ""}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-5 flex min-h-16 items-center gap-4">
                  <div className="home-stage-icon-shell inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_10px_24px_rgba(20,31,40,0.18)] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#E1144F] group-hover:bg-[#E1144F] group-hover:text-white group-focus-within:border-[#E1144F] group-focus-within:bg-[#E1144F] group-focus-within:text-white">
                    <Wrench size={34} strokeWidth={2.2} className="stage-icon" />
                  </div>
                  <p className="home-stage-label flex-1 text-left text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] transition-colors duration-300 group-hover:text-[#E1144F] group-focus-within:text-[#E1144F] sm:text-[1.45rem]">
                    LIFE TOGETHER
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-[#17212b]">
                  Keep your car on track
                </h2>
                <p className="mt-2 text-2xl leading-8 text-[#425466]">
                  Stay ahead of upkeep, reminders, and the practical side of ownership.
                </p>
              </div>
              <div className="mt-6 flex justify-end text-[#536a7d] transition-colors duration-300 group-hover:text-[#203545]">
                <ArrowRight size={20} strokeWidth={2.2} />
              </div>
            </div>
          </Link>

          <Link
            href="/moving-on"
            onClick={(event) => handleCardNavigate(event, "/moving-on")}
            className={`home-stage-card page-panel group rounded-[28px] border border-[#d3dde6] bg-[#fbfaf8] p-5 shadow-[0_18px_40px_rgba(18,31,43,0.09)] sm:p-6 lg:h-full ${animatingCard === "/moving-on" ? "home-stage-card-clicking" : ""}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-5 flex min-h-16 items-center gap-4">
                  <div className="home-stage-icon-shell inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#40515f] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_10px_24px_rgba(20,31,40,0.18)] transition-[background-color,border-color,color,transform] duration-300 group-hover:scale-[1.03] group-hover:border-[#E1144F] group-hover:bg-[#E1144F] group-hover:text-white group-focus-within:border-[#E1144F] group-focus-within:bg-[#E1144F] group-focus-within:text-white">
                    <ArrowRightLeft size={34} strokeWidth={2.2} className="stage-icon" />
                  </div>
                  <p className="home-stage-label flex-1 text-left text-[1.3rem] font-semibold uppercase tracking-[0.18em] text-[#2E3C4A] transition-colors duration-300 group-hover:text-[#E1144F] group-focus-within:text-[#E1144F] sm:text-[1.45rem]">
                    MOVING ON
                  </p>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-[#17212b]">
                  Sell with more clarity
                </h2>
                <p className="mt-2 text-2xl leading-8 text-[#425466]">
                  Get support for listing well and making your next move with confidence.
                </p>
              </div>
              <div className="mt-6 flex justify-end text-[#536a7d] transition-colors duration-300 group-hover:text-[#203545]">
                <ArrowRight size={20} strokeWidth={2.2} />
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
