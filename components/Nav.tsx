'use client';
import Link from 'next/link'; import { usePathname } from 'next/navigation'; import Icon from './icons';
const items = [['/', 'home', 'Visão'], ['/historico', 'history', 'Histórico'], ['/categorias', 'grid', 'Categorias'], ['/meios', 'card', 'Meios'], ['/fixos', 'flag', 'Planos']];
export default function Nav() { const p = usePathname();
  return <nav className="bottom"><div>{items.map(([h, i, l]) => <Link key={h} href={h} className={p === h || (h === '/historico' && p === '/importar') || (h === '/fixos' && ['/metas', '/parcelas'].includes(p)) ? 'on' : ''}><Icon n={i} s={26} w={1.8} />{l}</Link>)}</div></nav>; }
