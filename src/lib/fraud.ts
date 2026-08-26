// RazorShield fraud-detection engine
// "Python-like logic in TypeScript" — no external API needed.

export type RiskReason = {
  rule: string;
  weight: number;
  detail: string;
};

export type RiskResult = {
  score: number; // 0–100
  reasons: RiskReason[];
  isFraud: boolean;
  tag: 'Fraud' | 'Ham';
};

const SPAM_KEYWORDS = [
  'free',
  'lottery',
  'cash prize',
  'urgent',
  'click here',
  'winner',
  'free money',
  'cash prize',
  'congratulations',
  'won',
  'claim now',
  'limited offer',
];

const TRAPPING_LINKS = ['bit.ly', 'tinyurl', '.tk', 'free-cash', 'lottery', 'goo.gl', 't.me/', 'wa.me/'];

// --- TF-IDF simulation ----------------------------------------------------
// A tiny vocabulary-based vectorizer that mirrors the "text is vectorized" step.
const VECTORIZER_VOCAB: Record<string, number> = (() => {
  const vocab: Record<string, number> = {};
  const corpus = [
    'congratulations you won free cash prize lottery click here winner',
    'claim now limited offer free money cash prize',
    'urgent click here free cash',
    'transaction successful order confirmed payment received',
    'invoice attached receipt download',
    'your otp is valid for ten minutes',
  ];
  const docFreq: Record<string, number> = {};
  corpus.forEach((doc) => {
    const seen = new Set<string>();
    tokenize(doc).forEach((t) => {
      if (!seen.has(t)) {
        docFreq[t] = (docFreq[t] ?? 0) + 1;
      }
      seen.add(t);
    });
  });
  const N = corpus.length;
  Object.keys(docFreq).forEach((term) => {
    vocab[term] = Math.log((N + 1) / (docFreq[term] + 1)) + 1; // smoothed idf
  });
  return vocab;
})();

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Returns per-token TF-IDF weight and a single spammy-vector magnitude. */
export function vectorize(text: string): { tokens: { term: string; weight: number }[]; magnitude: number } {
  const toks = tokenize(text);
  const tf: Record<string, number> = {};
  toks.forEach((t) => {
    tf[t] = (tf[t] ?? 0) + 1;
  });
  const tokens = Object.keys(tf).map((term) => {
    const idf = VECTORIZER_VOCAB[term] ?? 0;
    const weight = tf[term] * idf;
    return { term, weight };
  });
  const magnitude = Math.sqrt(tokens.reduce((s, t) => s + t.weight * t.weight, 0));
  return { tokens: tokens.filter((t) => t.weight > 0).sort((a, b) => b.weight - a.weight), magnitude };
}

// --- Rule 1: spam keywords ------------------------------------------------
export function checkSpamKeywords(text: string): RiskReason | null {
  const lower = text.toLowerCase();
  const hits = SPAM_KEYWORDS.filter((k) => lower.includes(k));
  if (hits.length === 0) return null;
  const weight = Math.min(40, 15 + hits.length * 8);
  return {
    rule: 'Spam Keywords',
    weight,
    detail: `Matched ${hits.length} keyword(s): ${hits.slice(0, 4).join(', ')}${hits.length > 4 ? '…' : ''}`,
  };
}

// --- Rule 2: trapping links ------------------------------------------------
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

export function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+|[a-z0-9.-]+\.(?:[a-z]{2,})(?:\/[^\s]*)?/i);
  return m ? m[0] : null;
}

export function checkTrappingLink(url: string | null): RiskReason | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  const flags: string[] = [];
  if (TRAPPING_LINKS.some((d) => lower.includes(d))) flags.push('known shortener/flagged domain');
  if (IPV4_RE.test(url)) flags.push('raw IP address used as host');
  if (!lower.startsWith('https')) flags.push('no https (unencrypted)');
  if (lower.includes('free-cash') || lower.includes('lottery')) flags.push('free-cash/lottery in path');
  if (flags.length === 0) return null;
  const weight = Math.min(35, 18 + flags.length * 7);
  return { rule: 'Trapping Link', weight, detail: flags.join(' · ') };
}

