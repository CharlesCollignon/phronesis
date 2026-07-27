"use client";

import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts/core";

import { EChart } from "@/components/charts/echart";

type PhiloRadarProps = {
  items: { label: string; score: number }[];
};

export function PhiloRadar({
  items,
}: PhiloRadarProps): React.ReactElement {
  const option = useMemo((): EChartsCoreOption => {
    const labels = items.map((i) => i.label);
    const values = items.map((i) =>
      Math.round(Math.max(0, Math.min(1, i.score)) * 100),
    );
    return {
      tooltip: { trigger: "item" },
      radar: {
        indicator: labels.map((name) => ({ name, max: 100 })),
        radius: "62%",
        axisName: { color: "#5a6675", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(10,22,40,0.12)" } },
        splitArea: { show: false },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: values,
              name: "Proximité",
              areaStyle: { color: "rgba(184,137,45,0.25)" },
              lineStyle: { color: "#b8892d" },
              itemStyle: { color: "#b8892d" },
            },
          ],
        },
      ],
    };
  }, [items]);

  return <EChart option={option} height={300} />;
}
