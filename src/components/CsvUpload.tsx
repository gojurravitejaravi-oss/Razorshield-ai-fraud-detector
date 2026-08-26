import { Loader2, UploadCloud, Table2, Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { checkAbuseRing, classifyRow, type AbuseRing, type RiskResult } from '@/lib/fraud';
import { supabase, dbEnabled, type TransactionRow } from '@/lib/supabase';
import { toast } from '@/lib/toast';

export type FlaggedRow = {
  ip: string;
  email: string;
  amount: number;
  message: string;
  url: string | null;
  risk_score: number;
  is_fraud: boolean;
  reasons: string[];
  abuseRing: boolean;
};

const SAMPLE_CSV = `ip,email,amount,timestamp,message,url
103.21.58.4,sucker1@mail.com,499,2026-08-25T10:00:00Z,"You WON lottery FREE cash prize click bit.ly/free-cash-99",bit.ly/free-cash-99
103.21.58.4,sucker2@mail.com,299,2026-08-25T10:01:20Z,"Free cash prize claim now winner",bit.ly/free-money
103.21.58.4,sucker3@mail.com,150,2026-08-25T10:02:45Z,"Urgent click here free money",
103.21.58.4,sucker4@mail.com,799,2026-08-25T10:03:50Z,"Congratulations you won free cash",tinyurl.com/win
182.65.11.8,goodbuyer@mail.com,1200,2026-08-25T10:05:00Z,"Order confirmed delivery in 3 days",
182.65.11.8,goodbuyer2@mail.com,450,2026-08-25T10:06:10Z,"Invoice attached receipt download",
49.205.99.1,spammer1@mail.com,50,2026-08-25T10:10:00Z,"Winner! lottery free cash prize click here",free-cash.tk
49.205.99.1,spammer2@mail.com,50,2026-08-25T10:10:45Z,"Free money urgent click here",http://192.168.1.1/x
49.205.99.1,spammer3@mail.com,50,2026-08-25T10:11:30Z,"Cash prize winner claim now",
49.205.99.1,spammer4@mail.com,50,2026-08-25T10:12:15Z,"You won lottery congratulations free",
8.8.8.8,normal@mail.com,300,2026-08-25T10:15:00Z,"Payment received thank you",
`;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV needs a header row plus at least one data row.');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const required = ['ip', 'email', 'amount', 'timestamp', 'message'];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length) throw new Error(`Missing required column(s): ${missing.join(', ')}`);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = (cols[idx] ?? '').trim()));
    rows.push(row);
  }
  return rows;
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'razorshield_sample_transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function CsvUpload({ onUploaded }: { onUploaded: (rows: FlaggedRow[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FlaggedRow[]>([]);
  const [rings, setRings] = useState<AbuseRing[]>([]);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const ts = parsed.map((p, i) => ({
        ip: p.ip,
        timestamp: new Date(p.timestamp).getTime() || Date.now(),
        _idx: i,
      }));
      const { rings: detected } = checkAbuseRing(ts);
      setRings(detected);
      const ringIps = new Set(detected.map((r) => r.ip));

      const flagged: FlaggedRow[] = parsed.map((p) => {
        const url = p.url || null;
        const base = classifyRow({ ip: p.ip, email: p.email, amount: Number(p.amount) || 0, message: p.message, url });
        const abuse = ringIps.has(p.ip);
        const reasons = [...base.reasons];
        let score = base.score;
        let isFraud = base.isFraud;
        if (abuse) {
          score = Math.max(score, 90);
          isFraud = true;
          reasons.push({ rule: 'Abuse Ring', weight: 90, detail: `IP ${p.ip} part of a burst ring (>3 txns / 5min)` });
        }
        return {
          ip: p.ip,
          email: p.email,
          amount: Number(p.amount) || 0,
          message: p.message,
          url,
          risk_score: score,
          is_fraud: isFraud,
          reasons: reasons.map((r) => r.detail),
          abuseRing: abuse,
        };
      });

      const insertRows: TransactionRow[] = flagged.map((f) => ({
        ip: f.ip, email: f.email, amount: f.amount, message: f.message,
        url: f.url, risk_score: f.risk_score, is_fraud: f.is_fraud, reasons: f.reasons,
      }));
      if (dbEnabled) {
        try {
          const { error } = await supabase.from('transactions').insert(insertRows);
          if (error) throw error;
        } catch (err) {
          console.error(err);
        }
      }

      setRows(flagged);
      onUploaded(flagged);
      const fraudCount = flagged.filter((f) => f.is_fraud).length;
      toast(`Parsed ${flagged.length} rows · ${fraudCount} flagged · ${detected.length} abuse ring(s)`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse CSV';
      toast(msg, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="csv" className="rounded-2xl border border-razor-border bg-razor-card/70 p-6 shadow-card animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Table2 className="text-gold-300" size={20} />
          <h2 className="text-lg font-semibold">Bulk Transaction Scan</h2>
        </div>
        <button onClick={downloadSample} className="inline-flex items-center gap-1.5 text-xs text-gold-300 hover:text-gold-200">
          <Download size={13} /> Sample CSV
        </button>
      </div>

      <p className="mt-2 text-sm text-razor-muted">
        Upload a CSV with columns: <code className="font-mono text-gold-200">ip, email, amount, timestamp, message, url</code>.
        Same-IP bursts (&gt;3 txns in 5 min) are flagged as abuse rings.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gold-400/40 bg-gold-400/10 px-5 py-2.5 text-sm font-semibold text-gold-300 transition-all hover:bg-gold-400/20 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
        {loading ? 'Processing…' : 'Upload CSV'}
      </button>

      {rings.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {rings.map((r) => (
            <span key={r.ip} className="inline-flex items-center gap-1.5 rounded-md bg-risk-high/15 px-2.5 py-1 text-xs font-medium text-risk-high">
              Abuse ring: {r.ip} ({r.count} txns)
            </span>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-lg border border-razor-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-razor-bg/60 text-xs uppercase tracking-wider text-razor-muted">
              <tr>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2">URL</th>
                <th className="px-3 py-2 text-right">Risk</th>
                <th className="px-3 py-2">Flag</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`border-t border-razor-border/50 ${r.is_fraud ? 'bg-risk-high/10' : ''}`}
                >
                  <td className="px-3 py-2 font-mono text-xs">{r.ip}</td>
                  <td className="px-3 py-2 text-xs text-razor-muted">{r.email}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">₹{r.amount}</td>
                  <td className="px-3 py-2 text-xs max-w-[260px] truncate" title={r.message}>{r.message}</td>
                  <td className="px-3 py-2 text-xs text-razor-muted max-w-[140px] truncate" title={r.url ?? ''}>{r.url ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    <span className={r.is_fraud ? 'text-risk-high' : 'text-risk-safe'}>{r.risk_score}%</span>
                  </td>
                  <td className="px-3 py-2">
                    {r.is_fraud ? (
                      <span className="rounded bg-risk-high/20 px-2 py-0.5 text-[11px] font-semibold text-risk-high">
                        {r.abuseRing ? 'ABUSE RING' : 'FRAUD'}
                      </span>
                    ) : (
                      <span className="rounded bg-risk-safe/15 px-2 py-0.5 text-[11px] font-semibold text-risk-safe">HAM</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
