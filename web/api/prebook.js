// POST /api/prebook — saves a pre-booking as a Shopify customer tagged "prebook".
// Needs two Vercel environment variables (Project > Settings > Environment Variables):
//   SHOPIFY_STORE_DOMAIN        e.g. hlthx.myshopify.com
//   SHOPIFY_ADMIN_ACCESS_TOKEN  Admin API token from a Shopify custom app with
//                               write_customers + read_customers scopes
// Until both are set it answers 503 "not_configured" and the page says the details were not saved.

const API_VERSION = '2025-07';
const TAGS = ['prebook', 'prebook-web'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+[1-9]\d{6,15}$/;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

async function shopify(query, variables) {
  const r = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.errors) throw new Error(`Shopify ${r.status}: ${JSON.stringify(json.errors || json).slice(0, 300)}`);
  return json.data;
}

const CREATE = `mutation($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id } userErrors { field message } }
}`;
const FIND = `query($q: String!) { customers(first: 1, query: $q) { nodes { id note } } }`;
const UPDATE = `mutation($input: CustomerInput!) {
  customerUpdate(input: $input) { customer { id } userErrors { field message } }
}`;
const TAGS_ADD = `mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`;
const CONSENT = `mutation($input: CustomerEmailMarketingConsentUpdateInput!) {
  customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } }
}`;

const taken = (errs, field) => errs.some(e => (e.field || []).includes(field) && /taken/i.test(e.message));

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { ok: false, error: 'method' }); }

  let b;
  try { b = await readBody(req); } catch { return send(res, 400, { ok: false, error: 'invalid', message: 'Invalid request.' }); }

  // Spam trap filled: pretend success so bots move on, store nothing.
  if (b.company) return send(res, 200, { ok: true });

  const firstName = String(b.firstName || '').trim().slice(0, 60);
  const lastName = String(b.lastName || '').trim().slice(0, 60);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 254);
  const phone = String(b.phone || '').trim();
  if (!firstName || !EMAIL_RE.test(email) || !PHONE_RE.test(phone) || b.consent !== true) {
    return send(res, 400, { ok: false, error: 'invalid', message: 'Please check your name, phone, email and consent.' });
  }

  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return send(res, 503, { ok: false, error: 'not_configured' });
  }

  const stamp = `Pre-booked on website ${new Date().toISOString().slice(0, 10)}. Phone: ${phone}. Consented to launch contact by phone and email.`;
  const consent = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN', consentUpdatedAt: new Date().toISOString() };

  try {
    const input = { firstName, lastName: lastName || null, email, phone, tags: TAGS, note: stamp, emailMarketingConsent: consent };
    let out = (await shopify(CREATE, { input })).customerCreate;

    // Phone already belongs to another customer: keep the lead, record the phone in the note instead.
    if (out.userErrors.length && taken(out.userErrors, 'phone') && !taken(out.userErrors, 'email')) {
      delete input.phone;
      out = (await shopify(CREATE, { input })).customerCreate;
    }

    // Email already a customer: tag them, append the note, subscribe them.
    if (out.userErrors.length && taken(out.userErrors, 'email')) {
      const found = (await shopify(FIND, { q: `email:${email}` })).customers.nodes[0];
      if (!found) throw new Error('Email reported taken but customer not found');
      await shopify(TAGS_ADD, { id: found.id, tags: TAGS });
      await shopify(UPDATE, { input: { id: found.id, note: [found.note, stamp].filter(Boolean).join('\n') } });
      await shopify(CONSENT, { input: { customerId: found.id, emailMarketingConsent: consent } });
      return send(res, 200, { ok: true });
    }

    if (out.userErrors.length) throw new Error(JSON.stringify(out.userErrors));
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error('prebook failed', err && err.message);
    return send(res, 502, { ok: false, error: 'upstream' });
  }
};
