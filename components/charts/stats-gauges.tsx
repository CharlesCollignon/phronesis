"use client";

import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts/core";

import { EChart } from "@/components/charts/echart";

type StatsGaugesProps = {
  participation: number | null;
  fidelite: number | null;
};

function gaugeOption(
  value: number | null,
  name: string,
): EChartsCoreOption {
  const v =
    value == null ? 0 : Math.round(Math.max(0, Math.min(1, value)) * 100);
  return {
    series: [
      {
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        pointer: { show: false },
        progress: {
          show: true,
          width: 12,
          itemStyle: { color: "#b8892d" },
        },
        axisLine: {
          lineStyle: { width: 12, color: [[1, "#e4e9f0"]] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          formatter: value == null ? "—" : "{value} %",
          fontSize: 22,
          fontFamily: "Fraunces, Georgia, serif",
          color: "#0a1628",
          offsetCenter: [0, "10%"],
        },
        title: {
          offsetCenter: [0, "55%"],
          fontSize: 11,
          color: "#5a6675",
        },
        data: [{ value: v, name }],
      },
    ],
  };
}

export function StatsGauges({
  participation,
  fidelite,
}: StatsGaugesProps): React.ReactElement {
  const optP = useMemo(
    () => gaugeOption(participation, "Participation"),
    [participation],
  );
  const optF = useMemo(
    () => gaugeOption(fidelite, "Fidélité groupe"),
    [fidelite],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className=" border border-border bg-card p-2">
        <EChart option={optP} height={180} />
      </div>
      <div className=" border border-border bg-card p-2">
        <EChart option={optF} height={180} />
      </div>
    </div>
  );
}
