import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { useAuth } from '../lib/context';
import { Button, ErrorNote, Field, inputCls } from './ui';

export const LoginPanel: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="py-16 px-4">
      <form
        onSubmit={submit}
        className="max-w-sm mx-auto bg-[#0b132b] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-xl font-serif font-bold text-white">Agent sign-in</h2>
          <p className="text-xs text-slate-400">Broker CRM and listings admin for agency staff.</p>
        </div>
        <ErrorNote message={error} />
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Button type="submit" variant="primary" disabled={busy} className="w-full py-2.5">
          <LogIn className="w-4 h-4" />
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-[10px] text-center text-slate-500">Accounts are created by your agency admin.</p>
      </form>
    </div>
  );
};
