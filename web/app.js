(function(){
  var d = JSON.parse(document.getElementById('product-data').textContent);
  var $ = function(id){return document.getElementById(id)};
  function todo(label){return '<span class="todo">'+(label||'')+'</span>'}
  function money(n){return n==null?null:new Intl.NumberFormat('en-IN',{style:'currency',currency:d.currency,maximumFractionDigits:0}).format(n)}

  document.querySelectorAll('[data-f]').forEach(function(el){
    var k=el.getAttribute('data-f'); el.textContent = k==='blendCount' ? d.blends.length : d[k];
  });
  $('tags').innerHTML = d.goalTags.map(function(t){return '<span class="tag">'+t+'</span>'}).join('') + (d.goalTagsComplete?'':todo('full tag list'));

  var icons = {
    sun:'<circle cx="22" cy="22" r="7"/><path d="M22 6v5M22 33v5M6 22h5M33 22h5M10.7 10.7l3.5 3.5M29.8 29.8l3.5 3.5M10.7 33.3l3.5-3.5M29.8 14.2l3.5-3.5"/>',
    hex:'<path d="M22 6l14 8v16l-14 8-14-8V14z"/><circle cx="22" cy="22" r="4" stroke="var(--red-text)"/>',
    chain:'<circle cx="14" cy="22" r="6"/><circle cx="30" cy="22" r="6"/><path d="M20 22h4" stroke="var(--red-text)"/>',
    drop:'<path d="M22 6c7 9 11 15 11 21a11 11 0 01-22 0c0-6 4-12 11-21z"/><path d="M17 28a5 5 0 005 5" stroke="var(--red-text)"/>',
    leaf:'<path d="M10 34C10 18 20 10 36 8c0 16-8 26-24 26z"/><path d="M10 34l14-14" stroke="var(--red-text)"/>',
    dots:'<circle cx="22" cy="22" r="15"/><circle cx="16" cy="18" r="2.5" stroke="var(--red-text)"/><circle cx="27" cy="16" r="2"/><circle cx="25" cy="27" r="2.5" stroke="var(--red-text)"/><circle cx="15" cy="28" r="1.5"/>',
    spiral:'<path d="M22 22a3 3 0 113 3 7 7 0 01-7-7 10 10 0 0110-10 13 13 0 0113 13"/><path d="M8 36l6-6" stroke="var(--red-text)"/>',
    heart:'<path d="M22 36S8 27 8 17a7 7 0 0114-2 7 7 0 0114 2c0 10-14 19-14 19z"/><path d="M13 21h5l2-4 3 8 2-4h6" stroke="var(--red-text)"/>',
    joint:'<circle cx="14" cy="14" r="5"/><circle cx="30" cy="30" r="5"/><path d="M18 18l8 8" stroke="var(--red-text)" stroke-width="3"/>'
  };
  $('blends').innerHTML = d.blends.map(function(b){
    var list = b.ingredients.length
      ? '<ul>'+b.ingredients.map(function(i){return '<li>'+i+'</li>'}).join('')+'</ul>'
      : '<p>'+todo('ingredients and amounts')+'</p>';
    return '<details class="blend"><summary><svg class="ico" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[b.icon]||'')+'</svg><h3>'+b.name+'</h3><span class="plus" aria-hidden="true">+</span></summary><div class="body">'+list+'</div></details>';
  }).join('');
  $('blends-note').innerHTML = d.blendsComplete ? '' : todo('full category list');

  var docIco='<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h10l5 5v17H7z"/><path d="M17 3v5h5"/><path d="M11 16l2 2 4-5" stroke="var(--red-text)"/></svg>';
  $('docs').innerHTML = d.qualityDocs.map(function(q){
    return '<div class="doc">'+docIco+'<h3>'+q.title+'</h3><p>'+q.text+'</p>'+(q.link?'<a href="'+q.link+'">View document</a>':todo('document'))+'</div>';
  }).join('');

  $('directions').innerHTML = d.directions || 'Mix one sachet daily. ' + todo('approved usage directions');
  $('warnings').innerHTML = d.warnings || todo('warnings and storage');
  $('inbox').innerHTML = d.inTheBox.map(function(i){return '<li>'+i+'</li>'}).join('');
  $('delivery').innerHTML = d.delivery || todo('delivery areas, time and charges');

  var subPrice = null;
  $('price').innerHTML = d.price!=null
    ? '<b>'+money(d.price)+'</b>'+(d.compareAtPrice?'<s>'+money(d.compareAtPrice)+'</s>':'')+'<span class="muted">per 30-Day Box</span>'
    : '<b>₹ —</b>'+todo('price');
  var chk='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5l4 4L16 6"/></svg>';
  $('plans').insertAdjacentHTML('beforeend', d.plans.map(function(p,i){
    var day = p.price!=null ? money(p.price/(30*p.boxes))+' / day' : '';
    return '<label class="plan" for="plan-'+p.id+'">'+(p.popular?'<span class="flag">Most popular</span>':'')+
      '<input type="radio" name="plan" id="plan-'+p.id+'" value="'+p.id+'"'+(p.popular?' checked':'')+'>'+
      '<span><b>'+p.name+'</b><small>'+p.note+'</small></span>'+
      '<span class="pp">'+(p.price!=null?'<b>'+money(p.price)+'</b><small>'+day+'</small>':todo('price'))+'</span></label>';
  }).join(''));
  $('assure').innerHTML = [
    d.guaranteeDays ? d.guaranteeDays+'-day money-back guarantee' : 'Money-back guarantee '+todo('terms'),
    'Subscriptions: pause, skip or cancel '+todo('policy'),
    d.delivery ? d.delivery : 'Delivery '+todo('areas and charges')
  ].map(function(t){return '<div>'+chk+'<span>'+t+'</span></div>'}).join('');
  var pop = d.plans.filter(function(p){return p.popular})[0];
  $('sticky-price').innerHTML = pop && pop.price!=null ? money(pop.price)+' / month' : 'Price to be confirmed';

  // announcement, hero proof, badges
  $('announce').innerHTML = d.announcement || 'Subscribe &amp; save on every 30-Day Box '+todo('launch offer');
  var stars='<span class="stars" aria-hidden="true">★★★★★</span>';
  $('hero-proof').innerHTML = d.rating!=null
    ? stars+'<span><b style="color:var(--ink)">'+d.rating.toFixed(1)+'</b> from '+d.reviewCount.toLocaleString('en-IN')+' reviews</span>'
    : stars+'<span>'+todo('rating and review count')+'</span>';
  var bi={flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M7 15h10"/>',shield:'<path d="M12 21c5-2 8-6 8-11V5l-8-2-8 2v5c0 5 3 9 8 11z"/><path d="M9 12l2 2 4-4"/>',box:'<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'};
  function ico(k){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+bi[k]+'</svg>'}
  $('badges').innerHTML = [
    [ico('box'), d.sachetsPerBox+' sachets in every box'],
    [ico('cal'), 'One sachet, once a day'],
    [ico('flask'), d.certifications.length ? d.certifications[0] : 'Third-party tested '+todo('')],
    [ico('shield'), d.guaranteeDays ? d.guaranteeDays+'-day guarantee' : 'Guarantee '+todo('')]
  ].map(function(b){return '<div class="badge-i">'+b[0]+'<span>'+b[1]+'</span></div>'}).join('');

  // compare rows
  $('compare-rows').innerHTML = d.blends.map(function(b){
    return '<div class="crow" role="row"><span role="cell">'+b.name+'</span><span class="yes" role="cell">✓</span><span role="cell" class="muted">+1</span></div>';
  }).join('');

  // supplement facts
  $('facts-body').innerHTML = '<div class="frow h"><span>Per 15 g sachet</span><span>Amount</span></div>' + (d.supplementFacts.length
    ? d.supplementFacts.map(function(f){return '<div class="frow"><span>'+f.name+'</span><span>'+f.amount+'</span></div>'}).join('')
    : '<div class="frow"><span>Full ingredient list with amounts per serving</span><span>'+todo('')+'</span></div>');

  // experts
  $('experts').innerHTML = d.experts.length
    ? d.experts.map(function(e){return '<div class="expert"><h3>'+e.name+'</h3><p class="muted">'+e.role+'</p></div>'}).join('')
    : [1,2,3].map(function(){return '<div class="expert"><div class="ph"></div><h3>'+todo('name')+'</h3><p class="muted">'+todo('credentials and role in formulation')+'</p></div>'}).join('');

  // reviews
  $('rev-score').innerHTML = d.rating!=null ? '<b>'+d.rating.toFixed(1)+'</b> '+stars+'<div class="muted">'+d.reviewCount+' verified reviews</div>' : todo('average rating');
  $('review-list').innerHTML = d.reviews.length
    ? d.reviews.map(function(r){return '<div class="review">'+stars+'<p>'+r.text+'</p><div class="who">'+r.name+'</div></div>'}).join('')
    : [1,2,3].map(function(){return '<div class="review">'+stars+'<p>'+todo('verified customer review')+'</p><div class="who">'+todo('name, city')+'</div></div>'}).join('');

  // faq
  var faq = [
    ['How do I take HLTHX™?', 'Mix one 15 g sachet into water once a day. '+todo('amount of water and best time of day')],
    ["What's inside?", 'Nine ingredient categories, from multivitamins and minerals to a probiotic complex and digestive enzymes. Open <a href="#formula">Inside the Formula</a> for each category. '+todo('full ingredient list with amounts')],
    ['Can I pause or cancel my subscription?', todo('subscription terms')],
    ['Is it safe with medication, or during pregnancy?', 'Consult your doctor before use if you are pregnant, nursing, taking medication or have a medical condition.'],
    ['How is HLTHX™ tested?', todo('manufacturing standards and test reports')],
    ['Where do you deliver, and how long does it take?', d.delivery || todo('delivery areas, time and charges')],
    ['What if it is not right for me?', d.guaranteeDays ? 'You are covered by our '+d.guaranteeDays+'-day money-back guarantee.' : todo('returns and guarantee policy')]
  ];
  $('faq-list').innerHTML = faq.map(function(q,i){return '<details'+(i===0?' open':'')+'><summary>'+q[0]+'<span class="plus" aria-hidden="true">+</span></summary><div class="a"><p>'+q[1]+'</p></div></details>'}).join('');

  // sticky bar appears after hero, hides at the buy box
  var sticky=$('sticky'), hero=document.querySelector('.hero'), shop=$('shop');
  if('IntersectionObserver' in window){
    var heroOut=false, shopIn=false;
    function upd(){sticky.classList.toggle('on', heroOut && !shopIn)}
    new IntersectionObserver(function(e){heroOut=!e[0].isIntersecting;upd()}).observe(hero);
    new IntersectionObserver(function(e){shopIn=e[0].isIntersecting;upd()}).observe(shop);
  }

  var qty=1, cart=0;
  function setQ(n){qty=Math.max(1,Math.min(10,n));$('qty').textContent=qty}
  $('qty-minus').onclick=function(){setQ(qty-1)};
  $('qty-plus').onclick=function(){setQ(qty+1)};
  $('buy-form').addEventListener('submit',function(e){
    e.preventDefault();
    cart+=qty; $('cart-count').textContent=cart;
    var m=$('cart-msg'); m.hidden=false;
    m.textContent = 'Added '+qty+' × 30-Day Box to your cart. Checkout opens at launch.';
  });
  $('year').textContent = new Date().getFullYear();
})();
