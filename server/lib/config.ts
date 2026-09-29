import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

function required(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (!isProduction && devFallback !== undefined) return devFallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

function list(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  isProduction,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me-please'),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  agencyName: process.env.AGENCY_NAME || 'PropEngine UAE',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  },

  leads: {
    // Round-robin new leads across active agents
    autoAssign: process.env.LEAD_AUTO_ASSIGN !== 'false',
    // Same email or phone inside this window is merged into the existing lead
    dedupeHours: Number(process.env.LEAD_DEDUPE_HOURS || 72),
    // Max lead submissions per IP per 15 minutes
    maxPerIpPer15Min: Number(process.env.LEAD_MAX_PER_IP || 5),
    // Budget (AED) at or above which a lead is flagged VIP
    vipBudgetAED: Number(process.env.LEAD_VIP_BUDGET_AED || 5_000_000),
    // Send the client an acknowledgement email
    autoReply: process.env.LEAD_AUTOREPLY === 'true',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },
  alertEmails: list('LEAD_ALERT_EMAILS'),

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '',
  },
  alertWhatsApp: list('LEAD_ALERT_WHATSAPP'),

  // Optional: POST every new lead as JSON to Zapier / Make / your CRM
  leadWebhookUrl: process.env.LEAD_WEBHOOK_URL || '',
  leadWebhookSecret: process.env.LEAD_WEBHOOK_SECRET || '',
};

if (config.isProduction && config.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.');
}
