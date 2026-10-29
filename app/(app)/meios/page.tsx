import { db, txByMonth } from '@/lib/db'; import { brl, validMonth } from '@/lib/fmt'; import { MonthPill } from '@/components/ui'; import Icon from '@/components/icons'; import { createMethod, logout } from '../../actions';
const TYPES: Record<string, string> = { pix: 'Pix', cash: 'Dinheiro', credit: 'Crédito', debit: 'Débito', transfer: 'Transferência', other: 'Outro' };
const ST: Record<string, [string, string, string]> = { pix: ['bolt', '#0d9488', '#dff3ee'], cash: ['cash', '#1f8a4c', '#e3f5ea'], credit: ['card', '#c62828', '#fde4e4'], debit: ['card', '#3b6fc4', '#e2ebf8'], transfer: ['history', '#7b8fb0', '#e6ebf3'], other: ['wallet', '#8a8f95', '#ececec'] };
export default async function M({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const m = validMonth((await searchParams).m);
  const [{ data: methods }, tx] = await Promise.all([db().from('gc_payment_methods').select('*').order('name'), txByMonth(m)]);
  const spend = (id: string) => tx.filter(t => t.kind !== 'income' && t.payment_method_id === id).reduce((s, t) => s + Number(t.amount), 0);
  const total = tx.filter(t => t.kind !== 'income').reduce((s, t) => s + Number(t.amount), 0);
  return <><header className="phead"><h1 className="title tc">Meios</h1><MonthPill m={m} path="/meios" /></header>
    <div className="panel pad"><div className="kicker">GASTO POR FORMA DE PAGAMENTO</div>
      <ul className="cats">{(methods || []).map(pm => { const [i, c, bg] = ST[pm.method_type] || ST.other; const v = spend(pm.id); const p = total ? Math.round(v / total * 100) : 0;
        return <li key={pm.id}><span className="circ" style={{ background: bg }}><Icon n={i} c={c} s={24} /></span>
          <div className="grow"><div className="crow"><div><div className="cname">{pm.name}</div><div className="sub">{TYPES[pm.method_type] || pm.method_type}{pm.credit_limit ? ` · limite ${brl(pm.credit_limit)}` : ''}</div></div><b className={v ? 'neg' : 'muted'}>{brl(v)}</b></div>
            <div className="bar" style={{ background: bg }}><i style={{ width: `${p}%`, background: c }} /></div></div></li>; })}</ul></div>
    <h2 className="rule">Nova forma de pagamento</h2>
    <form action={createMethod} className="panel pad form">
      <label>Nome<input name="name" required placeholder="Ex.: Itaú Visa" /></label>
      <label>Tipo<select name="method_type">{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      <label>Limite (opcional)<input name="credit_limit" inputMode="decimal" placeholder="0,00" /></label>
      <button className="btn">Adicionar</button></form>
    <form action={logout} className="center"><button className="link out"><Icon n="logout" s={18} /> Sair do painel</button></form></>;
}
