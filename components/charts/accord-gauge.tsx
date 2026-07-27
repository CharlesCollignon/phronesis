"use client";

import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts/core";

import { EChart } from "@/components/charts/echart";

type AccordGaugeProps = {
  taux: number | null;
};

export function AccordGauge({
  taux,
}: AccordGaugeProps): React.ReactElement {
  const option = useMemo((): EChartsCoreOption => {
    const v =
      taux == null
        ? 0
        : Math.round(Math.max(0, Math.min(1, taux)) * 100);
    return {
      series: [
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          progress: {
            show: true,
            width: 14,
            itemStyle: { color: "#059669" },
          },
          pointer: {
            length: "55%",
            width: 4,
            itemStyle: { color: "#0a1628" },
          },
          axisLine: {
            lineStyle: { width: 14, color: [[1, "#e4e9f0"]] },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            formatter: taux == null ? "—" : "{value} %",
            fontSize: 28,
            fontFamily: "Fraunces, Georgia, serif",
            color: "#0a1628",
            offsetCenter: [0, "70%"],
          },
          title: {
            offsetCenter: [0, "92%"],
            fontSize: 12,
            color: "#5a6675",
          },
          data: [{ value: v, name: "Taux d'accord" }],
        },
      ],
    };
  }, [taux]);

  return (
    <div className=" border border-[var(--border)] bg-[var(--surface)] p-2">
      <EChart option={option} height={220} />
    </div>
  );
}
