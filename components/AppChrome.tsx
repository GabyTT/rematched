"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  CarFront,
  ChevronRight,
  Heart,
  House,
  LogOut,
  Menu,
  Settings,
  User,
  X,
} from "lucide-react";

import { Roadmap, type RoadmapStep } from "@/components/Roadmap";
import { UnlockAlertsModal } from "@/components/UnlockAlertsModal";
import { useJourney } from "@/components/JourneyProvider";

const appNavItems = [
  { href: "/", label: "Home", section: "home", icon: House },
  { href: "/find-the-one", label: "Find the One", section: "find-the-one", icon: CarFront },
  { href: "/life-together", label: "Life Together", section: "life-together", icon: Heart },
  { href: "/moving-on", label: "Moving On", section: "moving-on", icon: ArrowRightLeft },
];

const accountNavItems = [
  { href: "/profile", label: "Profile", section: "profile", icon: User },
  { href: "/profile", label: "Settings", section: "settings", icon: Settings },
];

const stepByPathname: Record<string, RoadmapStep> = {
  "/find-the-one": "define",
  "/discover": "discover",
  "/like": "like",
  "/match": "match",
};

const findTheOnePaths = new Set(["/find-the-one", "/discover", "/like", "/match"]);

export function AppChrome() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    isUnlockAlertsModalOpen,
    closeUnlockAlertsModal,
    logOut,
  } = useJourney();
  const activeStep = stepByPathname[pathname] ?? "define";
  const isInFindTheOne = findTheOnePaths.has(pathname);
  const activeSection = isInFindTheOne
    ? "find-the-one"
    : pathname === "/life-together"
      ? "life-together"
      : pathname === "/moving-on"
        ? "moving-on"
        : pathname === "/profile"
          ? "profile"
          : "home";

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDrawerOpen]);

  const handleDiscoverClick = (href: string) => {
    if (href === "/discover" && pathname === "/discover") {
      window.dispatchEvent(new Event("revmatched:refresh-discover"));
    }
  };
  const handleDrawerSelect = (href: string) => {
    if (href === "/find-the-one" && pathname === "/discover") {
      handleDiscoverClick("/discover");
    }

    setIsDrawerOpen(false);
  };
  const activeDrawerClass =
    "text-white";
  const inactiveDrawerClass =
    "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100";
  const drawerItemClass =
    "group flex w-full items-center justify-between rounded-md border-b border-white/[0.07] px-1 py-4 text-left text-xl font-semibold leading-7 transition";
  const activeDrawerIconClass =
    "border-white bg-white text-[#D1133A]";
  const inactiveDrawerIconClass =
    "border-white/10 bg-[#34424c] text-white group-hover:bg-[#40515f]";
  const activeDrawerChevronClass = "text-slate-100";
  const inactiveDrawerChevronClass =
    "text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-300";

  return (
    <>
      <header className="border-b border-input bg-panel/95 backdrop-blur">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3 sm:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            data-active="false"
            className="nav-pill nav-pill-inactive inline-flex rounded-full border border-[#40515F] bg-[#2E3C4A] p-2 text-[#D7DEE6] transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
            aria-expanded={isDrawerOpen}
          >
            <Menu size={22} strokeWidth={2.4} />
          </button>
          <Link href="/" className="justify-self-center text-lg font-semibold tracking-[0.2em] text-white">
            REVMATCHED
          </Link>
          <span className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 transition ${
          isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsDrawerOpen(false)}
          aria-label="Close menu overlay"
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[min(20rem,82vw)] flex-col gap-5 border-r border-input bg-panel p-5 shadow-[18px_0_40px_rgba(0,0,0,0.35)] transition-transform duration-300 ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold tracking-[0.2em] text-white">
              REVMATCHED
            </span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              data-active="false"
              className="nav-pill nav-pill-inactive inline-flex rounded-full border border-[#40515F] bg-[#2E3C4A] p-2 text-[#D7DEE6] transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={2.4} />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            <div className="flex flex-col">
              {appNavItems.map((item) => {
                const isActive = item.section === activeSection;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleDrawerSelect(item.href)}
                    data-active={isActive ? "true" : "false"}
                    className={`${drawerItemClass} ${
                      isActive ? activeDrawerClass : inactiveDrawerClass
                    }`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-4">
                      <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                          isActive ? activeDrawerIconClass : inactiveDrawerIconClass
                        }`}
                        aria-hidden="true"
                      >
                        <Icon size={21} strokeWidth={2.3} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <ChevronRight
                      size={18}
                      strokeWidth={2.2}
                      className={`shrink-0 transition ${
                        isActive
                          ? activeDrawerChevronClass
                          : inactiveDrawerChevronClass
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex flex-col">
              {accountNavItems.map((item) => {
                const isActive = item.section === activeSection;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => handleDrawerSelect(item.href)}
                    data-active={isActive ? "true" : "false"}
                    className={`${drawerItemClass} ${
                      isActive ? activeDrawerClass : inactiveDrawerClass
                    }`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-4">
                      <span
                        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                          isActive ? activeDrawerIconClass : inactiveDrawerIconClass
                        }`}
                        aria-hidden="true"
                      >
                        <Icon size={21} strokeWidth={2.3} />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <ChevronRight
                      size={18}
                      strokeWidth={2.2}
                      className={`shrink-0 transition ${
                        isActive
                          ? activeDrawerChevronClass
                          : inactiveDrawerChevronClass
                      }`}
                    />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  logOut();
                  setIsDrawerOpen(false);
                }}
                data-active="false"
                className={`${drawerItemClass} text-slate-400 hover:bg-white/[0.04] hover:text-slate-100`}
              >
                <span className="inline-flex min-w-0 items-center gap-4">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${inactiveDrawerIconClass}`}
                    aria-hidden="true"
                  >
                    <LogOut size={21} strokeWidth={2.3} />
                  </span>
                  <span className="truncate">Log Out</span>
                </span>
                <ChevronRight
                  size={18}
                  strokeWidth={2.2}
                  className={`shrink-0 transition ${inactiveDrawerChevronClass}`}
                />
              </button>
            </div>
          </nav>
        </aside>
      </div>

      <UnlockAlertsModal
        isOpen={isUnlockAlertsModalOpen}
        onClose={closeUnlockAlertsModal}
      />

      {isInFindTheOne ? <Roadmap step={activeStep} /> : null}
    </>
  );
}
