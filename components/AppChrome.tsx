"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  Heart,
  House,
  LogOut,
  Menu,
  User,
  Wrench,
  X,
} from "lucide-react";

import { Roadmap, type RoadmapStep } from "@/components/Roadmap";
import { UnlockAlertsModal } from "@/components/UnlockAlertsModal";
import { useJourney } from "@/components/JourneyProvider";

const appNavItems = [
  { href: "/", label: "Home", section: "home", icon: House },
  { href: "/find-the-one", label: "Find The One", section: "find-the-one", icon: Heart },
  { href: "/life-together", label: "Life Together", section: "life-together", icon: Wrench },
  { href: "/moving-on", label: "Moving On", section: "moving-on", icon: ArrowRightLeft },
  { href: "/profile", label: "Profile", section: "profile", icon: User },
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

  return (
    <>
      <header className="border-b border-input bg-panel/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="text-lg font-semibold tracking-[0.2em] text-white">
            REVMATCHED
          </Link>
          <nav className="hidden flex-wrap gap-2 lg:flex">
            {appNavItems.map((item) => {
              const isActive = item.section === activeSection;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href === "/find-the-one") {
                      handleDiscoverClick(
                        pathname === "/discover" ? "/discover" : item.href,
                      );
                    }
                  }}
                  className={`nav-pill rounded-full border px-4 py-2 text-sm font-medium ${
                    isActive
                      ? "border-accent bg-accent text-white"
                      : "border-input bg-input text-slate-300 hover:border-accent"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon size={16} strokeWidth={2} className="nav-icon" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={logOut}
              className="nav-pill rounded-full border border-input bg-input px-4 py-2 text-sm font-medium text-slate-300 hover:border-accent"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut size={16} strokeWidth={2} className="nav-icon" />
                Log Out
              </span>
            </button>
          </nav>
          <button
            type="button"
            onClick={() => setIsDrawerOpen((current) => !current)}
            className="inline-flex rounded-full border border-input bg-input p-2 text-white transition hover:border-accent lg:hidden"
            aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col gap-4 border-l border-input bg-panel p-5 shadow-[-18px_0_40px_rgba(0,0,0,0.35)] transition-transform">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold tracking-[0.2em] text-white">
                REVMATCHED
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex rounded-full border border-input bg-input p-2 text-white transition hover:border-accent"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {appNavItems.map((item) => {
                const isActive = item.section === activeSection;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleDrawerSelect(item.href)}
                    className={`nav-pill rounded-2xl border px-4 py-3 text-sm font-medium ${
                      isActive
                        ? "border-accent bg-accent text-white"
                        : "border-input bg-input text-slate-300 hover:border-accent"
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <Icon size={18} strokeWidth={2} className="nav-icon" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  logOut();
                  setIsDrawerOpen(false);
                }}
                className="nav-pill rounded-2xl border border-input bg-input px-4 py-3 text-left text-sm font-medium text-slate-300 hover:border-accent"
              >
                <span className="inline-flex items-center gap-3">
                  <LogOut size={18} strokeWidth={2} className="nav-icon" />
                  Log Out
                </span>
              </button>
            </nav>
          </div>
        </div>
      ) : null}

      <UnlockAlertsModal
        isOpen={isUnlockAlertsModalOpen}
        onClose={closeUnlockAlertsModal}
      />

      {isInFindTheOne ? <Roadmap step={activeStep} /> : null}
    </>
  );
}
