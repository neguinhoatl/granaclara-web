import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
let c: SupabaseClient | null = null;
export function db() {
  if (!c) c = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }, realtime: { transport: ws as any } });
  return c;
}
export type Tx = { id: string; kind: string; description: string; amount: number; category_id: string | null;
  payment_method_id: string | null; occurred_on: string; installment_group_id: string | null;
  installment_n: number | null; installment_total: number | null; source: string | null;
  gc_categories: { name: string; icon: string | null } | null; gc_payment_methods: { name: string } | null };
export const TX_SELECT = '*, gc_categories(name,icon), gc_payment_methods(name)';
export function monthRange(m: string) {
  const [y, mo] = m.split('-').map(Number);
  const end = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 10);
  return { start: `${m}-01`, end };
}
export async function txByMonth(m: string, search?: string) {
  const { start, end } = monthRange(m);
  let q = db().from('gc_transactions').select(TX_SELECT).gte('occurred_on', start).lt('occurred_on', end)
    .order('occurred_on', { ascending: false }).order('created_at', { ascending: false });
  if (search) q = q.ilike('description', `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Tx[];
}
