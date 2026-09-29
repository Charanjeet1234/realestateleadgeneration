import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, ErrorNote, Field, Modal, inputCls } from '../ui';

type FieldType = 'text' | 'number' | 'lines' | 'textarea' | { options: string[] };

export interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  hint?: string;
  wide?: boolean;
}

interface Props<T extends { id: string }> {
  /** API collection, e.g. "developers" → GET /developers, POST/PUT/DELETE /admin/developers */
  collection: 'developers' | 'benchmarks';
  singular: string;
  fields: FieldDef[];
  columns: { label: string; render: (row: T) => React.ReactNode }[];
  titleOf: (row: T) => string;
  onDataChanged: () => void;
}

export function RecordAdmin<T extends { id: string }>({ collection, singular, fields, columns, titleOf, onDataChanged }: Props<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get<Record<string, T[]>>(`/${collection}`)
      .then((d) => setRows(d[collection]))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, [collection]);

  const open = (row: T | 'new') => {
    const f: Record<string, string> = {};
    for (const fd of fields) {
      const v = row === 'new' ? undefined : (row as Record<string, unknown>)[fd.key];
      f[fd.key] = Array.isArray(v) ? v.join('\n') : v === null || v === undefined ? (typeof fd.type === 'object' ? fd.type.options[0] : '') : String(v);
    }
    setForm(f);
    setFormError(null);
    setEditing(row);
  };

  const payload = () => {
    const out: Record<string, unknown> = {};
    for (const fd of fields) {
      const v = form[fd.key] ?? '';
      if (fd.type === 'number') out[fd.key] = v === '' ? undefined : Number(v.replace(/,/g, ''));
      else if (fd.type === 'lines') out[fd.key] = v.split('\n').map((s) => s.trim()).filter(Boolean);
      else out[fd.key] = v === '' && !fd.required ? null : v;
    }
    return out;
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (editing === 'new') await api.post(`/admin/${collection}`, payload());
      else if (editing) await api.put(`/admin/${collection}/${editing.id}`, payload());
      setEditing(null);
      load();
      onDataChanged();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: T) => {
    if (!window.confirm(`Delete ${titleOf(row)}?`)) return;
    try {
      await api.del(`/admin/${collection}/${row.id}`);
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => open('new')}>
          <Plus className="w-4 h-4" /> Add {singular}
        </Button>
      </div>
      <ErrorNote message={error} />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              {columns.map((c) => (
                <th key={c.label} className="text-left py-3 px-4">
                  {c.label}
                </th>
              ))}
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.label} className="py-3 px-4">
                    {c.render(row)}
                  </td>
                ))}
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-1.5">
                    <Button onClick={() => open(row)} className="px-2 py-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="danger" onClick={() => remove(row)} className="px-2 py-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} wide title={editing === 'new' ? `Add ${singular}` : `Edit ${singular}`}>
        <form onSubmit={save} className="space-y-4">
          <ErrorNote message={formError} />
          <div className="grid sm:grid-cols-2 gap-3">
            {fields.map((fd) => {
              const common = {
                value: form[fd.key] ?? '',
                required: fd.required,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                  setForm((f) => ({ ...f, [fd.key]: e.target.value })),
                className: inputCls,
              };
              return (
                <Field
                  key={fd.key}
                  label={fd.label}
                  hint={fd.hint ?? (fd.type === 'lines' ? 'One per line' : undefined)}
                  className={fd.wide || fd.type === 'lines' || fd.type === 'textarea' ? 'sm:col-span-2' : ''}
                >
                  {typeof fd.type === 'object' ? (
                    <select {...common}>
                      {fd.type.options.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : fd.type === 'lines' || fd.type === 'textarea' ? (
                    <textarea rows={3} {...common} />
                  ) : (
                    <input inputMode={fd.type === 'number' ? 'numeric' : undefined} {...common} />
                  )}
                </Field>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
