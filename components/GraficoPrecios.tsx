"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

export default function GraficoPrecios({
  historial,
}: {
  historial: { precio: number; created_at: string }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const datos = [...historial].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: datos.map((h) =>
          new Date(h.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
        ),
        datasets: [
          {
            data: datos.map((h) => h.precio),
            borderColor: "#dc2626",
            backgroundColor: "rgba(220,38,38,0.08)",
            fill: true,
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: "#dc2626",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `${Number(item.parsed.y).toLocaleString("es-ES")} €`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (v) => `${Number(v) / 1000}k €`,
              color: "#a8a29e",
              font: { size: 11 },
            },
            grid: { color: "#e7e5e4" },
          },
          x: {
            ticks: { color: "#a8a29e", font: { size: 11 } },
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [historial]);

  return (
    <div style={{ position: "relative", width: "100%", height: 160 }}>
      <canvas ref={canvasRef} role="img" aria-label="Evolución del precio del anuncio" />
    </div>
  );
}
