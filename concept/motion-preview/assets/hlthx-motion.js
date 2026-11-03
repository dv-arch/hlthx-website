/* Site-wide motion, built on Motion (motion.dev, MIT, assets/motion.min.js).
   - Hero: headline, tiles and button rise into place on load; the hero content drifts up gently as you scroll away.
   - Sections: headings, cards, stats, steps and FAQ items rise in, staggered, as they scroll into view.
   - Stats count up to their number. Buttons and cards respond with a soft spring on hover and press.
   - Header gains a soft shadow once the page scrolls.
   Nothing runs for visitors who prefer reduced motion, and the content is never hidden without this script. */
(function(){
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var M = window.Motion;
  if (!M || reduce){ root.classList.remove('mo'); return; }
  var animate = M.animate, inView = M.inView, stagger = M.stagger, scroll = M.scroll, hover = M.hover, press = M.press;
  var EASE = [0.22, 1, 0.36, 1];
  function $$(sel, ctx){ return [].slice.call((ctx || document).querySelectorAll(sel)); }

  // hero: the first thing people see
  var hero = document.querySelector('.hx');
  if (hero){
    var lines = $$('.hx__copy > *', hero), tiles = $$('.hx__tile', hero), cta = $$('.hx__cta', hero);
    animate(lines, {opacity: [0, 1], y: [28, 0]}, {duration: .9, delay: stagger(.09, {startDelay: .1}), ease: EASE});
    animate(tiles, {opacity: [0, 1], y: [22, 0], scale: [.94, 1]}, {duration: .8, delay: stagger(.08, {startDelay: .45}), ease: EASE});
    animate(cta, {opacity: [0, 1], y: [16, 0]}, {duration: .8, delay: .75, ease: EASE});
    var inner = hero.querySelector('.hx__inner');
    if (inner && scroll) scroll(animate(inner, {y: [0, 70], opacity: [1, .25]}, {ease: 'linear'}), {target: hero, offset: ['start start', 'end start']});
  }
  setTimeout(function(){ root.classList.remove('mo'); }, 1800);

  // scroll reveals
  var GROUPS = [
    '.eyebrow, .wb-eyebrow, h2, .lede, section .muted:not(li .muted), .wb-head > p',
    '.stat', '.badge-i', '.blend', '.doc', '.wb-fcard', '.wb-hl > div', '.wb-why > div', '.wb-table tbody tr', '.wb-nums > div',
    '.faq details', '.review', '.expert', '.plan', '.compare .crow', '.rf__stage', '.directions'
  ];
  $$('main section, main .mq').forEach(function(sec){
    if (sec === hero || sec.classList.contains('mq')) return;
    GROUPS.forEach(function(sel){
      var items = $$(sel, sec).filter(function(el){ return !el.closest('.hx') && !el.__mo; });
      if (!items.length) return;
      items.forEach(function(el){ el.__mo = 1; el.style.opacity = 0; el.style.transform = 'translateY(26px)'; });
      inView(items[0].parentElement || items[0], function(){
        animate(items, {opacity: [0, 1], y: [26, 0]}, {duration: .85, delay: stagger(.07), ease: EASE});
      }, {amount: .15, margin: '0px 0px -8% 0px'});
    });
    // the ritual steps keep their own highlight, so they only slide (no fade)
    var steps = $$('.rf__steps li', sec);
    if (steps.length){
      steps.forEach(function(el){ el.style.transform = 'translateX(-18px)'; });
      inView(steps[0].parentElement, function(){ animate(steps, {x: [-18, 0]}, {duration: .8, delay: stagger(.08), ease: EASE}); }, {amount: .2});
    }
  });

  // stats count up to their number, keeping "+", units and labels
  $$('.stat b, .hx__tile b').forEach(function(b){
    var node = [].slice.call(b.childNodes).filter(function(n){ return n.nodeType === 3 && /\d/.test(n.nodeValue); })[0];
    if (!node) return;
    var m = node.nodeValue.match(/^(\D*)(\d+)(.*)$/); if (!m) return;
    var to = parseInt(m[2], 10); if (to < 2) return;
    var started = false;
    inView(b, function(){
      if (started) return; started = true;
      animate(0, to, {duration: 1.4, ease: EASE, onUpdate: function(v){ node.nodeValue = m[1] + Math.round(v) + m[3]; }});
    }, {amount: .6});
    node.nodeValue = m[1] + '0' + m[3];
  });

  // gentle zoom as the ritual film comes into view
  var stage = document.querySelector('.rf__stage');
  if (stage && scroll) scroll(animate(stage, {scale: [.94, 1]}, {ease: 'linear'}), {target: stage, offset: ['start end', 'center center']});

  // springy buttons and cards
  if (hover && press){
    hover('.btn, .wb-fcard[href], a.card', function(el){
      animate(el, {y: -3}, {type: 'spring', stiffness: 420, damping: 26});
      return function(){ animate(el, {y: 0}, {type: 'spring', stiffness: 420, damping: 26}); };
    });
    press('.btn', function(el){
      animate(el, {scale: .97}, {type: 'spring', stiffness: 600, damping: 30});
      return function(){ animate(el, {scale: 1}, {type: 'spring', stiffness: 500, damping: 22}); };
    });
  }

  // header shadow once scrolled
  var top = document.querySelector('.top');
  if (top){
    var on = false;
    var check = function(){ var s = window.scrollY > 8; if (s !== on){ on = s; top.classList.toggle('is-scrolled', s); } };
    window.addEventListener('scroll', check, {passive: true}); check();
  }
})();
