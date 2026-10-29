import { notFound } from 'next/navigation'; import { db } from '@/lib/db'; import { todaySP } from '@/lib/fmt';
import TxForm from '@/components/TxForm'; import { updateTx } from '../../../actions';
export default async function E({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ back?: string }> }) {
  const { id } = await params; const back = (await searchParams).back || '/historico';
  const [{ data: tx }, { data: cats }, { data: methods }] = await Promise.all([db().from('gc_transactions').select('*').eq('id', id).maybeSingle(),
    db().from('gc_categories').select('id,name,kind,icon').order('name'), db().from('gc_payment_methods').select('id,name').order('name')]);
  if (!tx) notFound();
  return <><h1 className="title ruled">Editar lançamento</h1><TxForm action={updateTx} init={tx} cats={cats || []} methods={methods || []} back={back} today={todaySP()} /></>;
}
