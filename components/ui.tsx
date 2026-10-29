import Link from 'next/link';
import { brl, dmy, monthLabel, shiftMonth } from '@/lib/fmt';
import type { Tx } from '@/lib/db';
import { deleteTx } from '@/app/actions';
import ConfirmButton from './ConfirmButton';
import Icon, { catStyle } from './icons';

const num = (n: number) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const shortMonth = (m: string) => monthLabel(m).replace(' de ', ' ');

export function Brand({ size = 28 }: { size?: number }) {
  return <span className="brand" style={{ fontSize: size }}>
    <svg width={size * 1.05} height={size * 1.05} viewBox="0 0 24 24" aria-hidden><rect x="2" y="13" width="5" height="9" rx="2" fill="#0d9488" /><rect x="9.5" y="8" width="5" height="14" rx="2" fill="#14b8a6" /><rect x="17" y="2" width="5" height="20" rx="2" fill="#0f766e" /></svg>
    <span><b className="g">Grana</b><b className="c">Clara</b></span></span>;
}
export function MonthPill({ m, path, extra = '' }: { m: string; path: string; extra?: string }) {
  return <div className="mpill"><Link href={`${path}?m=${shiftMonth(m, -1)}${extra}`} aria-label="Mês anterior"><Icon n="left" s={18} /></Link>
    <span>{shortMonth(m)}</span><Link href={`${path}?m=${shiftMonth(m, 1)}${extra}`} aria-label="Próximo mês"><Icon n="right" s={18} /></Link></div>;
}
export function MonthNav({ m, path, extra = '' }: { m: string; path: string; extra?: string }) {
  return <div className="monthnav"><Link href={`${path}?m=${shiftMonth(m, -1)}${extra}`} aria-label="Mês anterior"><Icon n="left" /></Link>
    <strong><Icon n="calendar" c="#0f766e" /> {shortMonth(m)}</strong>
    <Link href={`${path}?m=${shiftMonth(m, 1)}${extra}`} aria-label="Próximo mês"><Icon n="right" /></Link></div>;
}
export function RecentList({ items }: { items: Tx[] }) {
  if (!items.length) return <p className="muted center">Nenhum lançamento.</p>;
  return <ul className="recent">{items.map(t => { const s = catStyle(t.gc_categories?.name, t.kind); const inc = t.kind === 'income';
    return <li key={t.id}><span className="circ" style={{ background: s.bg }}><Icon n={inc ? 'arrowDown' : s.i} c={inc ? '#1f8a4c' : '#1d2b2a'} s={24} /></span>
      <div className="grow"><div className="desc">{t.description}</div><div className="sub">{inc ? 'Receita' : t.gc_categories?.name || 'Sem categoria'}</div></div>
      <div className="right"><div className={`amt ${inc ? 'pos' : ''}`}>{brl(t.amount)}</div><span className={`tag ${inc ? 'tg-inc' : 'tg-exp'}`}>{inc ? 'Receita' : 'Gasto'}</span></div></li>; })}</ul>;
}
function pmTag(t: Tx) {
  if (t.installment_total) return <span className="tag tg-yel">{t.installment_n}/{t.installment_total}</span>;
  const n = t.gc_payment_methods?.name; if (!n) return null;
  const cls = /pix/i.test(n) ? 'tg-teal' : /cr[eé]dito|nubank|cart/i.test(n) ? 'tg-exp' : 'tg-grey';
  return <span className={`tag ${cls}`}>{n}</span>;
}
export function TxList({ items, back }: { items: Tx[]; back: string }) {
  if (!items.length) return <p className="muted center">Nenhum lançamento.</p>;
  return <ul className="hist">{items.map(t => { const s = catStyle(t.gc_categories?.name, t.kind); const inc = t.kind === 'income';
    return <li key={t.id}><span className="tile" style={{ background: s.bg, borderColor: s.c + '33' }}><Icon n={s.i} c={s.c} s={26} /></span>
      <div className="grow"><div className="desc">{t.description}</div>
        <div className="sub">{inc ? <>Receita <i className="dot" /></> : t.gc_categories?.name || 'Sem categoria'} · {dmy(t.occurred_on)}</div>{pmTag(t)}</div>
      <div className="right"><div className={`amt ${inc ? 'pos' : 'neg'}`}>{num(t.amount)}</div>
        <div className="acts"><Link href={`/editar/${t.id}?back=${encodeURIComponent(back)}`} aria-label="Editar"><Icon n="pencil" c="#c0392b" /></Link>
          <form action={deleteTx}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="back" value={back} />
            {t.installment_group_id && <input type="hidden" name="group" value={t.installment_group_id} />}
            <ConfirmButton msg={t.installment_group_id ? `Excluir todas as ${t.installment_total} parcelas?` : 'Excluir este lançamento?'}><Icon n="trash" c="#c0392b" /></ConfirmButton></form></div></div></li>; })}</ul>;
}
