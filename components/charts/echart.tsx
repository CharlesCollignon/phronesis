"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, GaugeChart, PieChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([
  BarChart,
  PieChart,
  GaugeChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

type EChartProps = {
  option: EChartsCoreOption;
  height?: number;
  className?: string;
};

/** Wrapper ECharts responsive (resize + dispose). */
export function EChart({
  option,
  height = 260,
  className = "",
}: EChartProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, {
      renderer: "canvas",
    });
    chartRef.current = chart;
    const onResize = (): void => {
      chart.resize();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={ref}
      className={`w-full ${className}`}
      style={{ height }}
      role="img"
    />
  );
}
