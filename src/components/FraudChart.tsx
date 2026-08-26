import { useMemo } from 'react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { FlaggedRow } from './CsvUpload';

type Point = { time: string; fraud: number; total: number };

const DUMMY: Point[] = [
  { time: '10:00', fraud: 0, total: 1 },
  { time: '10:02', fraud: 2, total: 3 },
  { time: '10:04', fraud: 4, total: 5 },
  { time: '10:06', fraud: 3, total: 6 },
  { time: '10:08', fraud: 1, total: 7 },
  { time: '10:10', fraud: 6, total: 9 },
  { time: '10:12', fraud: 8, total: 10 },
  { time: '10:14', fraud: 5, total: 11 },
  { time: '10:16', fraud: 2, total: 12 },
];

export function FraudChart({ rows }: { rows: FlaggedRow[] }) {
  const data = useMemo<Point[]>(() => {
    if (rows.length === 0) return DUMMY;
    // Use row index as time bucket for the chart.
    const buckets: Record<string, Point> = {};
    rows.forEach((r, i) => {
      const bucket = `T${i + 1}`;
      if (!buckets[bucket]) buckets[bucket] = { time: bucket, fraud: 0, total: 0 };
      buckets[bucket].total += 1;
      if (r.is_fraud) buckets[bucket].fraud += 1;
    });
    // Convert to cumulative series for a nicer "spike" look.
    const arr = Object.values(buckets);
    let runFraud = 0, runTotal = 0;
    return arr.map((p) => {
      runFraud += p.fraud;
      runTotal += p.total;
      return { time: p.time, fraud: runFraud, total: runTotal };
    });
  }, [rows]);

  return (
    <div className="rounded-2xl border border-razor-border bg-razor-card/70 p-6 shadow-card animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fraud Spike Over Time</h2>
        <span className="text-xs text-razor-muted">
          {rows.length === 0 ? 'Showing dummy data — upload a CSV' : `${rows.length} rows`}
        </span>
      </div>
      <div className="mt-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5C44C" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F5C44C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#232858" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#5B6494" tick={{ fontSize: 11 }} />
            <YAxis stroke="#5B6494" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#121633',
                border: '1px solid #232858',
                borderRadius: 8,
                fontSize: 12,
                color: '#E6E9F7',
              }}
              labelStyle={{ color: '#F5C44C' }}
            />
            <Area type="monotone" dataKey="total" stroke="#F5C44C" strokeWidth={2} fill="url(#totalGrad)" name="Total" />
            <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fill="url(#fraudGrad)" name="Fraud" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
