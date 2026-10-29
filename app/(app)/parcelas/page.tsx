import { db } from '@/lib/db'; import { brl, dmy, todaySP } from '@/lib/fmt'; import Icon, { catStyle } from '@/components/icons'; import PlanTabs from '@/components/PlanTabs';
import { deleteTx } from '../../actions'; import ConfirmButton from '@/components/ConfirmButton';
type R = { id: string; description: string; amount: number; occurred_on: string; installment_group_id: string; installment_n: number; installment_total: number; gc_categories: { name: string } | null; gc_payment_methods: { name: string } | null };
export default async function P() {
  const { data } = await db().from('gc_transactions').select('id,description,amount,occurred_on,installment_group_id,installment_n,installment_total,gc_categories(name),gc_payment_methods(name)')
    .not('installment_group_id', 'is', null).order('occurred_on');
  const today = todaySP(); const groups = new Map<string, R[]>();
  for (const r of (data || []) as unknown as R[]) groups.set(r.installment_group_id, [...(groups.get(r.installment_group_id) || []), r]);
  const list = [...groups.values()].map(rs => { const paid = rs.filter(r => r.occurred_on <= today); const next = rs.find(r => r.occurred_on > today);
    return { rs, g: rs[0], total: rs.reduce((s, r) => s + Number(r.amount), 0), paidN: paid.length, n: rs[0].installment_total, left: rs.filter(r => r.occurred_on > today).reduce((s, r) => s + Number(r.amount), 0), next }; })
    .sort((a, b) => (a.next ? 0 : 1) - (b.next ? 0 : 1) || (a.next?.occurred_on || '').localeCompare(b.next?.occurred_on || ''));
  const leftAll = list.reduce((s, x) => s + x.left, 0);
  return <><header className="phead"><h1 className="title tc">Parcelamentos</h1></header><PlanTabs on="/parcelas" />
    <section className="sum two">
      <div className="scard"><div className="shd">Ativos</div><b className="ink">{list.filter(x => x.next).length}</b></div>
      <div className="scard"><div className="shd">Falta pagar</div><b className="neg">{brl(leftAll)}</b></div></section>
    {!list.length && <p className="muted center">Nenhuma compra parcelada. No bot, diga por exemplo “relógio 500 em 5x”.</p>}
    <ul className="goals">{list.map(x => { const s = catStyle(x.g.gc_categories?.name); const p = Math.round(x.paidN / x.n * 100);
      return <li key={x.g.installment_group_id} className="panel pad">
        <div className="crow"><div className="crow" style={{ gap: 12 }}><span className="circ" style={{ background: s.bg, width: 46, height: 46 }}><Icon n={s.i} c={s.c} /></span>
          <div><div className="cname">{x.g.description}</div><div className="sub">{x.g.gc_categories?.name || 'Sem categoria'}{x.g.gc_payment_methods ? ` · ${x.g.gc_payment_methods.name}` : ''}</div></div></div>
          <span className="tag tg-yel">{x.paidN}/{x.n}</span></div>
        <div className="bar big"><i style={{ width: `${p}%`, background: x.next ? 'linear-gradient(90deg,#0d9488,#2dd4bf)' : '#1f8a4c' }} /></div>
        <div className="crow sub" style={{ marginTop: 8 }}><span>Total {brl(x.total)} · {x.n}× {brl(x.g.amount)}</span>
          <span>{x.next ? <>Próx.: <b className="ink">{dmy(x.next.occurred_on)}</b></> : <b className="pos">Quitado</b>}</span></div>
        <details className="parts"><summary>Ver parcelas</summary><ul>{x.rs.map(r => <li key={r.id}><span>{r.installment_n}/{r.installment_total} · {dmy(r.occurred_on)}</span>
          <span className={r.occurred_on <= today ? 'pos' : 'muted'}>{brl(r.amount)} {r.occurred_on <= today ? '✓' : ''}</span></li>)}</ul>
          <form action={deleteTx}><input type="hidden" name="id" value={x.g.id} /><input type="hidden" name="group" value={x.g.installment_group_id} /><input type="hidden" name="back" value="/parcelas" />
            <ConfirmButton msg={`Excluir todas as ${x.n} parcelas?`}><span className="neg small">Excluir parcelamento</span></ConfirmButton></form></details>
      </li>; })}</ul></>;
}
