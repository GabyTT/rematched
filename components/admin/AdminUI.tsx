import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function AdminStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <article className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
          {label}
        </p>
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100">
          <Icon size={20} strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-base leading-7 text-slate-300">{detail}</p>
    </article>
  );
}

export function AdminInfoCard({
  title,
  description,
  href,
  cta,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
}) {
  return (
    <article className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
      <Link
        href={href}
        className="nav-pill mt-5 inline-flex min-h-11 items-center rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
      >
        {cta}
      </Link>
    </article>
  );
}

export function AdminBadge({
  tone,
  label,
}: {
  tone: "neutral" | "good" | "warn" | "bad";
  label: string;
}) {
  const toneClass =
    tone === "bad"
      ? "border-accent bg-accent text-white shadow-[0_10px_24px_rgba(209,19,58,0.24)]"
      : tone === "good"
        ? "border-white/14 bg-white/6 text-white"
        : tone === "warn"
          ? "border-white/14 bg-white/6 text-slate-100"
          : "border-white/14 bg-white/6 text-slate-200";

  return (
    <span
      className={`nav-pill inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

export function AdminSection({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100">
              <Icon size={20} strokeWidth={2.2} />
            </span>
          ) : null}
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
        </div>
        {description ? (
          <p className="max-w-4xl text-base leading-7 text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AdminKeyValueGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[24px] border border-input bg-white/[0.03] p-4"
        >
          <dt className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm leading-7 text-white">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
