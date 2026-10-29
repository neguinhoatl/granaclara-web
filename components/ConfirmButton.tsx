'use client';
export default function ConfirmButton({ msg, children }: { msg: string; children: React.ReactNode }) {
  return <button type="submit" className="iconbtn" aria-label="Excluir" onClick={e => { if (!confirm(msg)) e.preventDefault(); }}>{children}</button>;
}
