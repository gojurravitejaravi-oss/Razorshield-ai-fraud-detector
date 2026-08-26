import { Activity, IndianRupee, ShieldAlert } from 'lucide-react';

type Props = {
  total: number;
  fraud: number;
  saved: number;
};

export function StatCards({ total, fraud, saved }: Props) {
  const cards = [
    {
      label: 'Total Transactions',
      value: total.toLocaleString('en-IN'),
      icon: Activity,
      accent: 'text-gold-300',
      ring: 'border-gold-400/30',
    },
    {
      label: 'Fraud Detected',
      value: fraud.toLocaleString('en-IN'),
      icon: ShieldAlert,
      accent: 'text-risk-high',
      ring: 'border-risk-high/40',
      pulse: fraud > 0,
    },
    {
      label: 'False-Positive Cost Saved',
      value: `₹${saved.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      accent: 'text-risk-safe',
      ring: 'border-risk-safe/40',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-2xl border ${c.ring} bg-razor-card/70 p-5 shadow-card animate-fadeIn ${c.pulse ? 'animate-pulseGlow' : ''}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-razor-muted">{c.label}</p>
              <Icon className={c.accent} size={20} />
            </div>
            <p className={`mt-3 text-3xl font-bold ${c.accent}`}>{c.value}</p>
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gold-400/5 blur-2xl" />
          </div>
        );
      })}
    </div>
  );
}
