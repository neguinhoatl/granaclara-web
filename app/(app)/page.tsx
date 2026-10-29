import Link from 'next/link';
import { txByMonth } from '@/lib/db';
import { brl, validMonth } from '@/lib/fmt';
import { Brand, MonthPill, RecentList } from '@/components/ui';
import Icon from '@/components/icons';
export default async function Home({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const m = validMonth((await searchParams).m); const tx = await txByMonth(m);
  const inc = tx.filter(t => t.kind === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const exp = tx.filter(t => t.kind !== 'income').reduce((s, t) => s + Number(t.amount), 0);
  return <>
    <header className="phead"><Brand /><MonthPill m={m} path="/" /></header>
    <section className="sum">
      <div className="scard s-inc"><div className="shd"><span className="sic" style={{ background: '#cdebd6' }}><Icon n="arrowDown" c="#1f7a45" s={18} /></span>Recebido</div><b className="pos">{brl(inc)}</b></div>
      <div className="scard"><div className="shd"><span className="sic" style={{ background: '#fbd9da' }}><Icon n="arrowUp" c="#c62828" s={18} /></span>Gasto</div><b className="neg">{brl(exp)}</b></div>
      <div className="scard"><div className="shd"><span className="sic" style={{ background: '#e6e9ec' }}><Icon n="wallet" c="#33404a" s={18} /></span>Saldo</div><b className={inc - exp < 0 ? 'neg' : 'ink'}>{brl(inc - exp)}</b></div>
    </section>
    <Link href={`/registrar?back=${encodeURIComponent('/?m=' + m)}`} className="cta"><span><Icon n="plus" c="#0d9488" s={26} w={2.6} /></span>Registrar gasto</Link>
    <h2 className="rule">Últimas</h2>
    <div className="panel"><RecentList items={tx.slice(0, 8)} /></div>
    {tx.length > 8 && <Link className="more" href={`/historico?m=${m}`}>Ver todos ({tx.length})</Link>}
  </>;
}
