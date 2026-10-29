import { txByMonth } from '@/lib/db'; import { validMonth } from '@/lib/fmt'; import { Brand, MonthNav, TxList } from '@/components/ui'; import Icon from '@/components/icons'; import Link from 'next/link';
export default async function H({ searchParams }: { searchParams: Promise<{ m?: string; q?: string }> }) {
  const sp = await searchParams; const m = validMonth(sp.m); const q = (sp.q || '').trim();
  const tx = await txByMonth(m, q || undefined); const qs = q ? `&q=${encodeURIComponent(q)}` : '';
  return <><header className="center top-brand"><Brand size={24} /></header>
    <h1 className="title ruled crow">Histórico <Link href="/importar" className="hlink">⬆ Importar CSV</Link></h1>
    <form className="searchbox"><input type="hidden" name="m" value={m} /><Icon n="search" c="#4a6763" /><input name="q" defaultValue={q} placeholder="Buscar lançamento" aria-label="Buscar lançamento" /></form>
    <MonthNav m={m} path="/historico" extra={qs} />
    <TxList items={tx} back={`/historico?m=${m}${qs}`} /></>;
}
