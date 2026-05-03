"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  RefreshCw,
  ScanSearch,
  Shield,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: ClipboardList },
  { href: "/admin/ingestion-runs", label: "Ingestion Runs", icon: RefreshCw },
  { href: "/admin/review-queue", label: "Review Queue", icon: ScanSearch },
];

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({
  title,
  description,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100">
              <Shield size={20} strokeWidth={2.2} />
            </span>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Admin
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
            {description}
          </p>
          <nav className="mt-6 flex flex-wrap gap-3">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-accent bg-accent text-white shadow-[0_10px_24px_rgba(209,19,58,0.24)]"
                      : "border-white/12 bg-white/5 text-slate-200 hover:bg-white/8"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.2} className="mr-2.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </section>

        {children}
      </div>
    </main>
  );
}
