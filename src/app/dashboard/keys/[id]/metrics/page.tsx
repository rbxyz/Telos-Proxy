"use client";

import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

function Line({ points, color = "#4f46e5" }: { points: Array<{ x: number; y: number }>; color?: string }) {
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return <path d={d} fill="none" stroke={color} strokeWidth={2} />;
}

export default function KeyMetricsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const days = 7;
  const { data } = api.metrics.byApiKey.useQuery({ apiKeyId: id, days });

  const width = 600;
  const height = 220;
  const padding = 32;

  const totals = data ?? [];
  const maxTotal = Math.max(1, ...totals.map((d) => d.total));
  const maxLatency = Math.max(1, ...totals.map((d) => d.avgLatencyMs));

  const xStep = (width - padding * 2) / Math.max(1, totals.length - 1);

  const pointsTotal = totals.map((d, i) => ({
    x: padding + i * xStep,
    y: height - padding - (d.total / maxTotal) * (height - padding * 2),
  }));
  const pointsLatency = totals.map((d, i) => ({
    x: padding + i * xStep,
    y: height - padding - (d.avgLatencyMs / maxLatency) * (height - padding * 2),
  }));

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Métricas da Chave</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="mb-2 font-medium">Total de chamadas (últimos {days} dias)</h2>
          <svg width={width} height={height} className="w-full">
            <Line points={pointsTotal} color="#4f46e5" />
          </svg>
        </div>
        <div className="rounded border p-4">
          <h2 className="mb-2 font-medium">Latência média (ms)</h2>
          <svg width={width} height={height} className="w-full">
            <Line points={pointsLatency} color="#16a34a" />
          </svg>
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="mb-2 font-medium">Taxa de acerto do cache</h2>
        <div className="text-2xl">
          {totals.length > 0
            ? `${Math.round((totals.reduce((a, b) => a + b.cacheRatio, 0) / totals.length) * 100)}%`
            : "-"}
        </div>
      </div>
    </main>
  );
}

