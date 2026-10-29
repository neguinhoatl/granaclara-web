import { requireAuth } from '@/lib/auth';
import Nav from '@/components/Nav';
export const dynamic = 'force-dynamic';
export default async function L({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <><div className="wm" aria-hidden /><main className="wrap">{children}</main><Nav /></>;
}
