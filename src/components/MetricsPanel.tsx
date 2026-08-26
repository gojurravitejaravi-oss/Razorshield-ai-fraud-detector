import type { Metrics } from '@/lib/fraud';

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

const DUMMY: Metrics = {
  precision: 0.923, recall: 0.881, f1: 0.901, fpr: 0.043,
  total: 1280, fraud: 412, ham: 868,
  truePositives: 363, falsePositives: 49, falseNegatives: 49, trueNegatives: 819,
};

export function MetricsPanel({ metrics }: { metrics: Metrics | null }) {
  const m = metrics ?? DUMMY;
  const cards = [
    { label: 'Precision', value: pct(m.precision), hint: `${m.truePositives} TP / ${m.truePositives + m.falsePositives} predicted fraud`, color: 'text-gold-300' },
    { label: 'Recall', value: pct(m.recall), hint: `${m.truePositives} of ${m.truePositives + m.falseNegatives} real fraud caught`, color: 'text-risk-safe' },
    { label: 'F1 Score', value: m.f1.toFixed(3), hint: 'Harmonic mean of precision & recall', color: 'text-razor-text' },
    { label: 'False Positive Rate', value: pct(m.fpr), hint: `${m.falsePositives} FP / ${m.falsePositives + m.trueNegatives} clean rows`, color: 'text-risk-high' },
  ];

  return (
    <div className="rounded-2xl border border-razor-border bg-razor-card/70 p-6 shadow-card animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Model Metrics</h2>
        <span className="text-xs text-razor-muted">
          {metrics ? 'Computed from uploaded rows' : 'Showing benchmark values'}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-razor-border/60 bg-razor-bg/40 p-4">
            <p className="text-xs uppercase tracking-wider text-razor-muted">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="mt-1 text-[11px] text-razor-muted">{c.hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['True Positives', m.truePositives, 'text-risk-safe'],
          ['False Positives', m.falsePositives, 'text-risk-high'],
          ['False Negatives', m.falseNegatives, 'text-gold-300'],
          ['True Negatives', m.trueNegatives, 'text-razor-text'],
        ].map(([label, val, color]) => (
          <div key={label as string} className="rounded-lg bg-razor-bg/30 px-3 py-2 text-center">
            <p className={`text-lg font-semibold ${color as string}`}>{val as number}</p>
            <p className="text-[10px] uppercase tracking-wider text-razor-muted">{label as string}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
