import { db } from '@/lib/db'; import { todaySP } from '@/lib/fmt';
import TxForm from '@/components/TxForm'; import { createTx } from '../../actions';
export default async function R({ searchParams }: { searchParams: Promise<{ back?: string }> }) {
  const back = (await searchParams).back || '/';
  const [{ data: cats }, { data: methods }] = await Promise.all([db().from('gc_categories').select('id,name,kind,icon').order('name'), db().from('gc_payment_methods').select('id,name').order('name')]);
  return <><h1 className="title ruled">Registrar</h1><TxForm action={createTx} cats={cats || []} methods={methods || []} back={back} today={todaySP()} /></>;
}
