/* Ingredients page: filter the ingredient library by body system.
   Chips set the filter; links on the body-system cards (data-sys-filter) set it too and scroll to the library.
   The choice is kept in the address (?system=immune) so a filtered view can be shared.
   Without this script every ingredient is simply shown. */
(function(){
  var lib = document.getElementById('library');
  if (!lib) return;
  var chips = [].slice.call(lib.querySelectorAll('.chip[data-filter]'));
  var cards = [].slice.call(lib.querySelectorAll('.ing'));
  var groups = [].slice.call(lib.querySelectorAll('[data-group]'));
  var count = lib.querySelector('[data-count]');
  var names = {};
  chips.forEach(function(c){ names[c.dataset.filter] = c.textContent.trim(); });

  // keep the filter bar just below the header when the header sticks
  var top = document.querySelector('.top');
  function hdr(){
    var cs = top && getComputedStyle(top);
    var h = top && (cs.position === 'sticky' || cs.position === 'fixed') ? top.offsetHeight : 0;
    document.documentElement.style.setProperty('--hdr-h', h + 'px');
  }
  hdr(); window.addEventListener('resize', hdr, {passive: true});

  function apply(key, push){
    if (!names[key]) key = 'all';
    var shown = 0;
    cards.forEach(function(card){
      var on = key === 'all' || (' ' + card.dataset.systems + ' ').indexOf(' ' + key + ' ') > -1;
      card.hidden = !on; if (on) shown++;
    });
    groups.forEach(function(g){ g.hidden = !g.querySelector('.ing:not([hidden])'); });
    chips.forEach(function(c){ c.setAttribute('aria-pressed', String(c.dataset.filter === key)); });
    if (count) count.textContent = key === 'all' ? shown + ' ingredients' : shown + ' ingredients for ' + names[key];
    var on = chips.filter(function(c){ return c.dataset.filter === key; })[0];
    if (on && on.scrollIntoView) on.scrollIntoView({block: 'nearest', inline: 'center'});
    if (push !== false && history.replaceState){
      var u = new URL(location.href);
      if (key === 'all') u.searchParams.delete('system'); else u.searchParams.set('system', key);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  }

  chips.forEach(function(c){ c.addEventListener('click', function(){ apply(c.dataset.filter); }); });
  [].slice.call(document.querySelectorAll('[data-sys-filter]')).forEach(function(a){
    a.addEventListener('click', function(e){
      var key = a.dataset.sysFilter, target = a.getAttribute('href') || '#library';
      apply(key);
      var el = document.querySelector(target);
      if (el){ e.preventDefault(); el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'}); if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + target); }
    });
  });
  // the system links on each ingredient card filter in place instead of leaving the page
  [].slice.call(lib.querySelectorAll('[data-sys-link]')).forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); apply(a.dataset.sysLink); lib.scrollIntoView({block: 'start'}); });
  });

  var start = new URLSearchParams(location.search).get('system');
  apply(start || 'all', false);
})();