// --- Rule 3: abuse rings ---------------------------------------------------
export type AbuseRing = {
  ip: string;
  count: number;
  windowSeconds: number;
  txIds: number[];
};

export function checkAbuseRing(
  txs: { ip: string; timestamp: number; _idx: number }[],
  windowSeconds = 300,
  threshold = 3,
): { rings: AbuseRing[]; reason: RiskReason | null } {
  const byIp = new Map<string, { ip: string; timestamp: number; _idx: number }[]>();
  txs.forEach((t) => {
    const arr = byIp.get(t.ip) ?? [];
    arr.push(t);
    byIp.set(t.ip, arr);
  });

  const rings: AbuseRing[] = [];
  byIp.forEach((arr) => {
    arr.sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < arr.length; i++) {
      let j = i;
      while (j < arr.length && arr[j].timestamp - arr[i].timestamp <= windowSeconds * 1000) j++;
      if (j - i > threshold) {
        rings.push({
          ip: arr[i].ip,
          count: j - i,
          windowSeconds,
          txIds: arr.slice(i, j).map((x) => x._idx),
        });
        break;
      }
    }
  });

  if (rings.length === 0) return { rings: [], reason: null };
  const reason: RiskReason = {
    rule: 'Abuse Ring',
    weight: 90,
    detail: `${rings.length} IP(s) with >${threshold} txns in ${windowSeconds}s (e.g. ${rings[0].ip} → ${rings[0].count} txns)`,
  };
  return { rings, reason };
}

// --- Rule 4: combined score ------------------------------------------------
export function calculateRiskScore(
  text: string,
  url: string | null,
  ipFrequency: number = 0,
): RiskResult {
  const reasons: (RiskReason | null)[] = [];
  reasons.push(checkSpamKeywords(text));
  reasons.push(checkTrappingLink(url));
  if (ipFrequency > 3) {
    reasons.push({
      rule: 'IP Frequency',
      weight: Math.min(90, 30 + (ipFrequency - 3) * 15),
      detail: `${ipFrequency} transactions from same IP`,
    });
  }
  // TF-IDF magnitude contributes a small signal too.
  const { magnitude } = vectorize(text);
  if (magnitude > 1.5) {
    reasons.push({
      rule: 'TF-IDF Anomaly',
      weight: Math.min(15, Math.round(magnitude * 3)),
      detail: `Spam-vector magnitude ${magnitude.toFixed(2)} exceeds baseline`,
    });
  }

  const valid = reasons.filter((r): r is RiskReason => r !== null);
  // Dampened sum so multiple signals stack but never overshoot 100.
  let raw = valid.reduce((s, r) => s + r.weight, 0);
  const score = Math.min(100, Math.round(raw));
  const isFraud = score >= 50;
  return {
    score,
    reasons: valid,
    isFraud,
    tag: isFraud ? 'Fraud' : 'Ham',
  };
}

export function classifyRow(row: {
  ip: string;
  email: string;
  amount: number;
  message: string;
  url?: string | null;
}): RiskResult {
  const url = row.url ?? extractUrl(row.message);
  return calculateRiskScore(row.message, url, 1);
}

// --- Metrics ---------------------------------------------------------------
export type Metrics = {
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  total: number;
  fraud: number;
  ham: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
};

/** Computes precision/recall/F1/FPR from labelled rows.
 *  Rows without a `groundTruth` are assumed neutral (counted in TN). */
export function computeMetrics(
  rows: { isFraud: boolean; groundTruth?: boolean }[],
): Metrics {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  rows.forEach((r) => {
    const gt = r.groundTruth ?? false;
    if (r.isFraud && gt) tp++;
    else if (r.isFraud && !gt) fp++;
    else if (!r.isFraud && gt) fn++;
    else tn++;
  });
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = fp + tn ? fp / (fp + tn) : 0;
  return {
    precision, recall, f1, fpr,
    total: rows.length, fraud: tp + fp, ham: tn + fn,
    truePositives: tp, falsePositives: fp, falseNegatives: fn, trueNegatives: tn,
  };
}
