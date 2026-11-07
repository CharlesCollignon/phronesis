"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type AvatarParlementaireProps = {
  src: string | null;
  prenom: string;
  nom: string;
  size?: number;
  className?: string;
};

/** Initiales : prénom + premier mot significatif du nom (« de Courson » → C). */
function initials(prenom: string, nom: string): string {
  const a = prenom.trim().charAt(0);
  const last = nom
    .trim()
    .replace(/^(de |du |des |d'|d’|le |la |van |von )/i, "");
  const b = last.charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

/** Photo officielle, avec repli sur un monogramme carré noir. */
export function AvatarParlementaire({
  src,
  prenom,
  nom,
  size = 48,
  className,
}: AvatarParlementaireProps): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  if (!showImg) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center bg-foreground font-semibold tracking-[0.02em] text-background",
          className,
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.34),
        }}
        aria-hidden
      >
        {initials(prenom, nom)}
      </span>
    );
  }

  return (
    <Image
      src={src!}
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 bg-muted object-cover object-top",
        className,
      )}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
