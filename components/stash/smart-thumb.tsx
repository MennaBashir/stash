"use client";

import { useState } from "react";
import { hostOf, tintOf } from "@/lib/media";
import { cn } from "cn";

interface SmartThumbProps {
  url: string;
  image?: string;
  favicon?: string;
  alt: string;
  className?: string;
}

export function SmartThumb({
  url,
  image,
  favicon,
  alt,
  className,
}: SmartThumbProps) {
  const [stage, setStage] = useState<"image" | "favicon" | "tile">(
    image ? "image" : favicon ? "favicon" : "tile"
  );
  const [hasFavicon, setHasFavicon] = useState(Boolean(favicon));

  if (stage === "tile" || !hasFavicon) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center size-full text-2xl font-medium text-foreground/50",
          className
        )}
        style={{ backgroundColor: tintOf(url) }}
      >
        <span className="truncate max-w-[70%]">{hostOf(url)}</span>
      </div>
    );
  }

  const src = stage === "image" ? image : (favicon ?? undefined);

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(
        "size-full object-cover",
        stage === "favicon" && "object-contain p-8",
        className
      )}
      onError={() => {
        if (stage === "image" && hasFavicon) setStage("favicon");
        else setHasFavicon(false);
      }}
    />
  );
}
