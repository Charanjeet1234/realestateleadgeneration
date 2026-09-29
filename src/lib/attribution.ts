// First-touch marketing attribution, stored for the browser session and
// attached to every lead so the CRM shows which campaign produced it.

const KEY = 'pe_attribution';

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
}

export function captureAttribution() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : undefined;
    const data: Attribution = {
      utmSource: params.get('utm_source') || (params.get('gclid') ? 'google_ads' : params.get('fbclid') ? 'facebook' : undefined),
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      referrer: ref?.slice(0, 500),
      landingPage: (window.location.pathname + window.location.search).slice(0, 500),
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage blocked — attribution is best-effort
  }
}

export function getAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
