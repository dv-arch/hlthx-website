(function(){
  // Where pre-bookings are sent. /api/prebook (api/prebook.js) creates a Shopify customer
  // tagged "prebook" once SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are set in Vercel.
  var PREBOOK_ENDPOINT = '/api/prebook';

  var $ = function(id){return document.getElementById(id)};
  var form = $('prebook-form'), btn = $('pb-submit'), status = $('pb-status');
  $('year').textContent = new Date().getFullYear();

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function phoneE164(cc, raw){
    var digits = String(raw||'').replace(/\D/g,'');
    if (cc === '+91') digits = digits.replace(/^(91|0)(?=\d{10}$)/, '');
    if (cc === '+91' && !/^[6-9]\d{9}$/.test(digits)) return null;
    if (digits.length < 6 || digits.length > 14) return null;
    return cc + digits;
  }

  function setErr(id, msg){
    var input = $(id), out = $(id+'-err');
    out.textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function validate(){
    var lead = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: phoneE164(form.countryCode.value, form.phone.value),
      consent: form.consent.checked,
      company: form.company.value
    };
    var ok = [
      setErr('pb-first', lead.firstName ? '' : 'Please enter your first name.'),
      setErr('pb-phone', form.phone.value.trim() === '' ? 'Please enter your phone number.' : (lead.phone ? '' : 'Please enter a valid phone number' + (form.countryCode.value === '+91' ? ' (10 digits).' : '.'))),
      setErr('pb-email', lead.email === '' ? 'Please enter your email address.' : (EMAIL_RE.test(lead.email) ? '' : 'Please enter a valid email address.')),
      setErr('pb-consent', lead.consent ? '' : 'Please tick the box so we can contact you at launch.')
    ].every(Boolean);
    return ok ? lead : null;
  }

  // The single place a lead leaves the browser. Resolves only when the server confirms it was saved.
  function submitLead(lead){
    return fetch(PREBOOK_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(lead)
    }).then(function(res){
      return res.json().catch(function(){return {}}).then(function(body){
        if (!res.ok || !body.ok) {
          var e = new Error(body.message || 'Request failed'); e.code = body.error; throw e;
        }
        return body;
      });
    });
  }

  ['pb-first','pb-phone','pb-email','pb-consent'].forEach(function(id){
    $(id).addEventListener('input', function(){ if ($(id+'-err').textContent) validate(); });
    $(id).addEventListener('change', function(){ if ($(id+'-err').textContent) validate(); });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    status.textContent = '';
    var lead = validate();
    if (!lead) { var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    btn.disabled = true; btn.textContent = 'Saving your pre-booking…';
    submitLead(lead).then(function(){
      $('pb-thanks-name').textContent = lead.firstName;
      $('pb-thanks-phone').textContent = lead.phone;
      $('pb-thanks-email').textContent = lead.email;
      form.hidden = true;
      $('pb-thanks').hidden = false;
      $('pb-thanks').focus();
    }).catch(function(err){
      status.textContent = err.code === 'not_configured'
        ? 'Pre-booking isn’t switched on yet, so your details were not saved. Please try again soon.'
        : (err.code === 'invalid' && err.message ? err.message : 'Sorry, we couldn’t save your pre-booking. Please check your connection and try again.');
    }).then(function(){
      btn.disabled = false; btn.textContent = 'Pre-book now';
    });
  });
})();
