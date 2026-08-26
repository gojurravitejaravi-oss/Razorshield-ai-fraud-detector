import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
}

// Skip database writes when the project is using a placeholder/dummy Supabase URL.
export const dbEnabled = !supabaseUrl.includes('dummy.supabase.co');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export interface TransactionRow {
  ip: string;
  email: string;
  amount: number;
  message: string;
  url: string | null;
  risk_score: number;
  is_fraud: boolean;
  reasons: string[];
}

export interface ScanRow {
  input_text: string;
  risk_score: number;
  reasons: string[];
  tag: string;
}
