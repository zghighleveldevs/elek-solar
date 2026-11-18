// Vercel serverless function: receives website form submissions and forwards
// them to the GoHighLevel inbound webhook. Keeping the webhook URL here (server
// side) means it is never exposed in the page source.

const GHL_WEBHOOK_URL =
  process.env.GHL_WEBHOOK_URL ||
  'https://services.leadconnectorhq.com/hooks/b9VfXEZlvY7G1nib8Vuh/webhook-trigger/be410b24-3200-47dd-8270-04a913e9303a';

const clean = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  // Honeypot: real visitors never see or fill the "website" field.
  if (clean(body.website)) return res.status(200).json({ ok: true });

  const lead = {
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    email: clean(body.email, 160),
    phone: clean(body.phone, 40),
    address: clean(body.address, 250),
    service: clean(body.service, 80),
    monthly_bill: clean(body.bill, 40),
    message: clean(body.description, 2000),
    sms_consent: body.sms_consent === true || body.sms_consent === 'on' || body.sms_consent === 'true',
    form_name: clean(body.form_name, 120) || 'Website Form',
    page_url: clean(body.page_url, 500),
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 160),
    utm_term: clean(body.utm_term, 160),
    utm_content: clean(body.utm_content, 160),
    source: 'Website',
    submitted_at: new Date().toISOString(),
  };
  lead.full_name = [lead.first_name, lead.last_name].filter(Boolean).join(' ');

  // Minimal server-side validation (the browser validates fully first).
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email);
  const phoneOk = lead.phone.replace(/\D/g, '').length >= 10;
  if (!lead.first_name || !emailOk || !phoneOk) {
    return res.status(400).json({ ok: false, error: 'Missing or invalid name, email or phone' });
  }

  try {
    const r = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!r.ok) {
      console.error('GHL webhook error', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ ok: false, error: 'CRM did not accept the lead' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('GHL webhook request failed', err);
    return res.status(502).json({ ok: false, error: 'Could not reach CRM' });
  }
};
