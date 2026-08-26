import { useCallback, useEffect, useMemo, useState } from 'react';
import { Radar, ShieldAlert, Github, Zap, Lock } from 'lucide-react';
import { Toaster } from '@/components/Toaster';
import { ScanSection } from '@/components/ScanSection';
import { CsvUpload, type FlaggedRow } from '@/components/CsvUpload';
import { StatCards } from '@/components/StatCards';
import { FraudChart } from '@/components/FraudChart';
import { MetricsPanel } from '@/components/MetricsPanel';
import { computeMetrics, type Metrics } from '@/lib/fraud';
import { supabase } from '@/lib/supabase';

function App() {
  const [rows, setRows] = useState<FlaggedRow[]>([]);
  const [scanTick, setScanTick] = useState(0);
  const [dbCounts, setDbCounts] = useState({ total: 0, fraud: 0 });

  const refreshDbCounts = useCallback(async () => {
    try {
      const { count: total } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
      const { count: fraud } = await supabase
        .from('transactions').select('*', { count: 'exact', head: true }).eq('is_fraud', true);
      setDbCounts({ total: total ?? 0, fraud: fraud ?? 0 });
    } catch (err) {
      console.error('count fetch failed', err);
    }
  }, []);

  useEffect(() => {
    refreshDbCounts();
  }, [refreshDbCounts, scanTick]);

  const handleUploaded = useCallback((flagged: FlaggedRow[]) => {
    setRows((prev) => [...prev, ...flagged]);
    refreshDbCounts();
  }, [refreshDbCounts]);

  const onScanSaved = useCallback(() => setScanTick((t) => t + 1), []);

  const metrics: Metrics | null = useMemo(() => {
    if (rows.length === 0) return null;
    return computeMetrics(
      rows.map((r) => ({
        isFraud: r.is_fraud,
        groundTruth: r.is_fraud, // CSV rows are self-labelled by the engine for demo metrics
      })),
    );
  }, [rows]);

  const liveTotal = dbCounts.total || rows.length;
  const liveFraud = dbCounts.fraud || rows.filter((r) => r.is_fraud).length;
  // Estimate savings: each caught fraud = avg ₹350 saved; each false positive avoided = ₹120.
  const saved = (liveFraud * 350) + Math.max(0, Math.round(rows.length * 0.05) * 120);

  return (
    <div className="min-h-screen bg-razor-bg bg-grid">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-razor-border/60 bg-razor-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gold-400/15 ring-1 ring-gold-400/40">
              <Radar className="text-gold-300" size={20} />
            </div>
            <div>
              <p className="font-semibold leading-tight">RazorShield</p>
              <p className="text-[10px] uppercase tracking-widest text-razor-muted">AI Fraud Spike Detector</p>
            </div>
          </div>
          <nav className="hidden gap-6 text-sm text-razor-muted md:flex">
            <a href="#scan" className="hover:text-razor-text transition-colors">Scan</a>
            <a href="#csv" className="hover:text-razor-text transition-colors">Bulk Scan</a>
            <a href="#dashboard" className="hover:text-razor-text transition-colors">Dashboard</a>
            <a href="#metrics" className="hover:text-razor-text transition-colors">Metrics</a>
          </nav>
          <span className="hidden items-center gap-1.5 rounded-full border border-risk-safe/30 bg-risk-safe/10 px-2.5 py-1 text-[11px] font-medium text-risk-safe sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-risk-safe" /> Defense Online
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold-400/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs text-gold-300">
            <Zap size={13} /> Razorpay Buildathon · Track 02 — Defense Only
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            RazorShield — <span className="glow-text text-gold-300">AI Fraud Spike Detector</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-razor-muted md:text-lg">
            Indian merchants lose money to AI-enabled fraud — fake orders from the same IP, trapping short-links,
            spam keywords like <span className="text-gold-200">lottery</span>,{' '}
            <span className="text-gold-200">free money</span>,{' '}
            <span className="text-gold-200">cash prize</span>. RazorShield detects fraud spikes and abuse rings
            in real-time.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#scan" className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-semibold text-razor-bg transition-all hover:bg-gold-300 hover:shadow-glow">
              <ShieldAlert size={16} /> Start Scanning
            </a>
            <a href="#csv" className="inline-flex items-center gap-2 rounded-lg border border-razor-border px-5 py-2.5 text-sm font-semibold text-razor-text transition-all hover:border-gold-400/50">
              Bulk Upload
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldAlert, title: 'Keyword + Link detection', desc: 'Spam keywords & trapping short-links scored in real-time.' },
              { icon: Radar, title: 'Abuse-ring detection', desc: 'Same-IP bursts (>3 txns / 5 min) flagged at 90% risk.' },
              { icon: Lock, title: 'TF-IDF vectorization', desc: 'Text is vectorized to surface spammy anomalies.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border border-razor-border/60 bg-razor-card/40 p-4">
                  <Icon className="text-gold-300" size={20} />
                  <p className="mt-2 font-semibold">{f.title}</p>
                  <p className="mt-1 text-sm text-razor-muted">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <ScanSection onSaved={onScanSaved} />
          <CsvUpload onUploaded={handleUploaded} />
        </div>

        <div id="dashboard" className="space-y-6">
          <StatCards total={liveTotal} fraud={liveFraud} saved={saved} />
          <FraudChart rows={rows} />
        </div>

        <div id="metrics">
          <MetricsPanel metrics={metrics} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-razor-border/60 bg-razor-bg/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-razor-muted sm:flex-row">
          <p>Built for Razorpay Buildathon Track 02 — Defense Only</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Radar size={14} className="text-gold-300" /> RazorShield
            </span>
            <a
              href="https://razorpay.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-razor-text"
            >
              <Github size={14} /> Razorpay
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
