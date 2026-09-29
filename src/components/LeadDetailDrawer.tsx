import React, { useCallback, useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  Star,
  Trash2,
  StickyNote,
  PhoneCall,
  Send,
  Clock,
  UserCheck,
  RefreshCw,
  Bot,
  Megaphone,
} from 'lucide-react';
import {
  api,
  LEAD_STATUSES,
  TRANSACTION_LABELS,
  type LeadActivity,
  type LeadDetail,
  type LeadStatus,
  type LeadSummary,
  type TeamMember,
} from '../lib/api';
import { useAuth } from '../lib/context';
import { Button, ErrorNote, Field, Modal, formatDateTime, inputCls, timeAgo, toLocalInput, waLink } from './ui';

const ACTIVITY_ICON: Record<LeadActivity['type'], React.ReactNode> = {
  SYSTEM: <Bot className="w-3.5 h-3.5 text-slate-400" />,
  NOTE: <StickyNote className="w-3.5 h-3.5 text-amber-300" />,
  STATUS_CHANGE: <RefreshCw className="w-3.5 h-3.5 text-sky-300" />,
  ASSIGNMENT: <UserCheck className="w-3.5 h-3.5 text-violet-300" />,
  CALL: <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />,
  WHATSAPP: <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />,
  EMAIL: <Mail className="w-3.5 h-3.5 text-sky-300" />,
  REPEAT_INQUIRY: <Megaphone className="w-3.5 h-3.5 text-amber-400" />,
};

interface Props {
  leadId: string | null;
  team: TeamMember[];
  onClose: () => void;
  onChanged: (lead?: LeadSummary) => void;
  onDeleted: (id: string) => void;
}

