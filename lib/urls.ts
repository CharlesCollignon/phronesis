/** Liens vers les sources officielles Assemblée nationale. */

/** Photo officielle député (tribun, législature courante). */
export function urlPhotoDepute(
  uid: string,
  legislature = 17,
): string {
  const id = uid.replace(/^PA/i, "");
  return (
    `https://www.assemblee-nationale.fr/dyn/static/tribun/` +
    `${legislature}/photos/${id}.jpg`
  );
}

/**
 * Photo sénateur — pattern senat.fr (peut 404 selon matricule).
 * Le composant Avatar gère le fallback.
 */
export function urlPhotoSenateur(
  matricule: string | null | undefined,
  prenom: string,
  nom: string,
): string | null {
  if (!matricule) return null;
  const id = matricule.replace(/\s+/g, "").toLowerCase();
  const slug =
    `${nom}_${prenom}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  return `https://www.senat.fr/senimg/${slug}${id}.jpg`;
}

export function urlDossierAn(
  legislature: number,
  titreChemin: string | null,
): string | null {
  if (!titreChemin) return null;
  return (
    `https://www.assemblee-nationale.fr/dyn/${legislature}` +
    `/dossiers/${titreChemin}`
  );
}

export function urlDocumentAn(uid: string): string {
  return `https://www.assemblee-nationale.fr/dyn/docs/${uid}.raw`;
}

export function urlDeputeAn(uid: string): string {
  return `https://www.assemblee-nationale.fr/dyn/deputes/${uid}`;
}

export function urlScrutinAn(
  legislature: number,
  numero: number,
): string {
  return (
    `https://www.assemblee-nationale.fr/dyn/${legislature}` +
    `/scrutins/${numero}`
  );
}

export function urlOpenDataAn(): string {
  return "https://data.assemblee-nationale.fr/";
}

export function urlOpenDataSenat(): string {
  return "https://data.senat.fr/";
}

/** Fiche sénateur sur senat.fr (matricule ODSEN, ex. 83008P). */
export function urlSenateurSenat(
  matricule: string | null | undefined,
): string | null {
  if (!matricule) return null;
  const id = matricule.replace(/\s+/g, "");
  return `https://www.senat.fr/senateur/${id.toLowerCase()}.html`;
}

export function urlScrutinSenat(
  sessionAnnee: number,
  numero: number,
): string {
  return (
    `https://www.senat.fr/scrutin-public/scr${sessionAnnee}` +
    `/scr${sessionAnnee}-${numero}.html`
  );
}
