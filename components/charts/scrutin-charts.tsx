"use client";

import { useMemo } from "react";
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

export function ScrutinCharts({
  parGroupe,
}: ScrutinChartsProps): React.ReactElement {
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
    return {
      tooltip: { trigger: "axis" },
      legend: {
        bottom: 0,
        textStyle: { color: "#5a6675", fontSize: 11 },
      },
      grid: {
        left: 8,
        right: 8,
        top: 16,
        bottom: 48,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          rotate: 35,
          fontSize: 10,
          color: "#5a6675",
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { opacity: 0.2 } },
      },
      series: [
        {
          name: "Pour",
          type: "bar",
          stack: "v",
          data: rows.map((g) => g.pour),
          itemStyle: { color: "#059669" },
        },
        {
          name: "Contre",
          type: "bar",
          stack: "v",
          data: rows.map((g) => g.contre),
          itemStyle: { color: "#e11d48" },
        },
        {
          name: "Abst.",
          type: "bar",
          stack: "v",
          data: rows.map((g) => g.abstention),
          itemStyle: { color: "#d97706" },
        },
      ],
    };
  }, [parGroupe]);

  return (
    <div className="border border-border bg-card p-3 sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Par groupe (top 12)
      </p>
      <EChart option={bars} height={320} />
    </div>
  );
}