export const LeadDetailDrawer: React.FC<Props> = ({ leadId, team, onClose, onChanged, onDeleted }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteType, setNoteType] = useState<'NOTE' | 'CALL' | 'WHATSAPP' | 'EMAIL'>('NOTE');
  const [note, setNote] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

  const load = useCallback(async () => {
    if (!leadId) return;
    setError(null);
    try {
      const d = await api.get<{ lead: LeadDetail }>(`/leads/${leadId}`);
      setLead(d.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lead');
    }
  }, [leadId]);

  useEffect(() => {
    setLead(null);
    setNote('');
    setPendingStatus(null);
    load();
  }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    if (!lead) return;
    setSaving(true);
    setError(null);
    try {
      const d = await api.patch<{ lead: LeadSummary }>(`/leads/${lead.id}`, body);
      onChanged(d.lead);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = (status: LeadStatus) => {
    if (status === 'LOST') {
      setPendingStatus('LOST');
      return;
    }
    patch({ status });
  };

  const addActivity = async (type: typeof noteType, body: string) => {
    if (!lead || !body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/leads/${lead.id}/activities`, { type, body });
      setNote('');
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!lead) return;
    if (!window.confirm(`Permanently delete ${lead.name} and their history? Use this for data-deletion requests.`)) return;
    try {
      await api.del(`/leads/${lead.id}`);
      onDeleted(lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const whatsappText = lead
    ? `Hello ${lead.name.split(' ')[0]}, this is ${user?.name} from PropEngine UAE regarding your inquiry${
        lead.propertyTitle ? ` about ${lead.propertyTitle}` : ''
      }.`
    : '';

  return (
    <Modal
      open={Boolean(leadId)}
      onClose={onClose}
      side
      title={
        lead ? (
          <span className="flex items-center gap-2">
            {lead.name}
            {lead.isVip && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
          </span>
        ) : (
          'Lead'
        )
      }
    >
      {!lead ? (
        error ? <ErrorNote message={error} /> : <p className="text-xs text-slate-400">Loading…</p>
      ) : (
        <div className="space-y-5 text-xs">
          <ErrorNote message={error} />

          {/* Quick contact */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={waLink(lead.phone, whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => addActivity('WHATSAPP', 'Opened WhatsApp chat with client')}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-300 font-semibold hover:bg-emerald-600/25"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold hover:bg-slate-700"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
            <a
              href={`mailto:${lead.email}`}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold hover:bg-slate-700"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          </div>

          {/* Details */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-slate-950/50 border border-slate-800 rounded-xl p-3.5">
            {[
              ['Phone', lead.phone],
              ['Email', lead.email],
              ['Interest', TRANSACTION_LABELS[lead.transactionType]],
              ['Budget', lead.budget],
              ['Location', lead.preferredLocation],
              ['Unit type', lead.unitType],
              ['Property', lead.property ? `${lead.property.title} · ${lead.property.priceRangeFormatted}` : lead.propertyTitle],
              ['Source', lead.source],
              ['Campaign', [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ') || null],
              ['Marketing consent', lead.marketingConsent ? 'Yes' : 'No'],
              ['Captured', formatDateTime(lead.createdAt)],
              ['First contact', lead.firstContactAt ? formatDateTime(lead.firstContactAt) : 'Not yet'],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[10px] text-slate-500 uppercase tracking-wide">{k}</dt>
                  <dd className="text-slate-200 break-words">{v}</dd>
                </div>
              ))}
          </dl>

          {lead.message && (
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 whitespace-pre-wrap text-slate-300">
              {lead.message}
            </div>
          )}

          {/* Pipeline controls */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={lead.status}
                disabled={saving}
                onChange={(e) => changeStatus(e.target.value as LeadStatus)}
                className={inputCls}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assigned to">
              <select
                value={lead.assignedTo?.id ?? ''}
                disabled={!isAdmin || saving}
                onChange={(e) => patch({ assignedToId: e.target.value || null })}
                className={inputCls}
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next follow-up">
              <input
                type="datetime-local"
                value={toLocalInput(lead.nextFollowUpAt)}
                disabled={saving}
                onChange={(e) => patch({ nextFollowUpAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className={inputCls}
              />
            </Field>
            <Field label="Priority">
              <button
                type="button"
                disabled={saving}
                onClick={() => patch({ isVip: !lead.isVip })}
                className={`${inputCls} flex items-center gap-2 text-left`}
              >
                <Star className={`w-3.5 h-3.5 ${lead.isVip ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                {lead.isVip ? 'VIP' : 'Standard'}
              </button>
            </Field>
          </div>

          {pendingStatus === 'LOST' && (
            <div className="space-y-2 p-3 rounded-xl border border-slate-700 bg-slate-900">
              <Field label="Why was this lead lost?">
                <input
                  autoFocus
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="e.g. Bought elsewhere, budget too low, unreachable"
                  className={inputCls}
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    patch({ status: 'LOST', statusNote: lostReason || undefined });
                    setPendingStatus(null);
                    setLostReason('');
                  }}
                >
                  Mark as lost
                </Button>
                <Button onClick={() => setPendingStatus(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Log activity */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addActivity(noteType, note);
            }}
            className="space-y-2"
          >
            <div className="flex gap-1.5">
              {(
                [
                  ['NOTE', 'Note'],
                  ['CALL', 'Call'],
                  ['WHATSAPP', 'WhatsApp'],
                  ['EMAIL', 'Email'],
                ] as const
              ).map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setNoteType(v)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                    noteType === v ? 'bg-amber-500 text-onyx border-amber-500' : 'border-slate-700 text-slate-400 hover:text-slate-50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={noteType === 'NOTE' ? 'Add a note…' : `What happened on the ${noteType.toLowerCase()}?`}
              className={inputCls}
            />
            <Button type="submit" variant="primary" disabled={saving || !note.trim()}>
              <Send className="w-3.5 h-3.5" /> Log {noteType === 'NOTE' ? 'note' : noteType.toLowerCase()}
            </Button>
          </form>

          {/* Timeline */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> History
            </h4>
            <ol className="space-y-3 border-l border-slate-800 pl-4">
              {lead.activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[25px] top-0.5 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                    {ACTIVITY_ICON[a.type]}
                  </span>
                  <div className="text-slate-200 whitespace-pre-wrap">{a.body}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {a.user?.name ?? 'System'} · {timeAgo(a.createdAt)}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-800">
              <Button variant="danger" onClick={remove}>
                <Trash2 className="w-3.5 h-3.5" /> Delete lead permanently
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
