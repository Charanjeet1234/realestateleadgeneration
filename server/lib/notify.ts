import nodemailer, { type Transporter } from 'nodemailer';
import crypto from 'node:crypto';
import { config } from './config.js';

export interface LeadAlert {
  id: string;
  name: string;
  phone: string;
  email: string;
  preferredLocation: string | null;
  budget: string | null;
  transactionType: string;
  unitType: string | null;
  message: string | null;
  source: string;
  propertyTitle: string | null;
  isVip: boolean;
  createdAt: Date;
  assignedTo?: { name: string; email: string; phone: string | null } | null;
  repeat?: boolean;
}

const TRANSACTION_LABELS: Record<string, string> = {
  buy_offplan: 'Buy — Off-Plan',
  buy_ready: 'Buy — Ready',
  rent_annual: 'Rent — Annual',
  rent_shortterm: 'Rent — Short-Term',
};

let transporter: Transporter | null = null;
function getTransporter() {
  if (!config.smtp.host || !config.smtp.from) return null;
  transporter ??= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
}

const esc = (s: string | null | undefined) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

async function sendBrokerEmail(lead: LeadAlert) {
  const t = getTransporter();
  const to = [...new Set([...(lead.assignedTo ? [lead.assignedTo.email] : []), ...config.alertEmails])];
  if (!t || to.length === 0) return 'skipped';

  const subject = `${lead.repeat ? '🔁 Repeat inquiry' : lead.isVip ? '⭐ VIP lead' : '🆕 New lead'}: ${lead.name} — ${
    lead.propertyTitle || lead.preferredLocation || 'General inquiry'
  }`;
  const rows: [string, string | null][] = [
    ['Name', lead.name],
    ['Phone / WhatsApp', lead.phone],
    ['Email', lead.email],
    ['Interest', TRANSACTION_LABELS[lead.transactionType] || lead.transactionType],
    ['Location', lead.preferredLocation],
    ['Budget', lead.budget],
    ['Unit type', lead.unitType],
    ['Property', lead.propertyTitle],
    ['Source', lead.source],
    ['Assigned to', lead.assignedTo?.name || 'Unassigned'],
    ['Message', lead.message],
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">${esc(subject)}</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
        ${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td style="color:#666;vertical-align:top">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
          .join('')}
      </table>
      <p style="margin-top:16px">
        <a href="${waLink(lead.phone)}" style="background:#16a34a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">WhatsApp client</a>
        &nbsp;
        <a href="${esc(config.appUrl)}/crm?lead=${esc(lead.id)}" style="color:#b45309">Open in CRM →</a>
      </p>
      <p style="color:#999;font-size:12px">Follow-up target: within 15 minutes.</p>
    </div>`;

  await t.sendMail({ from: config.smtp.from, to, subject, html, replyTo: lead.email });
  return 'sent';
}

async function sendClientAutoReply(lead: LeadAlert) {
  const t = getTransporter();
  if (!t || !config.leads.autoReply || lead.repeat) return 'skipped';
  const subject = `We received your inquiry — ${config.agencyName}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <p>Dear ${esc(lead.name)},</p>
      <p>Thank you for your interest${lead.propertyTitle ? ` in <strong>${esc(lead.propertyTitle)}</strong>` : ''}.
      ${lead.assignedTo ? `<strong>${esc(lead.assignedTo.name)}</strong>` : 'One of our property specialists'} will contact you shortly on
      ${esc(lead.phone)}.</p>
      <p>Kind regards,<br/>${esc(config.agencyName)}</p>
    </div>`;
  await t.sendMail({ from: config.smtp.from, to: lead.email, subject, html });
  return 'sent';
}

async function sendWhatsAppAlerts(lead: LeadAlert) {
  const { accountSid, authToken, whatsappFrom } = config.twilio;
  const recipients = [
    ...new Set([...(lead.assignedTo?.phone ? [lead.assignedTo.phone] : []), ...config.alertWhatsApp]),
  ];
  if (!accountSid || !authToken || !whatsappFrom || recipients.length === 0) return 'skipped';

  const body = [
    `${lead.repeat ? 'Repeat inquiry' : lead.isVip ? 'VIP lead' : 'New lead'}: ${lead.name}`,
    `📞 ${lead.phone}`,
    `✉️ ${lead.email}`,
    lead.propertyTitle || lead.preferredLocation ? `🏠 ${lead.propertyTitle || lead.preferredLocation}` : '',
    lead.budget ? `💰 ${lead.budget}` : '',
    `Source: ${lead.source}`,
    `Reply: ${waLink(lead.phone)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const from = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`;
  const results = await Promise.allSettled(
    recipients.map(async (to) => {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: from, To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`, Body: body }),
      });
      if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
    }),
  );
  const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (failed.length) throw new Error(failed.map((f) => String(f.reason)).join('; '));
  return 'sent';
}

async function postWebhook(lead: LeadAlert) {
  if (!config.leadWebhookUrl) return 'skipped';
  const payload = JSON.stringify({ event: lead.repeat ? 'lead.repeat' : 'lead.created', lead });
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.leadWebhookSecret) {
    headers['X-PropEngine-Signature'] = crypto.createHmac('sha256', config.leadWebhookSecret).update(payload).digest('hex');
  }
  const res = await fetch(config.leadWebhookUrl, { method: 'POST', headers, body: payload });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  return 'sent';
}

/**
 * Fire all configured alerts in parallel. Awaited by the caller (serverless
 * functions may be frozen after the response), but capped so a slow provider
 * never delays the client for long. Failures are logged, never thrown.
 */
export async function notifyNewLead(lead: LeadAlert) {
  const jobs = {
    brokerEmail: sendBrokerEmail(lead),
    clientEmail: sendClientAutoReply(lead),
    whatsapp: sendWhatsAppAlerts(lead),
    webhook: postWebhook(lead),
  };
  const entries = Object.entries(jobs);
  const results = await Promise.allSettled(entries.map(([k, p]) => withTimeout(p, 6000, k)));
  const summary: Record<string, string> = {};
  results.forEach((r, i) => {
    const key = entries[i][0];
    if (r.status === 'fulfilled') summary[key] = r.value;
    else {
      summary[key] = 'failed';
      console.error(`Lead alert "${key}" failed for ${lead.id}:`, r.reason);
    }
  });
  return summary;
}
