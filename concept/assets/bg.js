/* Hero backgrounds, drawn in code (no video files).
   A "Golden silk": light silver silk folds with turmeric-gold sheen, echoing the silk wave on the pack.
   B "Turmeric swirl": golden powder pouring into dark water and swirling, after the client's reference video.
   Both pause when off screen or in a background tab, and draw a single still frame for reduced-motion users. */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setup(canvas){
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var s = {ctx: ctx, w: 0, h: 0, dpr: dpr};
    function size(){
      var r = canvas.getBoundingClientRect();
      s.w = Math.max(1, r.width); s.h = Math.max(1, r.height);
      canvas.width = Math.round(s.w * dpr); canvas.height = Math.round(s.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (s.onresize) s.onresize();
    }
    s.size = size;
    return s;
  }

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

  /* ---------- B: turmeric swirl ---------- */
  function swirl(s){
    var ctx = s.ctx, P = [], N;
    var cols = ['255,214,110', '242,182,53', '224,150,26', '200,118,26', '255,236,170'];
    function spawn(p, init){
      var w = s.w, h = s.h;
      // most powder pours from a point near the top, some drifts in from the sides
      if (Math.random() < .7){ p.x = w * (.5 + (Math.random() - .5) * .12); p.y = init ? Math.random() * h * .6 : -10 - Math.random() * 40; p.vy = 1.4 + Math.random() * 1.6; }
      else { p.x = Math.random() * w; p.y = init ? Math.random() * h : h * (.5 + Math.random() * .5); p.vy = 0; }
      p.vx = 0; p.life = 0; p.max = 180 + Math.random() * 320;
      p.c = cols[(Math.random() * cols.length) | 0]; p.r = Math.random() < .08 ? 1.9 : .6 + Math.random() * 1.1;
    }
    function reset(){
      P = []; N = Math.round(Math.min(2200, s.w * s.h / 520));
      for (var i = 0; i < N; i++){ var p = {}; spawn(p, true); P.push(p); }
      ctx.fillStyle = '#0D0903'; ctx.fillRect(0, 0, s.w, s.h);
    }
    var C = [];
    function seedClouds(){
      C = []; var n = s.w < 700 ? 16 : 26;
      for (var i = 0; i < n; i++) C.push({x: s.w * (.3 + Math.random() * .4), y: s.h * (.1 + Math.random() * .7), r: Math.max(s.w, s.h) * (.08 + Math.random() * .14), a: .018 + Math.random() * .03, c: cols[(Math.random() * 4) | 0], vx: 0, vy: 0});
    }
    function drawClouds(t){
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < C.length; i++){
        var c = C[i], a = field(c.x, c.y, t * .6);
        c.vx = c.vx * .98 + Math.cos(a) * .05; c.vy = c.vy * .98 + Math.sin(a) * .05 + .004;
        c.x += c.vx; c.y += c.vy;
        if (c.y > s.h + c.r || c.x < -c.r || c.x > s.w + c.r){ c.x = s.w * (.4 + Math.random() * .2); c.y = -c.r * .5; c.vx = c.vy = 0; }
        var g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, 'rgba(' + c.c + ',' + c.a + ')'); g.addColorStop(1, 'rgba(' + c.c + ',0)');
        ctx.fillStyle = g; ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    s.onresize = function(){ reset(); seedClouds(); };
    function field(x, y, t){
      var a = Math.sin(x * .0042 + t * .00021) + Math.cos(y * .0051 - t * .00017) + Math.sin((x + y) * .0023 + t * .00009);
      return a * 1.25;
    }
    function frame(t){
      var w = s.w, h = s.h;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(13,9,3,.13)'; ctx.fillRect(0, 0, w, h);
      drawClouds(t);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < P.length; i++){
        var p = P[i];
        var a = field(p.x, p.y, t);
        var depth = Math.min(1, Math.max(0, p.y / h));
        p.vx += Math.cos(a) * .09 * (.4 + depth);
        p.vy += Math.sin(a) * .09 * (.4 + depth) + .012 * (1 - depth);
        p.vx *= .94; p.vy *= .94;
        p.x += p.vx; p.y += p.vy; p.life++;
        var fade = Math.sin(Math.PI * p.life / p.max);
        ctx.fillStyle = 'rgba(' + p.c + ',' + (.55 * fade).toFixed(3) + ')';
        ctx.fillRect(p.x, p.y, p.r, p.r);
        if (p.life > p.max || p.x < -20 || p.x > w + 20 || p.y > h + 20) spawn(p, false);
      }
      // glow where the powder meets the water
      ctx.globalCompositeOperation = 'source-over';
      var gl = ctx.createRadialGradient(w * .5, h * .28, 0, w * .5, h * .28, Math.max(w, h) * .45);
      gl.addColorStop(0, 'rgba(255,190,70,.035)'); gl.addColorStop(1, 'rgba(255,190,70,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
    }
    return {frame: frame, warm: function(){ for (var i = 0; i < 260; i++) frame(i * 16); }};
  }

  window.HLTHXBG = {
    start: function(canvas, mode){
      var s = setup(canvas), scene = null, raf = 0, visible = true, t0 = performance.now();
      function build(m){
        s.onresize = null;
        scene = m === 'b' ? swirl(s) : silk(s);
        s.size();
        if (scene.warm) scene.warm();
        scene.frame(0);
      }
      function loop(now){ raf = 0; if (!visible || document.hidden || reduce) return; scene.frame(now - t0); raf = requestAnimationFrame(loop); }
      function kick(){ if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop); }
      build(mode);
      var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ s.size(); if (reduce) scene.frame(0); }, 150); });
      document.addEventListener('visibilitychange', kick);
      if ('IntersectionObserver' in window) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; kick(); }).observe(canvas);
      kick();
      return { set: function(m){ build(m); kick(); } };
    }
  };
})();
