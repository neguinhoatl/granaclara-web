// Espelho de KEYWORDS de src/parser.js (bot) para o painel.
const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const KEYWORDS: Record<string, string[]> = {
  'Transporte': ['uber','99','taxi','onibus','metro','gasolina','combustivel','estacionamento','pedagio','posto'],
  'Alimentação': ['mercado','supermercado','pizza','ifood','restaurante','lanche','padaria','almoco','jantar','cafe','acougue','hamburguer','feira'],
  'Moradia': ['aluguel','condominio','luz','energia','agua','gas','internet','iptu'],
  'Saúde e Beleza': ['farmacia','remedio','medico','dentista','academia','cabelo','salao','barbeiro','consulta'],
  'Lazer': ['cinema','show','bar','cerveja','viagem','passeio','jogo'],
  'Assinatura e Serviços': ['netflix','spotify','assinatura','prime','youtube','celular','plano'],
  'Vestuário': ['roupa','tenis','camisa','calca','sapato','relogio'],
  'Educação': ['curso','livro','faculdade','escola','mensalidade'],
  'Salário': ['salario','adiantamento','pagamento','holerite'],
  'Venda': ['venda','vendi'],
};
const INCOME = new Set(['Salário', 'Venda']);
export const normalizeDesc = (d: string) => strip(d).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
export function guessCategory(desc: string, kind: string) {
  const t = strip(desc);
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if ((kind === 'income') !== INCOME.has(cat)) continue;
    if (words.some(w => new RegExp(`\\b${w}`).test(t))) return cat;
  }
  return kind === 'income' ? 'Outros receitas' : 'Outros';
}
