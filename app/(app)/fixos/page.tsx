import { db } from '@/lib/db'; import { brl, validMonth, todaySP } from '@/lib/fmt'; import { MonthPill } from '@/components/ui';
import Icon, { catStyle } from '@/components/icons'; import PlanTabs from '@/components/PlanTabs';
import { createRecurring, payRecurring, toggleRecurring, deleteRecurring } from '../../actions';
import ConfirmButton from '@/components/ConfirmButton';
const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export default async function F({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const m = validMonth((await searchParams).m); const today = todaySP();
  const [{ data: rows }, { data: cats }, { data: methods }] = await Promise.all([
    db().from('gc_recurring_expenses').select('*, gc_categories(name)').order('day_of_month'),
    db().from('gc_categories').select('id,name').eq('kind', 'expense').order('name'), db().from('gc_payment_methods').select('id,name').order('name')]);
  const list = rows || []; const [y, mo] = m.split('-').map(Number);
  const days = new Date(Date.UTC(y, mo, 0)).getUTCDate(); const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const dayOf = (d: number) => Math.min(d, days);
  const active = list.filter(r => r.active); const total = active.reduce((s, r) => s + Number(r.amount), 0);
  const paid = active.filter(r => r.last_paid_month === m).reduce((s, r) => s + Number(r.amount), 0);
  const byDay = new Map<number, typeof list>(); for (const r of active) { const d = dayOf(r.day_of_month); byDay.set(d, [...(byDay.get(d) || []), r]); }
  return <><header className="phead"><h1 className="title tc">Gastos fixos</h1><MonthPill m={m} path="/fixos" /></header>
    <PlanTabs on="/fixos" />
    <section className="sum two">
      <div className="scard"><div className="shd">Total fixo/mês</div><b className="neg">{brl(total)}</b></div>
      <div className="scard s-inc"><div className="shd">Pago em {m.slice(5)}/{m.slice(0, 4)}</div><b className="pos">{brl(paid)}</b></div></section>
    <div className="panel pad"><div className="kicker">CALENDÁRIO</div>
      <div className="cal">{WD.map((w, i) => <span key={i} className="wd">{w}</span>)}
        {Array.from({ length: first }, (_, i) => <span key={'e' + i} />)}
        {Array.from({ length: days }, (_, i) => { const d = i + 1; const it = byDay.get(d); const ds = `${m}-${String(d).padStart(2, '0')}`;
          const allPaid = it?.every(r => r.last_paid_month === m);
          return <span key={d} className={`day ${ds === today ? 'today' : ''} ${it ? (allPaid ? 'has paid' : 'has') : ''}`} title={it?.map(r => r.name).join(', ')}>{d}</span>; })}</div></div>
    <h2 className="rule">Recorrentes</h2>
    {!list.length && <p className="muted center">Nenhum gasto fixo ainda. Cadastre abaixo (aluguel, internet, academia…).</p>}
    <ul className="hist">{list.map(r => { const s = catStyle(r.gc_categories?.name); const isPaid = r.last_paid_month === m;
      return <li key={r.id} style={{ opacity: r.active ? 1 : .55 }}><span className="tile" style={{ background: s.bg, borderColor: s.c + '33' }}><Icon n={s.i} c={s.c} s={26} /></span>
        <div className="grow"><div className="desc">{r.name}</div><div className="sub">Todo dia {r.day_of_month} · {r.gc_categories?.name || 'Sem categoria'}</div>
          {!r.active ? <span className="tag tg-grey">Pausado</span> : isPaid ? <span className="tag tg-inc">Pago</span> : <span className="tag tg-yel">Pendente</span>}<div className="fx-acts">
            {r.active && !isPaid && <form action={payRecurring}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="month" value={m} /><button className="pill">Lançar</button></form>}
            <form action={toggleRecurring}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="active" value={String(!r.active)} /><button className="pill ghost">{r.active ? 'Pausar' : 'Ativar'}</button></form>
            <form action={deleteRecurring}><input type="hidden" name="id" value={r.id} /><ConfirmButton msg="Excluir este gasto fixo?"><Icon n="trash" c="#c0392b" /></ConfirmButton></form>
          </div></div>
        <div className="right"><div className="amt neg">{brl(r.amount)}</div>
          </div></li>; })}</ul>
    <h2 className="rule">Novo gasto fixo</h2>
    <form action={createRecurring} className="panel pad form">
      <label>Nome<input name="name" required placeholder="Ex.: Aluguel" /></label>
      <div className="row2"><label>Valor (R$)<input name="amount" required inputMode="decimal" placeholder="0,00" /></label>
        <label>Dia do mês<input name="day_of_month" type="number" min={1} max={31} required defaultValue={10} /></label></div>
      <label>Categoria<select name="category_id"><option value="">Sem categoria</option>{(cats || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Forma de pagamento<select name="payment_method_id"><option value="">—</option>{(methods || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <button className="btn">Adicionar</button></form></>;
}
