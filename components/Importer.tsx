'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { parseCSV, parseOFX } from '@/lib/importParse';
import { previewImport, commitImport, type PreviewRow } from '@/app/actions';
import { brl, dmy } from '@/lib/fmt';

type Cat = { id: string; name: string; kind: string };
export default function Importer({ cats }: { cats: Cat[] }) {
  const [rows, setRows] = useState<(PreviewRow & { on: boolean })[]>([]);
  const [errors, setErrors] = useState<string[]>([]); const [msg, setMsg] = useState(''); const [file, setFile] = useState('');
  const [pending, start] = useTransition();
  async function onFile(f?: File) {
    if (!f) return; setMsg(''); setFile(f.name);
    const buf = await f.arrayBuffer(); let text = new TextDecoder('utf-8').decode(buf);
    if (text.includes('\uFFFD')) text = new TextDecoder('windows-1252').decode(buf); // extratos de banco em Latin-1
    const isOfx = /\.ofx$/i.test(f.name) || /<OFX>/i.test(text);
    const r = isOfx ? parseOFX(text) : parseCSV(text); setErrors(r.errors);
    start(async () => { const p = await previewImport(r.rows); setRows(p.map(x => ({ ...x, on: !x.dup }))); });
  }
  const upd = (i: number, p: Partial<PreviewRow & { on: boolean }>) => setRows(rs => rs.map((r, j) => j === i ? { ...r, ...p } : r));
  const sel = rows.filter(r => r.on);
  const tot = (k: string) => sel.filter(r => r.kind === k).reduce((s, r) => s + r.amount, 0);
  function save() {
    start(async () => { const res = await commitImport(sel.map(({ on, ...r }) => r));
      if (res.error) setMsg('Erro: ' + res.error); else { setMsg(`✅ ${res.inserted} lançamentos importados.`); setRows([]); setFile(''); } });
  }
  return <>
    <label className="panel pad drop">
      <input type="file" accept=".csv,.ofx,text/csv" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} hidden />
      <b>{file || 'Escolher arquivo CSV ou OFX'}</b>
      <span className="sub">Colunas: data; descrição; valor (opcionais: tipo, categoria, meio)</span>
    </label>
    {pending && <p className="muted center">Processando…</p>}
    {msg && <p className="center" style={{ fontWeight: 700 }}>{msg} {msg.startsWith('✅') && <Link href="/historico" className="link">Ver histórico</Link>}</p>}
    {errors.length > 0 && <div className="warnbox">{errors.slice(0, 5).map(e => <div key={e}>⚠️ {e}</div>)}{errors.length > 5 && <div>… e mais {errors.length - 5}</div>}</div>}
    {rows.length > 0 && <>
      <section className="sum">
        <div className="scard"><div className="shd">Selecionados</div><b className="ink">{sel.length}/{rows.length}</b></div>
        <div className="scard s-inc"><div className="shd">Entradas</div><b className="pos">{brl(tot('income'))}</b></div>
        <div className="scard"><div className="shd">Gastos</div><b className="neg">{brl(tot('expense'))}</b></div></section>
      {rows.some(r => r.dup) && <div className="warnbox">⚠️ {rows.filter(r => r.dup).length} linha(s) parecem duplicadas (mesma data, valor e tipo já lançados) e vieram desmarcadas.</div>}
      <ul className="imp">{rows.map((r, i) => <li key={i} className={r.on ? '' : 'off'}>
        <input type="checkbox" checked={r.on} onChange={e => upd(i, { on: e.target.checked })} aria-label="Importar" />
        <div className="grow"><div className="desc">{r.description}</div>
          <div className="sub">{dmy(r.date)}{r.dup && <span className="tag tg-yel" style={{ marginLeft: 6 }}>possível duplicado</span>}</div>
          <select value={r.category_id || ''} onChange={e => upd(i, { category_id: e.target.value || null })}>
            <option value="">Sem categoria</option>{cats.filter(c => c.kind === r.kind).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="right"><span className={`amt ${r.kind === 'income' ? 'pos' : 'neg'}`}>{r.kind === 'income' ? '+' : '−'}{brl(r.amount)}</span>
          <button type="button" className="pill ghost" onClick={() => upd(i, { kind: r.kind === 'income' ? 'expense' : 'income', category_id: null })}>{r.kind === 'income' ? 'Entrada' : 'Gasto'} ⇄</button></div>
      </li>)}</ul>
      <button className="btn" style={{ width: '100%', position: 'sticky', bottom: 90 }} disabled={!sel.length || pending} onClick={save}>Importar {sel.length} lançamento(s)</button>
    </>}
  </>;
}
