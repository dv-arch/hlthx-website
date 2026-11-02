/* Home hero: golden silk background (approved Option A) and the typed headline.
   The silk is drawn in code, pauses off screen or in a background tab, and is a still frame for reduced-motion users. */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- A: golden silk ---------- */
  function silk(s){
    var ctx = s.ctx;
    function frame(t){
      var w = s.w, h = s.h;
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#FBFBFA'); g.addColorStop(.55, '#ECECEE'); g.addColorStop(1, '#DCDCE0');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // satin folds: alternating highlight and shadow bands, like the silk on the pack
      var folds = 7;
      for (var f = 0; f < folds; f++){
        var fy = h * (.12 + f * .14);
        var top = [], bot = [];
        for (var x = -40; x <= w + 40; x += 18){
          var u = x / w;
          var y = fy + Math.sin(u * 3.1 + t * .00016 + f * 1.3) * h * .11 + Math.sin(u * 7.3 - t * .0001 + f * 2.1) * h * .03;
          var th = h * (.05 + .035 * Math.sin(u * 4 + f + t * .00012));
          top.push([x, y]); bot.push([x, y + th]);
        }
        ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
        for (var q = 1; q < top.length; q++) ctx.lineTo(top[q][0], top[q][1]);
        for (var r = bot.length - 1; r >= 0; r--) ctx.lineTo(bot[r][0], bot[r][1]);
        ctx.closePath();
        var gy = ctx.createLinearGradient(0, fy - h * .08, 0, fy + h * .16);
        if (f % 3 === 1){ gy.addColorStop(0, 'rgba(244,198,78,0)'); gy.addColorStop(.5, 'rgba(236,180,60,.26)'); gy.addColorStop(1, 'rgba(244,198,78,0)'); }
        else if (f % 3 === 0){ gy.addColorStop(0, 'rgba(255,255,255,0)'); gy.addColorStop(.45, 'rgba(255,255,255,.85)'); gy.addColorStop(1, 'rgba(255,255,255,0)'); }
        else { gy.addColorStop(0, 'rgba(150,150,160,0)'); gy.addColorStop(.55, 'rgba(150,150,160,.22)'); gy.addColorStop(1, 'rgba(150,150,160,0)'); }
        ctx.fillStyle = gy; ctx.fill();
      }

      // fine silk threads: many close lines give the sheen
      var n = w < 700 ? 34 : 52;
      for (var i = 0; i < n; i++){
        var k = i / n;
        var base = h * (.18 + k * .78);
        var amp = h * (.08 + .05 * Math.sin(k * 6.3));
        ctx.beginPath();
        for (var x2 = -20; x2 <= w + 20; x2 += 14){
          var u = x2 / w;
          var y2 = base
            + Math.sin(u * 5.2 + t * .00022 + k * 2.4) * amp
            + Math.sin(u * 11.0 - t * .00015 + k * 5.1) * amp * .28
            + Math.sin(u * 2.1 + t * .00008) * h * .06 * (1 - k);
          if (x2 < 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        var band = Math.abs(Math.sin(k * Math.PI * 2.2 + t * .00012));
        if (i % 3 === 0){ ctx.strokeStyle = 'rgba(205,150,30,' + (.04 + band * .14).toFixed(3) + ')'; ctx.lineWidth = 1; }
        else if (i % 3 === 1){ ctx.strokeStyle = 'rgba(255,255,255,' + (.2 + band * .45).toFixed(3) + ')'; ctx.lineWidth = 1.4; }
        else { ctx.strokeStyle = 'rgba(150,150,158,' + (.05 + band * .12).toFixed(3) + ')'; ctx.lineWidth = 1; }
        ctx.stroke();
      }

      // warm light from the upper right, like light on the pack
      var lg = ctx.createRadialGradient(w * .78, h * .18, 0, w * .78, h * .18, Math.max(w, h) * .6);
      lg.addColorStop(0, 'rgba(255,214,120,.28)'); lg.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
    }
    return {frame: frame};
  }

  function start(canvas){
    var ctx = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var s = {ctx: ctx, w: 1, h: 1}, scene = silk(s), raf = 0, visible = true, t0 = performance.now();
    function size(){
      var r = canvas.getBoundingClientRect();
      s.w = Math.max(1, r.width); s.h = Math.max(1, r.height);
      canvas.width = Math.round(s.w * dpr); canvas.height = Math.round(s.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.frame(performance.now() - t0);
    }
    function loop(now){ raf = 0; if (!visible || document.hidden || reduce) return; scene.frame(now - t0); raf = requestAnimationFrame(loop); }
    function kick(){ if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop); }
    size();
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(size, 150); });
    document.addEventListener('visibilitychange', kick);
    if ('IntersectionObserver' in window) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; kick(); }).observe(canvas);
    kick();
  }

  function typed(el){
    var words = el.getAttribute('data-typed').split('|').map(function(w){ return w.trim(); }).filter(Boolean);
    if (!words.length) return;
    el.textContent = words[0];
    if (reduce || words.length < 2) return;
    var wi = 0, ci = words[0].length, del = true;
    function tick(){
      if (del){
        ci--; el.textContent = words[wi].slice(0, ci);
        if (ci <= 0){ del = false; wi = (wi + 1) % words.length; return setTimeout(tick, 260); }
        return setTimeout(tick, 32);
      }
      ci++; el.textContent = words[wi].slice(0, ci);
      if (ci >= words[wi].length){ del = true; return setTimeout(tick, 1700); }
      setTimeout(tick, 62);
    }
    setTimeout(tick, 1900);
  }

  document.querySelectorAll('[data-silk]').forEach(start);
  document.querySelectorAll('[data-typed]').forEach(typed);
})();
