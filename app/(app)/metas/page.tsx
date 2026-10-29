import { db } from '@/lib/db'; import { brl, dmy, todaySP } from '@/lib/fmt'; import Icon from '@/components/icons'; import PlanTabs from '@/components/PlanTabs';
import { createGoal, depositGoal, deleteGoal } from '../../actions'; import ConfirmButton from '@/components/ConfirmButton';
export default async function G() {
  const { data } = await db().from('gc_goals').select('*').order('created_at'); const goals = data || []; const today = todaySP();
  const tot = goals.reduce((s, g) => s + Number(g.current_amount), 0), tgt = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  return <><header className="phead"><h1 className="title tc">Metas</h1></header><PlanTabs on="/metas" />
    <section className="sum two">
      <div className="scard s-inc"><div className="shd">Guardado</div><b className="pos">{brl(tot)}</b></div>
      <div className="scard"><div className="shd">Objetivo total</div><b className="ink">{brl(tgt)}</b></div></section>
    {!goals.length && <p className="muted center">Nenhuma meta ainda. Crie a primeira abaixo.</p>}
    <ul className="goals">{goals.map(g => { const p = Math.min(100, Math.round(Number(g.current_amount) / Number(g.target_amount) * 100)); const done = p >= 100;
      let pace = ''; if (g.deadline && !done) { const months = Math.max(1, Math.ceil((Date.parse(g.deadline) - Date.parse(today)) / (30.44 * 864e5)));
        pace = `Guarde ${brl((Number(g.target_amount) - Number(g.current_amount)) / months)}/mês até ${dmy(g.deadline)}`; }
      return <li key={g.id} className="panel pad">
        <div className="crow"><div className="crow" style={{ gap: 12 }}><span className="circ" style={{ background: done ? '#e3f5ea' : '#dff3ee', width: 46, height: 46 }}><Icon n={done ? 'check' : 'target'} c={done ? '#1f8a4c' : '#0d9488'} /></span>
          <div><div className="cname">{g.name}</div><div className="sub">{brl(g.current_amount)} de {brl(g.target_amount)}</div></div></div>
          <b className={done ? 'pos' : 'tc2'}>{p}%</b></div>
        <div className="bar big"><i style={{ width: `${p}%`, background: done ? '#1f8a4c' : 'linear-gradient(90deg,#0d9488,#2dd4bf)' }} /></div>
        {(pace || done) && <div className="sub" style={{ marginTop: 8 }}>{done ? '🎉 Meta atingida!' : pace}</div>}
        <form action={depositGoal} className="dep"><input type="hidden" name="id" value={g.id} />
          <input name="value" inputMode="decimal" placeholder="Valor" required />
          <button name="op" value="in" className="pill">+ Guardar</button><button name="op" value="out" className="pill ghost">− Retirar</button></form>
        <form action={deleteGoal} style={{ textAlign: "right", marginTop: 8 }}><input type="hidden" name="id" value={g.id} /><ConfirmButton msg="Excluir esta meta?"><Icon n="trash" c="#c0392b" s={18} /></ConfirmButton></form>
      </li>; })}</ul>
    <h2 className="rule">Nova meta</h2>
    <form action={createGoal} className="panel pad form">
      <label>Nome<input name="name" required placeholder="Ex.: Reserva de emergência" /></label>
      <div className="row2"><label>Objetivo (R$)<input name="target_amount" required inputMode="decimal" placeholder="0,00" /></label>
        <label>Já guardado<input name="current_amount" inputMode="decimal" placeholder="0,00" /></label></div>
      <label>Prazo (opcional)<input type="date" name="deadline" /></label>
      <button className="btn">Criar meta</button></form></>;
}
