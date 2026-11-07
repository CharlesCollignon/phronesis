"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts/core";

import { EChart } from "@/components/charts/echart";

type GroupeVote = {
  groupeUid: string | null;
  libelle: string | null;
  libelleAbrege: string | null;
  couleur: string | null;
  pour: number;
  contre: number;
  abstention: number;
};

type ScrutinChartsProps = {
  parGroupe: GroupeVote[];
};

type Palette = {
  pour: string;
  contre: string;
  abstention: string;
  text: string;
  muted: string;
  border: string;
  background: string;
};

const LIGHT: Palette = {
  pour: "#0A0A0A",
  contre: "#8A8A8A",
  abstention: "#CFCFCF",
  text: "#0A0A0A",
  muted: "#5C5C5C",
  border: "#DADADA",
  background: "#FFFFFF",
};

/** Lit les couleurs du thème courant (clair / sombre) depuis les variables CSS. */
function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string): string =>
    css.getPropertyValue(name).trim() || fallback;
  return {
    pour: v("--vote-pour", LIGHT.pour),
    contre: v("--vote-contre", LIGHT.contre),
    abstention: v("--vote-abstention", LIGHT.abstention),
    text: v("--foreground", LIGHT.text),
    muted: v("--muted-foreground", LIGHT.muted),
    border: v("--border", LIGHT.border),
    background: v("--background", LIGHT.background),
  };
}

/** Effectifs par groupe (barres empilées, monochrome). */
export function ScrutinCharts({
  parGroupe,
}: ScrutinChartsProps): React.ReactElement {
  const [palette, setPalette] = useState<Palette>(LIGHT);

  useEffect(() => {
    const sync = (): void => setPalette(readPalette());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const bars = useMemo((): EChartsCoreOption => {
    const rows = [...parGroupe]
      .filter((g) => g.groupeUid)
      .sort(
        (a, b) =>
          b.pour +
          b.contre +
          b.abstention -
          (a.pour + a.contre + a.abstention),
      )
      .slice(0, 12);
    const labels = rows.map(
      (g) => g.libelleAbrege ?? g.libelle ?? "?",
    );
    const font = "Archivo, system-ui, sans-serif";
    const serie = (
      name: string,
      data: number[],
      color: string,
    ): Record<string, unknown> => ({
      name,
      type: "bar",
      stack: "v",
      data,
      barMaxWidth: 28,
      itemStyle: { color, borderColor: palette.background, borderWidth: 1 },
      emphasis: { focus: "series" },
    });
    return {
      textStyle: { fontFamily: font },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: palette.background,
        borderColor: palette.text,
        borderWidth: 1,
        borderRadius: 0,
        textStyle: { color: palette.text, fontFamily: font, fontSize: 13 },
      },
      legend: {
        bottom: 0,
        left: 0,
        icon: "rect",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 18,
        textStyle: { color: palette.muted, fontSize: 13, fontFamily: font },
      },
      grid: {
        left: 0,
        right: 8,
        top: 12,
        bottom: 40,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: palette.text } },
        axisTick: { show: false },
        axisLabel: {
          interval: 0,
          rotate: labels.length > 8 ? 35 : 0,
          fontSize: 12,
          color: palette.muted,
          fontFamily: font,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 12, color: palette.muted, fontFamily: font },
        splitLine: { lineStyle: { color: palette.border, opacity: 0.6 } },
      },
      series: [
        serie("Pour", rows.map((g) => g.pour), palette.pour),
        serie("Contre", rows.map((g) => g.contre), palette.contre),
        serie("Abstention", rows.map((g) => g.abstention), palette.abstention),
      ],
    };
  }, [parGroupe, palette]);

  return <EChart option={bars} height={320} />;
}
