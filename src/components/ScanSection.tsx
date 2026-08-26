import { Loader2, ShieldCheck, ScanLine } from 'lucide-react';
import { useMemo, useState } from 'react';
import { calculateRiskScore, extractUrl, vectorize, type RiskResult } from '@/lib/fraud';
import { supabase, type ScanRow } from '@/lib/supabase';
import { toast } from '@/lib/toast';

const EXAMPLE = 'Congratulations! You WON lottery FREE cash prize click bit.ly/free-cash-99';

function RiskGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#B91C1C' : score >= 50 ? '#EF4444' : score >= 25 ? '#F59E0B' : '#22C55E';
  return (
    <div className="relative h-[140px] w-[140px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#232858" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.7s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-[10px] uppercase tracking-widest text-razor-muted">Risk</span>
      </div>
    </div>
  );
}

export function ScanSection({ onSaved }: { onSaved: () => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [savedRow, setSavedRow] = useState<ScanRow | null>(null);

  const tfidf = useMemo(() => (text.trim() ? vectorize(text) : null), [text]);

  const handleScan = async () => {
    if (!text.trim()) {
      toast('Please paste some text to scan.', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    setSavedRow(null);
    try {
      const url = extractUrl(text);
      const res = calculateRiskScore(text, url, 1);
      setResult(res);
      const row: ScanRow = {
        input_text: text,
        risk_score: res.score,
        reasons: res.reasons.map((r) => `[${r.rule}] ${r.detail}`),
        tag: res.tag,
      };
      const { error } = await supabase.from('scans').insert(row);
      if (error) throw error;
      setSavedRow(row);
      toast(res.isFraud ? `Fraud detected — ${res.score}% risk` : `Clean — ${res.score}% risk`, res.isFraud ? 'error' : 'success');
      onSaved();
    } catch (err) {
      toast('Scan failed to save to database.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="scan" className="rounded-2xl border border-razor-border bg-razor-card/70 p-6 shadow-card animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScanLine className="text-gold-300" size={20} />
          <h2 className="text-lg font-semibold">Single Scan</h2>
        </div>
        <button
          onClick={() => setText(EXAMPLE)}
          className="text-xs text-gold-300 hover:text-gold-200 underline-offset-2 hover:underline"
        >
          Load example message
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an SMS, transaction note, or URL…  e.g. bit.ly/free-cash-99"
        rows={4}
        className="mt-4 w-full resize-y rounded-lg border border-razor-border bg-razor-bg/60 px-4 py-3 text-sm text-razor-text placeholder:text-razor-muted focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
      />

      {tfidf && tfidf.tokens.length > 0 && (
        <div className="mt-3 rounded-lg border border-razor-border/60 bg-razor-bg/40 px-3 py-2">
          <p className="mb-1.5 text-[11px] uppercase tracking-wider text-razor-muted">TF-IDF vectorization</p>
          <div className="flex flex-wrap gap-1.5">
            {tfidf.tokens.slice(0, 12).map((t) => (
              <span
                key={t.term}
                className="rounded-md bg-razor-border/50 px-2 py-0.5 font-mono text-[11px] text-razor-text"
              >
                {t.term} <span className="text-gold-300">×{t.weight.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleScan}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-semibold text-razor-bg transition-all hover:bg-gold-300 hover:shadow-glow disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
        {loading ? 'Scanning…' : 'Scan for Fraud'}
      </button>

      {result && (
        <div className="mt-6 grid gap-5 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center gap-2">
            <RiskGauge score={result.score} />
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                result.isFraud ? 'bg-risk-high/15 text-risk-high' : 'bg-risk-safe/15 text-risk-safe'
              }`}
            >
              TAG: {result.tag}
            </span>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-razor-muted">Detected signals</h3>
            {result.reasons.length === 0 ? (
              <p className="text-sm text-risk-safe">No fraud signals detected. This looks clean.</p>
            ) : (
              <ul className="space-y-2">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-razor-border/60 bg-razor-bg/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-razor-text">{r.rule}</p>
                      <p className="text-xs text-razor-muted">{r.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-razor-border/60 px-2 py-0.5 font-mono text-xs text-gold-300">
                      +{r.weight}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {savedRow && (
              <p className="pt-1 text-[11px] text-razor-muted">Saved to database · tag {savedRow.tag}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
