'use client';
import { useState } from 'react';
type Opt = { id: string; name: string; kind?: string; icon?: string | null };
export default function TxForm({ action, cats, methods, init, back, today }: {
  action: (f: FormData) => void; cats: Opt[]; methods: Opt[]; back: string; today: string;
  init?: { id: string; kind: string; description: string; amount: number; category_id: string | null; payment_method_id: string | null; occurred_on: string; installment_total: number | null } }) {
  const [kind, setKind] = useState(init?.kind || 'expense');
  return <form action={action} className="card form">
    {init && <input type="hidden" name="id" value={init.id} />}
    <input type="hidden" name="back" value={back} /><input type="hidden" name="kind" value={kind} />
    <div className="seg">
      <button type="button" className={kind === 'expense' ? 'on neg' : ''} onClick={() => setKind('expense')}>Despesa</button>
      <button type="button" className={kind === 'income' ? 'on pos' : ''} onClick={() => setKind('income')}>Receita</button>
    </div>
    {init?.installment_total ? <p className="muted small">Editando apenas esta parcela.</p> : null}
    <label>Descrição<input name="description" required defaultValue={init?.description} placeholder="Ex.: Mercado" /></label>
    <label>Valor (R$)<input name="amount" required inputMode="decimal" defaultValue={init ? String(init.amount).replace('.', ',') : ''} placeholder="0,00" /></label>
    <label>Categoria<select name="category_id" key={kind} defaultValue={init?.kind === kind ? init?.category_id || '' : ''}>
      <option value="">Sem categoria</option>
      {cats.filter(c => c.kind === kind).map(c => <option key={c.id} value={c.id}>{c.icon ? c.icon + ' ' : ''}{c.name}</option>)}
    </select></label>
    <label>Forma de pagamento<select name="payment_method_id" defaultValue={init?.payment_method_id || ''}>
      <option value="">—</option>{methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select></label>
    <label>Data<input type="date" name="occurred_on" required defaultValue={init?.occurred_on || today} /></label>
    <button className="btn">Salvar</button>
  </form>;
}
