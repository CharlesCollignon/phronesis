"use client";

import { useState } from "react";
import Image from "next/image";

type AvatarParlementaireProps = {
  src: string | null;
  prenom: string;
  nom: string;
  size?: number;
  className?: string;
};

function initials(prenom: string, nom: string): string {
  const a = prenom.trim().charAt(0);
  const b = nom.trim().charAt(0);
  return `${a}${b}`.toUpperCase() || "?";
}

/** Photo officielle avec fallback initiales. */
export function AvatarParlementaire({
  src,
  prenom,
  nom,
  size = 48,
  className = "",
}: AvatarParlementaireProps): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  if (!showImg) {
    return (
      <span
        className={
          `inline-flex shrink-0 items-center justify-center ` +
          `bg-[var(--primary)] text-[var(--background)] ` +
          `font-medium ${className}`
        }
        style={{ width: size, height: size, fontSize: size * 0.32 }}
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
      className={
        `shrink-0 object-cover bg-muted ` +
        className
      }
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}
