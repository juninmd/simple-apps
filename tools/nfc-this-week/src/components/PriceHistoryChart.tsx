import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { GroupedItem } from '../types/receipt';
import { getPriceHistory, calculatePriceStats } from '../utils/priceHistory';
import { Calendar, Store, Tag, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceHistoryChartProps {
  item: GroupedItem | null;
  onRenderBenchmarkComplete?: (renderTimeMs: number) => void;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  item,
  onRenderBenchmarkComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [renderDuration, setRenderDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !item) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const startTime = performance.now();
    const history = getPriceHistory(item);

    const labels = history.map((point) => point.date);
    const dataPrices = history.map((point) => point.unitPrice);

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const options: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 200,
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            title: (tooltipItems) => {
              const idx = tooltipItems[0].dataIndex;
              const point = history[idx];
              return `Date: ${point.date}`;
            },
            beforeBody: (tooltipItems) => {
              const idx = tooltipItems[0].dataIndex;
              const point = history[idx];
              return `Store: ${point.store}`;
            },
            label: (tooltipItem) => {
              const idx = tooltipItem.dataIndex;
              const point = history[idx];
              return `Unit Price: R$ ${point.unitPrice.toFixed(2)}`;
            },
            afterBody: (tooltipItems) => {
              const idx = tooltipItems[0].dataIndex;
              const point = history[idx];
              return point.rawDescription !== item.canonicalDescription
                ? `Receipt desc: ${point.rawDescription}`
                : '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
              family: 'Inter, system-ui, sans-serif',
            },
            color: '#64748b',
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            color: '#f1f5f9',
          },
          ticks: {
            font: {
              size: 11,
              family: 'ui-monospace, monospace',
            },
            color: '#64748b',
            callback: (value) => `R$ ${Number(value).toFixed(2)}`,
          },
        },
      },
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Unit Price',
            data: dataPrices,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#4f46e5',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#4338ca',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2.5,
            fill: true,
            tension: 0.2,
          },
        ],
      },
      options,
    });

    const elapsed = performance.now() - startTime;
    setRenderDuration(elapsed);
    if (onRenderBenchmarkComplete) {
      onRenderBenchmarkComplete(elapsed);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [item, onRenderBenchmarkComplete]);

  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
        <Tag className="w-12 h-12 mb-3 text-slate-300 stroke-[1.5]" />
        <h3 className="text-base font-medium text-slate-600 mb-1">No Item Selected</h3>
        <p className="text-sm text-slate-400 max-w-sm text-center">
          Click an item from the options list on the left to inspect its historical unit prices and price trajectory.
        </p>
      </div>
    );
  }

  const history = getPriceHistory(item);
  const stats = calculatePriceStats(history);
  const isUp = stats.diff > 0;
  const isDown = stats.diff < 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header with Title and Price Indicators */}
      <div className="p-6 border-b border-slate-100 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <span>Price History</span>
              <span>•</span>
              <span className="text-slate-400">Chart.js</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {item.canonicalDescription}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Normalized: "{item.normalizedDescription}"
            </p>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Latest Price</span>
              <span className="text-2xl font-bold font-mono text-slate-900">
                R$ {stats.currentPrice.toFixed(2)}
              </span>
            </div>

            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                isUp
                  ? 'bg-rose-50 text-rose-700'
                  : isDown
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isUp && <TrendingUp className="w-3.5 h-3.5" />}
              {isDown && <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isUp ? '+' : ''}
                {stats.percentageChange.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block">Min Price</span>
            <span className="font-semibold font-mono text-slate-800 text-sm mt-0.5 block">
              R$ {stats.minPrice.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block">Avg Price</span>
            <span className="font-semibold font-mono text-slate-800 text-sm mt-0.5 block">
              R$ {stats.averagePrice.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block">Max Price</span>
            <span className="font-semibold font-mono text-slate-800 text-sm mt-0.5 block">
              R$ {stats.maxPrice.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="text-slate-500 block">Receipts Count</span>
            <span className="font-semibold font-mono text-slate-800 text-sm mt-0.5 block">
              {item.itemCount} receipts
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 p-6 min-h-[320px] relative">
        <canvas ref={canvasRef} data-testid="price-chart-canvas" />
      </div>

      {/* Footer / Performance Badge / Recent History Entries */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Range: {history[0]?.date} <ArrowRight className="w-3 h-3 inline text-slate-300" /> {history[history.length - 1]?.date}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>Stores: {new Set(history.map(h => h.store)).size} stores</span>
          </span>
        </div>

        {renderDuration !== null && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            <span>Render: {renderDuration.toFixed(1)}ms (&lt;500ms budget)</span>
          </div>
        )}
      </div>
    </div>
  );
};
