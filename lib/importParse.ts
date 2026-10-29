// Parser de extratos CSV/OFX (roda no navegador). Sem dependências.
export type Row = { date: string; description: string; amount: number; kind: 'expense' | 'income'; category?: string; method?: string };
const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function parseAmountBR(raw: string): number | null {
  let s = String(raw || '').replace(/r\$\s*/i, '').replace(/\s/g, '');
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.startsWith('-')) { neg = true; s = s.slice(1); } else if (s.startsWith('+')) s = s.slice(1);
  if (s.endsWith('-')) { neg = true; s = s.slice(0, -1); }
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s); if (!Number.isFinite(n) || n === 0) return null;
  return Math.round((neg ? -n : n) * 100) / 100;
}
export function parseDateBR(raw: string): string | null {
  const s = String(raw || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) { let y = +m[3]; if (y < 100) y += 2000; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  m = s.match(/^(\d{4})(\d{2})(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`; // OFX
  return null;
}
function splitLine(line: string, d: string) {
  const out: string[] = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === d && !q) { out.push(cur); cur = ''; } else cur += c; }
  out.push(cur); return out.map(x => x.trim());
}
const COLS: Record<string, string[]> = {
  date: ['data', 'date', 'dt', 'data lancamento', 'data da compra'],
  description: ['descricao', 'description', 'historico', 'lancamento', 'estabelecimento', 'title', 'titulo', 'memo'],
  amount: ['valor', 'amount', 'value', 'quantia', 'valor (r$)'],
  kind: ['tipo', 'type', 'kind'],
  category: ['categoria', 'category'],
  method: ['meio', 'forma', 'pagamento', 'meio de pagamento', 'cartao', 'conta'],
};
export function parseCSV(text: string): { rows: Row[]; errors: string[] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], errors: ['Arquivo vazio ou sem cabeçalho'] };
  const d = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const head = splitLine(lines[0], d).map(strip);
  const idx: Record<string, number> = {};
  for (const [k, names] of Object.entries(COLS)) idx[k] = head.findIndex(h => names.includes(h));
  if (idx.date < 0 || idx.amount < 0) return { rows: [], errors: ['Cabeçalho precisa ter as colunas "data" e "valor"'] };
  const rows: Row[] = [], errors: string[] = [];
  const anyNeg = lines.slice(1).some(l => (parseAmountBR(splitLine(l, d)[idx.amount]) ?? 0) < 0);
  lines.slice(1).forEach((l, i) => {
    const c = splitLine(l, d); const date = parseDateBR(c[idx.date]); let amt = parseAmountBR(c[idx.amount]);
    if (!date || amt == null) { errors.push(`Linha ${i + 2}: data ou valor inválido`); return; }
    const t = idx.kind >= 0 ? strip(c[idx.kind] || '') : '';
    let kind: Row['kind'] = amt < 0 ? 'expense' : 'income';
    if (/^(despesa|gasto|saida|debito|expense|d)$/.test(t)) kind = 'expense';
    else if (/^(receita|entrada|credito|income|c)$/.test(t)) kind = 'income';
    else if (idx.kind < 0 && !anyNeg) kind = 'expense'; // sem sinal nenhum: trata tudo como gasto
    amt = Math.abs(amt);
    rows.push({ date, amount: amt, kind, description: (idx.description >= 0 ? c[idx.description] : '') || 'Importado',
      category: idx.category >= 0 ? c[idx.category] || undefined : undefined, method: idx.method >= 0 ? c[idx.method] || undefined : undefined });
  });
  return { rows, errors };
}
export function parseOFX(text: string): { rows: Row[]; errors: string[] } {
  const rows: Row[] = [];
  const tag = (b: string, t: string) => (b.match(new RegExp(`<${t}>([^<\\r\\n]*)`, 'i')) || [])[1]?.trim() || '';
  for (const b of text.split(/<STMTTRN>/i).slice(1)) {
    const date = parseDateBR(tag(b, 'DTPOSTED')); const amt = parseAmountBR(tag(b, 'TRNAMT').replace('.', ','));
    if (!date || amt == null) continue;
    rows.push({ date, amount: Math.abs(amt), kind: amt < 0 ? 'expense' : 'income', description: tag(b, 'MEMO') || tag(b, 'NAME') || 'Importado' });
  }
  return { rows, errors: rows.length ? [] : ['Nenhuma transação (<STMTTRN>) encontrada no OFX'] };
}
