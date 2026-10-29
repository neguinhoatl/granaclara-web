import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export const COOKIE = 'gc_session';
export const token = () => createHmac('sha256', process.env.SESSION_SECRET || 'gc').update(process.env.PANEL_PASSWORD || '').digest('hex');
export async function isAuthed() {
  const v = (await cookies()).get(COOKIE)?.value || ''; const t = token();
  return v.length === t.length && timingSafeEqual(Buffer.from(v), Buffer.from(t));
}
export async function requireAuth() { if (!(await isAuthed())) redirect('/login'); }
