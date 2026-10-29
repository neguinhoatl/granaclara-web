'use client';
import { useActionState } from 'react';
import { login } from '../actions';
export default function Login() {
  const [err, act, pending] = useActionState(login, null);
  return <main className="login"><form action={act} className="card form">
    <img src="/logo.jpg" alt="GranaClara" className="loginlogo" /><p className="muted center">Painel financeiro</p>
    <label>Senha<input type="password" name="password" autoFocus required /></label>
    {err && <p className="neg">{err}</p>}
    <button className="btn" disabled={pending}>Entrar</button>
  </form></main>;
}
