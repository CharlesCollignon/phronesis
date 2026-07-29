"use client";

import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts/core";

import { EChart } from "@/components/charts/echart";
import { couleurGroupe } from "@/lib/spectre-groupes";

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
  pour: number;
  contre: number;
  abstentions: number;
  parGroupe: GroupeVote[];
};

export function ScrutinCharts({
  pour,
  contre,
  abstentions,
  parGroupe,
}: ScrutinChartsProps): React.ReactElement {
  const donut = useMemo((): EChartsCoreOption => {
    return {
      color: ["#059669", "#e11d48", "#d97706"],
      tooltip: { trigger: "item" },
      legend: {
        bottom: 0,
        textStyle: { color: "#5a6675", fontSize: 11 },
      },
      series: [
        {
          type: "pie",
          radius: ["48%", "72%"],
          center: ["50%", "46%"],
          label: { show: false },
          data: [
            { name: "Pour", value: pour },
            { name: "Contre", value: contre },
            { name: "Abst.", value: abstentions },
          ],
        },
      ],
    };
  }, [pour, contre, abstentions]);

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
        axisLabel: { rotate: 35, fontSize: 10, color: "#5a6675" },
      },
      yAxis: { type: "value", splitLine: { lineStyle: { opacity: 0.2 } } },
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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className=" border border-border bg-card p-3 sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Répartition des votes
        </p>
        <EChart option={donut} height={260} />
      </div>
      <div className=" border border-border bg-card p-3 sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Par groupe (top 12)
        </p>
        <EChart option={bars} height={280} />
        <ul className="mt-2 flex flex-wrap gap-2">
          {parGroupe.slice(0, 8).map((g) => (
            <li
              key={g.groupeUid ?? g.libelle}
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
            >
              <span
                className="h-2 w-2"
                style={{
                  background: couleurGroupe(
                    g.libelleAbrege,
                    g.couleur,
                  ),
                }}
              />
              {g.libelleAbrege ?? "?"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
