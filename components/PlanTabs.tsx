import Link from 'next/link';
const T = [['/fixos', 'Fixos'], ['/metas', 'Metas'], ['/parcelas', 'Parcelas']];
export default function PlanTabs({ on }: { on: string }) {
  return <div className="tabs">{T.map(([h, l]) => <Link key={h} href={h} className={on === h ? 'on' : ''}>{l}</Link>)}</div>;
}
