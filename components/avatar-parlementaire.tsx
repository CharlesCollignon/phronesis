"use client";

import { useState } from "react";
import Image from "next/image";

import { texteSur } from "@/components/groupe-couleur";
import { cn } from "@/lib/utils";

type AvatarParlementaireProps = {
  src: string | null;
  prenom: string;
  nom: string;
  size?: number;
  /** Couleur du groupe : fond du monogramme quand il n'y a pas de photo. */
  couleur?: string | null;
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

/** Photo officielle, avec repli sur un monogramme aux couleurs du groupe. */
export function AvatarParlementaire({
  src,
  prenom,
  nom,
  size = 48,
  couleur,
  className,
}: AvatarParlementaireProps): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  if (!showImg) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center font-semibold tracking-[0.02em]",
          !couleur && "bg-foreground text-background",
          className,
        )}
        style={{
          width: size,
          height: size,
          ...(couleur
            ? { backgroundColor: couleur, color: texteSur(couleur) }
            : {}),
          fontSize: Math.round(size * 0.34),
        }}
        aria-hidden
      >
        {initials(prenom, nom)}
      </span>
    );
  }

  const image = (
    <Image
      src={src!}
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 bg-muted object-cover object-top",
        !couleur && className,
      )}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
  if (!couleur) return image;
  // Bandeau à la couleur du groupe sous la photo.
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {image}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          height: Math.max(3, Math.round(size * 0.06)),
          backgroundColor: couleur,
        }}
      />
    </span>
  );
}
