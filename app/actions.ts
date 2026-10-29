'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { COOKIE, token, requireAuth } from '@/lib/auth';

export async function login(_: unknown, f: FormData) {
  if (!process.env.PANEL_PASSWORD || f.get('password') !== process.env.PANEL_PASSWORD) return 'Senha incorreta';
  (await cookies()).set(COOKIE, token(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  redirect('/');
}
export async function logout() { (await cookies()).delete(COOKIE); redirect('/login'); }

function txFields(f: FormData) {
  const amount = Number(String(f.get('amount') || '').replace(/\./g, '').replace(',', '.'));
  if (!(amount > 0)) throw new Error('Valor inválido');
  return { kind: String(f.get('kind')) === 'income' ? 'income' : 'expense', description: String(f.get('description') || '').trim() || 'Sem descrição',
    amount, category_id: (f.get('category_id') as string) || null, payment_method_id: (f.get('payment_method_id') as string) || null,
    occurred_on: String(f.get('occurred_on')) };
}
const back = (f: FormData) => { const r = String(f.get('back') || '/'); return r.startsWith('/') ? r : '/'; };

export async function createTx(f: FormData) {
  await requireAuth();
  const { error } = await db().from('gc_transactions').insert({ ...txFields(f), source: 'web' });
  if (error) throw error; revalidatePath('/', 'layout'); redirect(back(f));
}
export async function updateTx(f: FormData) {
  await requireAuth();
  const { error } = await db().from('gc_transactions').update({ ...txFields(f), updated_at: new Date().toISOString() }).eq('id', String(f.get('id')));
  if (error) throw error; revalidatePath('/', 'layout'); redirect(back(f));
}
export async function deleteTx(f: FormData) {
  await requireAuth();
  const group = f.get('group') as string; const q = db().from('gc_transactions').delete();
  const { error } = await (group ? q.eq('installment_group_id', group) : q.eq('id', String(f.get('id'))));
  if (error) throw error; revalidatePath('/', 'layout'); redirect(back(f));
}
export async function createMethod(f: FormData) {
  await requireAuth();
  const name = String(f.get('name') || '').trim(); if (!name) return;
  const lim = Number(String(f.get('credit_limit') || '').replace(',', '.'));
  const { error } = await db().from('gc_payment_methods').insert({ name, method_type: String(f.get('method_type') || 'other'), credit_limit: lim > 0 ? lim : null });
  if (error) throw error; revalidatePath('/meios');
}

const num = (v: FormDataEntryValue | null) => Number(String(v || '').replace(/\./g, '').replace(',', '.'));
const done = (p: string) => { revalidatePath('/', 'layout'); redirect(p); };

export async function createRecurring(f: FormData) {
  await requireAuth();
  const amount = num(f.get('amount')); const day = Number(f.get('day_of_month'));
  if (!(amount > 0) || !(day >= 1 && day <= 31)) throw new Error('Dados inválidos');
  const { error } = await db().from('gc_recurring_expenses').insert({ name: String(f.get('name') || '').trim() || 'Fixo', amount, day_of_month: day,
    category_id: (f.get('category_id') as string) || null, payment_method_id: (f.get('payment_method_id') as string) || null });
  if (error) throw error; done('/fixos');
}
export async function toggleRecurring(f: FormData) {
  await requireAuth();
  const { error } = await db().from('gc_recurring_expenses').update({ active: f.get('active') === 'true', updated_at: new Date().toISOString() }).eq('id', String(f.get('id')));
  if (error) throw error; done('/fixos');
}
export async function deleteRecurring(f: FormData) {
  await requireAuth();
  const { error } = await db().from('gc_recurring_expenses').delete().eq('id', String(f.get('id')));
  if (error) throw error; done('/fixos');
}
/** Lança o fixo como gasto no mês informado e marca como pago. */
export async function payRecurring(f: FormData) {
  await requireAuth();
  const id = String(f.get('id')); const month = String(f.get('month'));
  const { data: r, error: e1 } = await db().from('gc_recurring_expenses').select('*').eq('id', id).single();
  if (e1 || !r) throw e1 || new Error('Fixo não encontrado');
  const [y, m] = month.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const occurred_on = `${month}-${String(Math.min(r.day_of_month, last)).padStart(2, '0')}`;
  const { error } = await db().from('gc_transactions').insert({ kind: 'expense', description: r.name, amount: r.amount, category_id: r.category_id,
    payment_method_id: r.payment_method_id, occurred_on, source: 'web', notes: `fixo:${r.id}` });
  if (error) throw error;
  await db().from('gc_recurring_expenses').update({ last_paid_month: month, updated_at: new Date().toISOString() }).eq('id', id);
  done(`/fixos?m=${month}`);
}
export async function createGoal(f: FormData) {
  await requireAuth();
  const target = num(f.get('target_amount')); if (!(target > 0)) throw new Error('Valor inválido');
  const cur = num(f.get('current_amount'));
  const { error } = await db().from('gc_goals').insert({ name: String(f.get('name') || '').trim() || 'Meta', target_amount: target,
    current_amount: cur > 0 ? cur : 0, deadline: (f.get('deadline') as string) || null });
  if (error) throw error; done('/metas');
}
export async function depositGoal(f: FormData) {
  await requireAuth();
  const id = String(f.get('id')); const v = num(f.get('value')) * (f.get('op') === 'out' ? -1 : 1);
  if (!v) return;
  const { data: g } = await db().from('gc_goals').select('current_amount').eq('id', id).single();
  const { error } = await db().from('gc_goals').update({ current_amount: Math.max(0, Number(g?.current_amount || 0) + v), updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; done('/metas');
}
export async function deleteGoal(f: FormData) {
  await requireAuth();
  const { error } = await db().from('gc_goals').delete().eq('id', String(f.get('id')));
  if (error) throw error; done('/metas');
}

// ---------- Fase 5: importação CSV/OFX ----------
import type { Row } from '@/lib/importParse';
import { guessCategory, normalizeDesc } from '@/lib/categorize';
export type PreviewRow = Row & { category_id: string | null; category_name: string; payment_method_id: string | null; dup: boolean };
const sfold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Classifica as linhas (categoria/meio) e marca possíveis duplicados (mesma data + valor + tipo já no banco ou repetido no arquivo). */
export async function previewImport(rows: Row[]): Promise<PreviewRow[]> {
  await requireAuth();
  rows = rows.slice(0, 2000);
  const [{ data: cats }, { data: pms }, { data: corr }] = await Promise.all([
    db().from('gc_categories').select('id,name,kind'), db().from('gc_payment_methods').select('id,name'),
    db().from('gc_category_corrections').select('description_normalized,category_id')]);
  const learned = new Map((corr || []).map(c => [c.description_normalized, c.category_id]));
  const dates = rows.map(r => r.date).sort();
  const existing = new Set<string>();
  if (dates.length) {
    const { data } = await db().from('gc_transactions').select('occurred_on,amount,kind').gte('occurred_on', dates[0]).lte('occurred_on', dates.at(-1)!);
    (data || []).forEach(t => existing.add(`${t.occurred_on}|${Number(t.amount).toFixed(2)}|${t.kind}`));
  }
  const seen = new Set<string>();
  return rows.map(r => {
    const byName = r.category ? (cats || []).find(c => sfold(c.name) === sfold(r.category!) && c.kind === r.kind) : undefined;
    const lid = learned.get(normalizeDesc(r.description));
    const learnedCat = lid ? (cats || []).find(c => c.id === lid && c.kind === r.kind) : undefined;
    const g = guessCategory(r.description, r.kind);
    const cat = byName || learnedCat || (cats || []).find(c => c.name === g && c.kind === r.kind) || null;
    const pm = r.method ? (pms || []).find(p => sfold(p.name) === sfold(r.method!)) : undefined;
    const key = `${r.date}|${r.amount.toFixed(2)}|${r.kind}`;
    const dup = existing.has(key) || seen.has(key); seen.add(key);
    return { ...r, category_id: cat?.id ?? null, category_name: cat?.name ?? g, payment_method_id: pm?.id ?? null, dup };
  });
}
export async function commitImport(rows: PreviewRow[]): Promise<{ inserted: number; error?: string }> {
  await requireAuth();
  const ins = rows.filter(r => r.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date)).map(r => ({
    kind: r.kind === 'income' ? 'income' : 'expense', description: String(r.description).slice(0, 200) || 'Importado', amount: r.amount,
    category_id: r.category_id, payment_method_id: r.payment_method_id, occurred_on: r.date, source: 'import', notes: 'import:csv' }));
  if (!ins.length) return { inserted: 0 };
  const { error } = await db().from('gc_transactions').insert(ins);
  if (error) return { inserted: 0, error: error.message };
  revalidatePath('/', 'layout'); return { inserted: ins.length };
}
