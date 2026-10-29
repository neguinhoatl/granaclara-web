import { db } from '@/lib/db'; import Importer from '@/components/Importer'; import Link from 'next/link';
export default async function Imp() {
  const { data } = await db().from('gc_categories').select('id,name,kind').order('name');
  return <><header className="phead"><h1 className="title tc">Importar extrato</h1><Link href="/historico" className="link">Voltar</Link></header>
    <p className="sub" style={{ marginBottom: 14 }}>Envie um CSV (ou OFX do banco). Você confere tudo antes de salvar. Valores negativos viram gastos; positivos, entradas — ou use a coluna <b>tipo</b>.</p>
    <Importer cats={data || []} />
    <details className="parts panel pad" style={{ marginTop: 16 }}><summary>Exemplo de CSV</summary>
      <pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{'data;descricao;valor;tipo;categoria;meio\n05/10/2026;Mercado Extra;-150,90;;Alimentação;Nubank\n05/10/2026;Salário;3000,00;receita;;'}</pre></details></>;
}
