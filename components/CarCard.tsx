import type { ReactNode } from "react";
import Image from "next/image";

type CarCardProps = {
  name: string;
  price: string;
  category: string;
  image: string;
  imageBadge?: ReactNode;
  indicator?: ReactNode;
  footer?: ReactNode;
};

export function CarCard({
  name,
  price,
  category,
  image,
  imageBadge,
  indicator,
  footer,
}: CarCardProps) {
  return (
    <article className="group interactive-panel page-panel overflow-hidden rounded-[28px] border border-input bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)]">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          draggable={false}
          className="pointer-events-none object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {imageBadge ? <div className="absolute right-4 top-4">{imageBadge}</div> : null}
      </div>

      <div className="space-y-4 p-5">
        <span className="inline-flex rounded-full border border-input bg-input px-3 py-1 text-xs font-medium text-slate-300">
          {category}
        </span>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-white">
            {name}
          </h3>
          <p className="text-base font-medium text-slate-300">{price}</p>
        </div>

        {indicator}

        {footer ?? (
          <button className="app-button inline-flex items-center justify-center rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-accent">
            View details
          </button>
        )}
      </div>
    </article>
  );
}
