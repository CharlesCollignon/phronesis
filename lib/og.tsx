import { ImageResponse } from "next/og";

/**
 * Images de partage (Open Graph / X) aux couleurs du site : fond noir,
 * logo jaune, texte blanc. Les polices sont chargées depuis Google
 * Fonts au premier rendu ; en cas d'échec, la police par défaut de
 * `next/og` prend le relais plutôt que de casser l'image.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const JAUNE = "#ffbf00";
const NOIR = "#0a0a0a";
const GRIS = "#a3a3a3";

type FontDef = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

async function chargerPolice(
  family: string,
  weight: 400 | 700,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&display=swap`,
      // Un user-agent ancien fait servir du TrueType, lisible par Satori.
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" } },
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

let polices: Promise<FontDef[]> | null = null;

function chargerPolices(): Promise<FontDef[]> {
  polices ??= Promise.all([
    chargerPolice("Archivo", 400).then((d) => (d ? { name: "Archivo", data: d, weight: 400 as const } : null)),
    chargerPolice("Archivo", 700).then((d) => (d ? { name: "Archivo", data: d, weight: 700 as const } : null)),
    chargerPolice("Fugaz One", 400).then((d) => (d ? { name: "Fugaz One", data: d, weight: 400 as const } : null)),
  ]).then((list) =>
    list
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .map((f) => ({ ...f, style: "normal" as const })),
  );
  return polices;
}

function Drapeau(): React.ReactElement {
  return (
    <div style={{ display: "flex", width: 42, height: 28, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ flex: 1, background: "#000091" }} />
      <div style={{ flex: 1, background: "#ffffff" }} />
      <div style={{ flex: 1, background: "#e1000f" }} />
    </div>
  );
}

type CarteProps = {
  /** Petite ligne au-dessus du titre (ex. « Scrutin public n° 1234 »). */
  eyebrow?: string;
  title: string;
  /** Contenu libre sous le titre (barre de vote, groupe…). */
  children?: React.ReactNode;
  /** Pied de carte à droite (ex. « Assemblée nationale · 12 mars 2025 »). */
  footer?: string;
};

/** Taille du titre selon sa longueur, pour tenir sur la carte. */
function tailleTitre(title: string): number {
  if (title.length > 160) return 40;
  if (title.length > 110) return 48;
  if (title.length > 70) return 56;
  return 68;
}

export function couper(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

export async function carteOg({
  eyebrow,
  title,
  children,
  footer,
}: CarteProps): Promise<ImageResponse> {
  const fonts = await chargerPolices();
  const titre = couper(title, 200);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: NOIR,
          color: "#f2f2f2",
          padding: "56px 72px",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              fontFamily: "Fugaz One",
              fontSize: 40,
              color: JAUNE,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Phronesis
          </div>
          <Drapeau />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {eyebrow ? (
            <div style={{ fontSize: 28, color: JAUNE, display: "flex" }}>
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontSize: tailleTitre(titre),
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            {titre}
          </div>
          {children}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: GRIS,
            borderTop: "1px solid #2a2a2a",
            paddingTop: 22,
          }}
        >
          <div style={{ display: "flex" }}>Comprendre avant de juger</div>
          <div style={{ display: "flex" }}>{footer ?? "Données officielles du Parlement"}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}

/**
 * Barre pour / contre / abstention, en niveaux de gris comme sur le
 * site : aucune couleur ne suggère qu'une position est la bonne.
 */
export function BarreVote({
  pour,
  contre,
  abstention,
}: {
  pour: number;
  contre: number;
  abstention: number;
}): React.ReactElement {
  const total = Math.max(1, pour + contre + abstention);
  const seg = (n: number, color: string): React.ReactElement | null =>
    n > 0 ? <div style={{ width: `${(100 * n) / total}%`, background: color }} /> : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 6 }}>
      <div style={{ display: "flex", height: 22, width: "100%", borderRadius: 4, overflow: "hidden", background: "#262626" }}>
        {seg(pour, "#f2f2f2")}
        {seg(contre, "#8a8a8a")}
        {seg(abstention, "#4a4a4a")}
      </div>
      <div style={{ display: "flex", gap: 36, fontSize: 28 }}>
        <span style={{ color: "#f2f2f2" }}>{pour} pour</span>
        <span style={{ color: "#8a8a8a" }}>{contre} contre</span>
        <span style={{ color: "#6b6b6b" }}>
          {abstention} abstention{abstention > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
