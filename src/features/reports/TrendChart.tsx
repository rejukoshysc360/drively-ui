import React, { useMemo } from "react";

type TrendPoint = { date: string; hours: number; util_percent: number };

export default function TrendChart({
  trend,
  dailyCapacity,
  projectMixByDate,
  height = 160,
}: {
  trend: TrendPoint[];
  dailyCapacity?: number;
  projectMixByDate?: Record<string, any>;
  height?: number;
}) {
  const width = 480;

  const data = Array.isArray(trend) ? trend : [];
  const maxHours = Math.max(1, ...data.map((d) => d.hours || 0), dailyCapacity || 0);
  const maxUtil = 150;

  const pad = { top: 10, right: 10, bottom: 22, left: 26 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const xStep = data.length ? innerW / data.length : innerW;
  const barWidth = Math.max(2, xStep * 0.6);

  const points = useMemo(() => {
    return data.map((d, i) => {
      const xCenter = pad.left + i * xStep + xStep / 2;
      const barH = maxHours ? (d.hours / maxHours) * innerH : 0;
      const barTopY = pad.top + (innerH - barH);

      const utilY =
        pad.top + innerH - (Math.min(maxUtil, d.util_percent) / maxUtil) * innerH;

      return {
        ...d,
        x: xCenter,
        barX: xCenter - barWidth / 2,
        barY: barTopY,
        barH,
        utilX: xCenter,
        utilY,
      };
    });
  }, [data, innerH, innerW, xStep, barWidth, pad.left, pad.top, maxHours]);

  const pathD = useMemo(() => {
    if (!points.length) return "";
    return points
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.utilX} ${p.utilY}`)
      .join(" ");
  }, [points]);

  const getBarColor = (p: any) => {
    if (p.hours === 0) return "#9CA3AF"; // gray fade
    if (p.util_percent > 100) return "#EF4444"; // red
    if (p.util_percent >= 70) return "#10B981"; // green
    return "#F59E0B"; // amber
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block">
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#E5E7EB" />
        <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#E5E7EB" />

        {points.map((p, idx) => (
          <rect
            key={idx}
            x={p.barX}
            y={p.barY}
            width={barWidth}
            height={p.barH}
            fill={getBarColor(p)}
            opacity={p.hours === 0 ? 0.3 : 0.8}
          >
            <title>
              {p.date}
              {"\n"}Hours: {p.hours}
              {dailyCapacity ? ` / ${dailyCapacity}` : ""}
              {"\n"}Util: {p.util_percent}%
            </title>
          </rect>
        ))}

        <path d={pathD} fill="none" stroke="#2563EB" strokeWidth={2} />

        {points.map((p, idx) => (
          <circle key={idx} cx={p.utilX} cy={p.utilY} r={3} fill="#2563EB">
            <title>
              {p.date}
              {"\n"}Util: {p.util_percent}%
            </title>
          </circle>
        ))}

        {points.map((p, idx) => {
          const show = points.length <= 7 || idx % Math.ceil(points.length / 7) === 0;
          return (
            show && (
              <text
                key={`lbl-${idx}`}
                x={p.x}
                y={height - 6}
                fontSize="10"
                textAnchor="middle"
                fill="#6B7280"
              >
                {p.date.slice(5)}
              </text>
            )
          );
        })}
      </svg>

      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#2563EB]" /> Util % (line)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#10B981]/30" /> Good
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#F59E0B]/30" /> Low util
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[#EF4444]/30" /> Overload
        </span>
      </div>
    </div>
  );
}
