import { txByMonth } from '@/lib/db'; import { brl, validMonth } from '@/lib/fmt'; import { MonthPill } from '@/components/ui'; import Icon, { catStyle } from '@/components/icons';
export default async function C({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const m = validMonth((await searchParams).m); const tx = (await txByMonth(m)).filter(t => t.kind !== 'income');
  const map = new Map<string, { name: string; v: number }>();
  for (const t of tx) { const k = t.category_id || '-'; const e = map.get(k) || { name: t.gc_categories?.name || 'Sem categoria', v: 0 }; e.v += Number(t.amount); map.set(k, e); }
  const total = tx.reduce((s, t) => s + Number(t.amount), 0); const rows = [...map.values()].sort((a, b) => b.v - a.v);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return <><header className="phead"><h1 className="title tc">Categorias</h1><MonthPill m={m} path="/categorias" /></header>
    <div className="panel pad"><div className="kicker">GASTO POR CATEGORIA</div><div className="sub">Total gasto: <b className="ink">{brl(total)}</b></div>
      {!rows.length && <p className="muted center">Nenhuma despesa neste mês.</p>}
      <ul className="cats">{rows.map(r => { const s = catStyle(r.name); const p = pct(r.v); return <li key={r.name}>
        <span className="circ" style={{ background: s.bg }}><Icon n={s.i} c={s.c} s={26} /></span>
        <div className="grow"><div className="crow"><div><div className="cname" style={{ color: s.c === '#8a8f95' ? '#33404a' : s.c }}>{r.name}</div><div className="cpct" style={{ color: s.c }}>{p}%</div></div><b className="ink">{brl(r.v)}</b></div>
          <div className="bar" style={{ background: s.bg }}><i style={{ width: `${p}%`, background: s.c }} /></div></div></li>; })}</ul></div>
    {rows[0] && <div className="insight"><span className="circ" style={{ background: '#d4efe8' }}><Icon n="pie" c="#0f766e" s={26} /></span>
      <div><b>{pct(rows[0].v)}% do seu gasto está em {rows[0].name}.</b><p>Considere revisar seus hábitos para equilibrar melhor seu orçamento.</p></div></div>}</>;
}
