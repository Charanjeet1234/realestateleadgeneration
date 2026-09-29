import React, { useEffect, useState } from 'react';
import { Plus, UserX, UserCheck, KeyRound } from 'lucide-react';
import { api, type AdminUser } from '../../lib/api';
import { useAuth } from '../../lib/context';
import { Button, ErrorNote, Field, Modal, inputCls, timeAgo } from '../ui';

export const TeamAdmin: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<AdminUser | null>(null);

  const load = () =>
    api
      .get<{ users: AdminUser[] }>('/admin/users')
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const update = async (u: AdminUser, body: Record<string, unknown>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    try {
      await api.patch(`/admin/users/${u.id}`, body);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs text-slate-400 max-w-xl">
          New leads are auto-assigned round-robin to active <strong className="text-slate-200">agents</strong>. Agents see only their own
          leads; admins see everything and manage listings. Deactivating someone signs them out and returns their open leads to the
          unassigned pool.
        </p>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" /> Add team member
        </Button>
      </div>
      <ErrorNote message={error} />
      <div className="bg-[#0b132b] border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-3">Role</th>
              <th className="text-left py-3 px-3">WhatsApp alerts</th>
              <th className="text-left py-3 px-3">Leads</th>
              <th className="text-left py-3 px-3">Last sign-in</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {users.map((u) => (
              <tr key={u.id} className={u.active ? '' : 'opacity-50'}>
                <td className="py-3 px-4">
                  <div className="font-bold text-white">
                    {u.name} {u.id === me?.id && <span className="text-[10px] text-amber-300 font-normal">(you)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400">{u.email}</div>
                </td>
                <td className="py-3 px-3">
                  <select
                    value={u.role}
                    disabled={u.id === me?.id}
                    onChange={(e) => update(u, { role: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-1 text-[11px]"
                  >
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="py-3 px-3 font-mono text-[11px] text-slate-300">{u.phone || '—'}</td>
                <td className="py-3 px-3 font-mono">{u._count.assignedLeads}</td>
                <td className="py-3 px-3 text-slate-400">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-1.5">
                    <Button onClick={() => setResetFor(u)} className="px-2 py-1.5" title="Reset password">
                      <KeyRound className="w-3.5 h-3.5" />
                    </Button>
                    {u.id !== me?.id &&
                      (u.active ? (
                        <Button
                          variant="danger"
                          className="px-2 py-1.5"
                          title="Deactivate"
                          onClick={() => update(u, { active: false }, `Deactivate ${u.name}? Their open leads return to the unassigned pool.`)}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button variant="success" className="px-2 py-1.5" title="Reactivate" onClick={() => update(u, { active: true })}>
                          <UserCheck className="w-3.5 h-3.5" />
                        </Button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUserModal open={adding} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />
      <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} />
    </div>
  );
};

function AddUserModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const blank = { name: '', email: '', phone: '', role: 'AGENT', password: '' };
  const [f, setF] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setF(blank);
      setError(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/admin/users', { ...f, phone: f.phone || null });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add user');
    } finally {
      setBusy(false);
    }
  };

  const bind = (k: keyof typeof blank) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value }),
    className: inputCls,
  });

  return (
    <Modal open={open} onClose={onClose} title="Add team member">
      <form onSubmit={submit} className="space-y-3">
        <ErrorNote message={error} />
        <Field label="Full name">
          <input required {...bind('name')} />
        </Field>
        <Field label="Email (sign-in)">
          <input required type="email" {...bind('email')} />
        </Field>
        <Field label="WhatsApp number" hint="Optional. Gets instant WhatsApp alerts for their leads (+971…)">
          <input type="tel" {...bind('phone')} />
        </Field>
        <Field label="Role">
          <select {...bind('role')}>
            <option value="AGENT">Agent — works assigned leads</option>
            <option value="ADMIN">Admin — all leads, listings and team</option>
          </select>
        </Field>
        <Field label="Temporary password" hint="At least 10 characters. Share it privately; they can change it after signing in.">
          <input required minLength={10} type="text" autoComplete="off" {...bind('password')} />
        </Field>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Adding…' : 'Add member'}
        </Button>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setPw('');
    setError(null);
    setDone(false);
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/admin/users/${user!.id}`, { password: pw });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  return (
    <Modal open={Boolean(user)} onClose={onClose} title={`Reset password · ${user?.name ?? ''}`}>
      {done ? (
        <div className="space-y-3 text-xs text-slate-300">
          <p>Password reset. {user?.name} has been signed out everywhere.</p>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <ErrorNote message={error} />
          <Field label="New temporary password" hint="At least 10 characters">
            <input required minLength={10} type="text" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
          </Field>
          <Button type="submit" variant="primary">
            Reset password
          </Button>
        </form>
      )}
    </Modal>
  );
}
