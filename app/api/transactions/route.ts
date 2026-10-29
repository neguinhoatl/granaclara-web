import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { txByMonth } from '@/lib/db';
import { validMonth } from '@/lib/fmt';
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const p = req.nextUrl.searchParams;
  return NextResponse.json(await txByMonth(validMonth(p.get('month') || undefined), p.get('q') || undefined));
}
