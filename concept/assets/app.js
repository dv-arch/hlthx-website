(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // which background option: /option-b or ?bg=b; Option A otherwise
  function pick(){
    var q = new URLSearchParams(location.search).get('bg');
    if (q === 'a' || q === 'b') return q;
    return /option-b/.test(location.pathname) ? 'b' : 'a';
  }

  var hero = document.querySelector('[data-hero]');
  var canvas = document.querySelector('[data-bg-canvas]');
  if (canvas && window.HLTHXBG){
    var mode = canvas.hasAttribute('data-fixed') ? canvas.getAttribute('data-fixed') : pick();
    if (hero) hero.setAttribute('data-bg', mode);
    var bg = window.HLTHXBG.start(canvas, mode);
    var btns = document.querySelectorAll('[data-opt]');
    btns.forEach(function(b){
      b.setAttribute('aria-pressed', b.dataset.opt === mode ? 'true' : 'false');
      b.addEventListener('click', function(){
        mode = b.dataset.opt;
        if (hero) hero.setAttribute('data-bg', mode);
        bg.set(mode);
        btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        try { history.replaceState(null, '', '/option-' + mode); } catch(e) {}
      });
    });
  }

  // typed headline: "Replace your [calcium tablets] with one daily drink."
  var el = document.querySelector('[data-typed]');
  if (el){
    var words = JSON.parse(el.getAttribute('data-typed'));
    if (reduce){ el.textContent = words[0]; }
    else {
      var wi = 0, ci = words[0].length, del = true;
      el.textContent = words[0];
      var tick = function(){
        var w = words[wi];
        if (del){
          ci--; el.textContent = w.slice(0, ci);
          if (ci <= 0){ del = false; wi = (wi + 1) % words.length; return setTimeout(tick, 260); }
          return setTimeout(tick, 32);
        }
        ci++; el.textContent = words[wi].slice(0, ci);
        if (ci >= words[wi].length){ del = true; return setTimeout(tick, 1700); }
        setTimeout(tick, 62);
      };
      setTimeout(tick, 1900);
    }
  }

  // reveal sections as they scroll in
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin: '0px 0px -8% 0px'});
    rv.forEach(function(x){ io.observe(x); });
  } else rv.forEach(function(x){ x.classList.add('in'); });

  var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
