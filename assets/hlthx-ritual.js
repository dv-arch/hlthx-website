/* The daily ritual, drawn in code: an HLTHX stick sachet tears open, the powder pours into a glass of water,
   clouds through it and the drink turns golden. Soft studio light, no glow effects, so it reads as real.
   Each [data-ritual] element holds a canvas; elements with [data-step="open|pour|mix|enjoy"] inside the same
   section get .is-on while that step plays. Pauses off screen; a still of the finished drink for reduced motion. */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LOOP = 11.5;
  // design space 400 x 500; everything below is in these units
  var G = {cx: 222, yt: 232, yb: 446, top: 62, bot: 51, ry: 9, base: 17, level: 292};
  var SACHET = {len: 152, w: 34, strip: 15};

  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function ease(t){ t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function mix(c1, c2, t){ return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t), lerp(c1[3], c2[3], t)]; }
  function rgba(c){ return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + c[3].toFixed(3) + ')'; }
  function halfW(y){ return lerp(G.top, G.bot, (y - G.yt) / (G.yb - G.yt)); }

  // sachet pose over time: [x, y, angle]
  function pose(t){
    var p0 = [-120, 150, 0], p1 = [150, 158, -0.04], p2 = [178, 92, 1.12], p3 = [96, -130, 0.5];
    if (t < 1.3) { var k = ease(t / 1.3); return [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k)]; }
    if (t < 2.2) return p1;
    if (t < 3.1) { var k2 = ease((t - 2.2) / .9); return [lerp(p1[0], p2[0], k2), lerp(p1[1], p2[1], k2), lerp(p1[2], p2[2], k2)]; }
    if (t < 5.6) { var s = Math.sin((t - 3.1) * 9) * .025 * (t < 5.3 ? 1 : 0); return [p2[0], p2[1] + Math.sin((t - 3.1) * 9) * 1.2, p2[2] + s]; }
    var k3 = ease((t - 5.6) / 1.1); return [lerp(p2[0], p3[0], k3), lerp(p2[1], p3[1], k3), lerp(p2[2], p3[2], k3)];
  }
  function stepAt(t){ return t < 2.2 ? 'open' : t < 5.6 ? 'pour' : t < 8.8 ? 'mix' : 'enjoy'; }

  function Scene(canvas, onStep){
    var ctx = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 1, H = 1, sc = 1, ox = 0, oy = 0;
    var P = [], plumes = [], ripples = [], bubbles = [], strip = null, d = 0, film = 0, poured = 0, lastStep = '';
    var fog = document.createElement('canvas'), fx = fog.getContext('2d'), FX = G.cx - 80, FY = G.level - 14, FW = 160, FH = G.yb - G.level + 14, fk = 1;

    function size(){
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      sc = Math.min(W / 400, H / 500); ox = (W - 400 * sc) / 2; oy = (H - 500 * sc) / 2;
      fk = sc * dpr; fog.width = Math.ceil(FW * fk); fog.height = Math.ceil(FH * fk);
    }
    function reset(){ P = []; plumes = []; ripples = []; bubbles = []; strip = null; d = 0; film = 0; poured = 0; }

    function background(){
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#F7F3EB'); g.addColorStop(.62, '#F0E9DC'); g.addColorStop(.63, '#E9E0CF'); g.addColorStop(1, '#E2D7C2');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var l = ctx.createRadialGradient(W * .22, H * .12, 0, W * .22, H * .12, Math.max(W, H) * .8);
      l.addColorStop(0, 'rgba(255,253,247,.75)'); l.addColorStop(1, 'rgba(255,253,247,0)');
      ctx.fillStyle = l; ctx.fillRect(0, 0, W, H);
      ctx.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
    }

    function glassPath(inset){
      var t = G.yt + inset * .2, b = G.yb - (inset ? G.base : 0);
      ctx.beginPath();
      ctx.moveTo(G.cx - G.top + inset, t);
      ctx.lineTo(G.cx - halfW(b) + inset, b);
      ctx.ellipse(G.cx, b, halfW(b) - inset, G.ry * .9, 0, Math.PI, 0, true);
      ctx.lineTo(G.cx + G.top - inset, t);
      ctx.closePath();
    }
    function liquidPath(){
      var b = G.yb - G.base, hl = halfW(G.level) - 3.5;
      ctx.beginPath();
      ctx.ellipse(G.cx, G.level, hl, G.ry * .85, 0, Math.PI, 0, false);
      ctx.lineTo(G.cx + halfW(b) - 3.5, b);
      ctx.ellipse(G.cx, b, halfW(b) - 3.5, G.ry * .8, 0, 0, Math.PI, false);
      ctx.closePath();
    }

    var WATER_T = [232, 240, 243, .16], WATER_B = [214, 226, 232, .26];
    var GOLD_T = [242, 188, 64, .88], GOLD_B = [206, 138, 22, .95];

    function drawGlassAndDrink(t){
      // table shadow, warmed by light through the drink
      var sh = ctx.createRadialGradient(G.cx + 14, G.yb + 4, 4, G.cx + 14, G.yb + 4, 110);
      sh.addColorStop(0, 'rgba(70,52,26,.22)'); sh.addColorStop(1, 'rgba(70,52,26,0)');
      ctx.save(); ctx.scale(1, .16); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(G.cx + 14, (G.yb + 4) / .16, 110, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (d > .02){
        var ca = ctx.createRadialGradient(G.cx + 38, G.yb + 8, 2, G.cx + 38, G.yb + 8, 80);
        ca.addColorStop(0, 'rgba(242,176,44,' + (.28 * d).toFixed(3) + ')'); ca.addColorStop(1, 'rgba(242,176,44,0)');
        ctx.save(); ctx.scale(1, .2); ctx.fillStyle = ca; ctx.beginPath(); ctx.arc(G.cx + 38, (G.yb + 8) / .2, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      // glass body
      glassPath(0);
      var gb = ctx.createLinearGradient(G.cx - G.top, 0, G.cx + G.top, 0);
      gb.addColorStop(0, 'rgba(255,255,255,.34)'); gb.addColorStop(.5, 'rgba(255,255,255,.08)'); gb.addColorStop(1, 'rgba(225,228,232,.28)');
      ctx.fillStyle = gb; ctx.fill();

      // drink
      ctx.save(); liquidPath(); ctx.clip();
      var top = mix(WATER_T, GOLD_T, d), bot = mix(WATER_B, GOLD_B, d);
      var lg = ctx.createLinearGradient(0, G.level, 0, G.yb - G.base);
      lg.addColorStop(0, rgba(top)); lg.addColorStop(1, rgba(bot));
      ctx.fillStyle = lg; ctx.fillRect(G.cx - 80, G.level - 12, 160, 200);
      // powder clouds: drawn at screen resolution on their own layer, then softened with one blur
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, fog.width, fog.height);
      fx.setTransform(fk, 0, 0, fk, -FX * fk, -FY * fk);
      for (var i = 0; i < plumes.length; i++){
        var p = plumes[i]; if (p.a <= .005) continue;
        var pg = fx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        pg.addColorStop(0, 'rgba(' + p.c + ',' + p.a.toFixed(3) + ')'); pg.addColorStop(1, 'rgba(' + p.c + ',0)');
        fx.fillStyle = pg; fx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      if (plumes.length){
        if ('filter' in ctx) ctx.filter = 'blur(' + Math.round(3 * fk) + 'px)';
        ctx.drawImage(fog, FX, FY, FW, FH);
        ctx.filter = 'none';
      }
      // edges of a cylinder of liquid look denser
      var eg = ctx.createLinearGradient(G.cx - G.top, 0, G.cx + G.top, 0);
      eg.addColorStop(0, 'rgba(120,70,0,' + (.10 + .16 * d).toFixed(3) + ')'); eg.addColorStop(.3, 'rgba(255,255,255,' + (.05 + .07 * d).toFixed(3) + ')');
      eg.addColorStop(.7, 'rgba(255,255,255,0)'); eg.addColorStop(1, 'rgba(120,70,0,' + (.14 + .2 * d).toFixed(3) + ')');
      ctx.fillStyle = eg; ctx.fillRect(G.cx - 80, G.level - 12, 160, 200);
      // bubbles
      for (var b = 0; b < bubbles.length; b++){
        var u = bubbles[b];
        ctx.beginPath(); ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,248,225,' + (.55 * u.a).toFixed(3) + ')'; ctx.lineWidth = .7; ctx.stroke();
        ctx.fillStyle = 'rgba(255,250,235,' + (.18 * u.a).toFixed(3) + ')'; ctx.fill();
      }
      ctx.restore();

      // surface, with the powder film while pouring and rings where it lands
      var hl = halfW(G.level) - 3.5;
      ctx.beginPath(); ctx.ellipse(G.cx, G.level, hl, G.ry * .85, 0, 0, Math.PI * 2);
      var sg = ctx.createLinearGradient(G.cx - hl, 0, G.cx + hl, 0);
      var st = mix([236, 240, 241, .55], [250, 208, 98, .92], d);
      sg.addColorStop(0, rgba(st)); sg.addColorStop(.5, 'rgba(255,255,255,' + (.6 - .25 * d).toFixed(3) + ')'); sg.addColorStop(1, rgba(st));
      ctx.fillStyle = sg; ctx.fill();
      if (film > .01){
        ctx.save(); ctx.clip();
        var fg = ctx.createRadialGradient(G.cx - 6, G.level, 0, G.cx - 6, G.level, hl);
        fg.addColorStop(0, 'rgba(232,170,48,' + (.75 * film).toFixed(3) + ')'); fg.addColorStop(1, 'rgba(232,170,48,0)');
        ctx.fillStyle = fg; ctx.fillRect(G.cx - hl, G.level - 10, hl * 2, 20);
        ctx.restore();
      }
      for (var r = 0; r < ripples.length; r++){
        var q = ripples[r];
        ctx.beginPath(); ctx.ellipse(q.x, G.level, q.r, q.r * .16, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,' + (q.a * .7).toFixed(3) + ')'; ctx.lineWidth = .8; ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(G.cx, G.level, hl, G.ry * .85, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .8; ctx.stroke();

      // thick glass base
      var by = G.yb - G.base * .5;
      var bg = ctx.createLinearGradient(0, G.yb - G.base, 0, G.yb + G.ry);
      bg.addColorStop(0, 'rgba(255,255,255,.55)'); bg.addColorStop(.5, d > .1 ? 'rgba(240,190,90,' + (.35 * d).toFixed(3) + ')' : 'rgba(215,222,226,.35)'); bg.addColorStop(1, 'rgba(255,255,255,.6)');
      ctx.beginPath(); ctx.ellipse(G.cx, by, halfW(by) - 1, G.ry * .9, 0, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();

      // reflections: a tall soft window highlight on the left, a thin one on the right
      ctx.save(); glassPath(0); ctx.clip();
      var hx = G.cx - G.top + 9;
      var h1 = ctx.createLinearGradient(hx, 0, hx + 11, 0);
      h1.addColorStop(0, 'rgba(255,255,255,0)'); h1.addColorStop(.4, 'rgba(255,255,255,.62)'); h1.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = h1; ctx.beginPath(); ctx.moveTo(hx, G.yt + 6); ctx.lineTo(hx + 11, G.yt + 6); ctx.lineTo(hx + 9 + 9, G.yb - 22); ctx.lineTo(hx + 9, G.yb - 22); ctx.fill();
      var rx = G.cx + G.top - 14;
      var h2 = ctx.createLinearGradient(rx, 0, rx + 5, 0);
      h2.addColorStop(0, 'rgba(255,255,255,0)'); h2.addColorStop(.5, 'rgba(255,255,255,.5)'); h2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = h2; ctx.beginPath(); ctx.moveTo(rx, G.yt + 14); ctx.lineTo(rx + 5, G.yt + 14); ctx.lineTo(rx + 2, G.yb - 30); ctx.lineTo(rx - 3, G.yb - 30); ctx.fill();
      ctx.restore();

      // outline and rim
      glassPath(0); ctx.strokeStyle = 'rgba(140,140,148,.38)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(G.cx, G.yt, G.top, G.ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150,150,158,.45)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(G.cx, G.yt + .8, G.top - 2.5, G.ry - 1.2, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1.6; ctx.stroke();
    }

    function sachetShape(len, w, tornRight){
      var x0 = -len / 2, x1 = len / 2, r = 3;
      ctx.beginPath();
      ctx.moveTo(x0 + r, -w / 2);
      if (tornRight){
        ctx.lineTo(x1, -w / 2);
        var n = 7; for (var i = 1; i <= n; i++) ctx.lineTo(x1 + (i % 2 ? 2.4 : -1.2), -w / 2 + w * i / n);
      } else { ctx.lineTo(x1 - r, -w / 2); ctx.quadraticCurveTo(x1, -w / 2, x1, -w / 2 + r); ctx.lineTo(x1, w / 2 - r); ctx.quadraticCurveTo(x1, w / 2, x1 - r, w / 2); }
      ctx.lineTo(x0 + r, w / 2); ctx.quadraticCurveTo(x0, w / 2, x0, w / 2 - r); ctx.lineTo(x0, -w / 2 + r); ctx.quadraticCurveTo(x0, -w / 2, x0 + r, -w / 2);
      ctx.closePath();
    }
    function foil(len, w){
      var g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
      g.addColorStop(0, '#F4F4F6'); g.addColorStop(.18, '#FFFFFF'); g.addColorStop(.5, '#E6E6EA'); g.addColorStop(.82, '#F7F7F9'); g.addColorStop(1, '#CFCFD5');
      return g;
    }
    function drawSachet(t){
      if (t > 7) return;
      var ps = pose(t), torn = t >= 1.55, len = torn ? SACHET.len - SACHET.strip : SACHET.len, w = SACHET.w;
      ctx.save(); ctx.translate(ps[0], ps[1]); ctx.rotate(ps[2]);
      if (torn) ctx.translate(-SACHET.strip / 2, 0);
      ctx.shadowColor = 'rgba(60,45,20,.22)'; ctx.shadowBlur = 14 * sc; ctx.shadowOffsetY = 8 * sc;
      sachetShape(len, w, torn); ctx.fillStyle = foil(len, w); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(150,150,158,.5)'; ctx.lineWidth = .6; ctx.stroke();
      // crimped seal at the closed end
      ctx.save(); sachetShape(len, w, torn); ctx.clip();
      for (var i = 0; i < 12; i++){ ctx.fillStyle = i % 2 ? 'rgba(180,180,188,.35)' : 'rgba(255,255,255,.5)'; ctx.fillRect(-len / 2 + 1 + i * 1.1, -w / 2, 1.1, w); }
      if (!torn) for (var j = 0; j < 12; j++){ ctx.fillStyle = j % 2 ? 'rgba(180,180,188,.35)' : 'rgba(255,255,255,.5)'; ctx.fillRect(len / 2 - 14 + j * 1.1, -w / 2, 1.1, w); }
      // print: wordmark, red rule, small line
      ctx.fillStyle = '#141414'; ctx.font = '600 13px Montserrat, Arial, sans-serif'; ctx.textBaseline = 'middle';
      var tx = -len / 2 + 24;
      ctx.save(); ctx.translate(tx, -3);
      var letters = ['H', 'L', 'T', 'H'], x = 0;
      for (var k = 0; k < 4; k++){ ctx.fillText(letters[k], x, 0); x += ctx.measureText(letters[k]).width + 3.2; }
      ctx.fillStyle = '#D3202B'; ctx.font = '700 13px Montserrat, Arial, sans-serif'; ctx.fillText('X', x, 0);
      ctx.restore();
      ctx.fillStyle = '#D3202B'; ctx.fillRect(tx, 7, 20, 2);
      ctx.fillStyle = '#5A5A62'; ctx.font = '500 5px Montserrat, Arial, sans-serif'; ctx.fillText('DAILY COMPLETE NUTRITION \u00b7 15 g', tx + 26, 8);
      // satin sheen running along the foil
      var sg = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.55, 'rgba(255,255,255,.45)'); sg.addColorStop(.62, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(-len / 2, -w / 2, len, w);
      ctx.restore();
      ctx.restore();
    }
    function drawStrip(){
      if (!strip) return;
      ctx.save(); ctx.translate(strip.x, strip.y); ctx.rotate(strip.a);
      ctx.beginPath(); ctx.moveTo(-SACHET.strip / 2, -SACHET.w / 2);
      for (var i = 1; i <= 7; i++) ctx.lineTo(-SACHET.strip / 2 + (i % 2 ? 2.4 : -1.2), -SACHET.w / 2 + SACHET.w * i / 7);
      ctx.lineTo(SACHET.strip / 2, SACHET.w / 2); ctx.lineTo(SACHET.strip / 2, -SACHET.w / 2); ctx.closePath();
      ctx.fillStyle = foil(SACHET.strip, SACHET.w); ctx.fill(); ctx.strokeStyle = 'rgba(150,150,158,.5)'; ctx.lineWidth = .6; ctx.stroke();
      ctx.restore();
    }
    function drawPowder(t){
      // the falling column: a soft ribbon from the sachet to the water, thinning as it falls
      if (t > 3.2 && t < 5.45){
        var tp = tipOf(pose(t)), k = clamp((t - 3.2) / .25, 0, 1) * clamp((5.45 - t) / .2, 0, 1);
        var g = ctx.createLinearGradient(0, tp[1], 0, G.level);
        g.addColorStop(0, 'rgba(240,184,62,' + (.85 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(228,164,44,' + (.55 * k).toFixed(3) + ')');
        ctx.fillStyle = g; ctx.beginPath();
        var wob = Math.sin(t * 23) * .8;
        ctx.moveTo(tp[0] - 3.2, tp[1]); ctx.quadraticCurveTo(tp[0] + 2 + wob, (tp[1] + G.level) / 2, tp[0] + 4.2 + wob, G.level);
        ctx.lineTo(tp[0] + 6.4 + wob, G.level); ctx.quadraticCurveTo(tp[0] + 4.6 + wob, (tp[1] + G.level) / 2, tp[0] + 3.2, tp[1]);
        ctx.closePath(); ctx.fill();
      }
      for (var i = 0; i < P.length; i++){
        var p = P[i];
        ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * .8).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .5, 0, Math.PI * 2); ctx.fill();
      }
    }

    var POWDER = ['244,196,78', '236,176,52', '226,160,40', '250,214,120', '214,146,30'];
    function tipOf(ps){ return [ps[0] + Math.cos(ps[2]) * (SACHET.len / 2 - SACHET.strip), ps[1] + Math.sin(ps[2]) * (SACHET.len / 2 - SACHET.strip)]; }

    function update(t, dt){
      // tear: the strip lifts away and falls out of frame
      if (t >= 1.55 && !strip && t < 3){
        var ps = pose(t);
        strip = {x: ps[0] + Math.cos(ps[2]) * (SACHET.len / 2 - SACHET.strip / 2), y: ps[1], vx: 70, vy: -95, a: 0, va: 3.2};
        for (var z = 0; z < 10; z++) P.push({x: strip.x - 6, y: strip.y + (Math.random() - .5) * 20, vx: (Math.random() - .3) * 40, vy: -Math.random() * 30, r: .9 + Math.random() * .9, a: .8, c: POWDER[(Math.random() * 5) | 0]});
      }
      if (strip){ strip.vy += 520 * dt; strip.x += strip.vx * dt; strip.y += strip.vy * dt; strip.a += strip.va * dt; if (strip.y > 620) strip = null; }

      // pour
      if (t > 3.15 && t < 5.35){
        var tp = tipOf(pose(t)), dir = pose(t)[2], rate = t < 3.4 ? 160 : 420;
        var n = Math.round(rate * dt + Math.random());
        for (var i = 0; i < n; i++){
          P.push({x: tp[0] + (Math.random() - .5) * 8, y: tp[1] + (Math.random() - .5) * 3,
            vx: Math.cos(dir) * 8 + (Math.random() - .5) * 10, vy: Math.sin(dir) * 20 + Math.random() * 16,
            r: .5 + Math.random() * .9, a: .75 + Math.random() * .25, c: POWDER[(Math.random() * 5) | 0]});
        }
      }
      for (var j = P.length - 1; j >= 0; j--){
        var p = P[j];
        p.vy += 640 * dt; p.vx *= .995; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y >= G.level - 1 && Math.abs(p.x - G.cx) < halfW(G.level) - 4){
          poured++;
          film = Math.min(1, film + .006);
          if (Math.random() < .22) plumes.push({x: p.x + (Math.random() - .5) * 10, y: G.level + 3 + Math.random() * 6, r: 5 + Math.random() * 8, a: .32 + Math.random() * .2, vx: (Math.random() - .5) * 12, vy: 26 + Math.random() * 28, ph: Math.random() * 6, c: POWDER[(Math.random() * 5) | 0]});
          if (Math.random() < .05 && ripples.length < 8) ripples.push({x: p.x, r: 2, a: .9});
          P.splice(j, 1);
        } else if (p.y > 520) P.splice(j, 1);
      }

      // clouds sink, spread and swirl, then dissolve as the drink turns golden
      var swirl = t > 5.4 ? Math.min(1, (t - 5.4) / 1.2) : .25;
      for (var k = plumes.length - 1; k >= 0; k--){
        var c = plumes[k];
        c.r += (34 - c.r * .35) * dt;
        c.vy *= .985; c.y += c.vy * dt;
        var off = c.x - G.cx;
        c.x += (c.vx + Math.sin(t * 1.6 + c.ph) * 16 * swirl - off * .25 * swirl) * dt;
        if (c.y > G.yb - G.base - 8){ c.y = G.yb - G.base - 8; c.vy = -c.vy * .3; }
        c.a *= t > 5.6 ? .975 : .997;
        if (c.a < .01) plumes.splice(k, 1);
      }
      if (plumes.length > 140) plumes.splice(0, plumes.length - 140);
      var target = clamp(poured / 520, 0, .55) + (t > 5.4 ? ease((t - 5.4) / 3.2) * .45 : 0);
      d += (target - d) * Math.min(1, dt * 2.2);
      film *= t > 5.2 ? .97 : .995;
      for (var r = ripples.length - 1; r >= 0; r--){ var q = ripples[r]; q.r += 34 * dt; q.a -= 1.4 * dt; if (q.a <= 0 || q.r > halfW(G.level) - 6) ripples.splice(r, 1); }

      // fine bubbles once it is mixed
      if (t > 6.2 && t < 10.6 && Math.random() < dt * 10 && bubbles.length < 26){
        var bx = G.cx + (Math.random() - .5) * (halfW(G.yb) * 1.6);
        bubbles.push({x: bx, y: G.yb - G.base - 6, r: .8 + Math.random() * 1.6, vy: 14 + Math.random() * 18, a: 1});
      }
      for (var b = bubbles.length - 1; b >= 0; b--){ var u = bubbles[b]; u.y -= u.vy * dt; u.x += Math.sin(u.y * .12) * .15; if (u.y < G.level + 3) bubbles.splice(b, 1); }
    }

    function draw(t){
      background();
      drawGlassAndDrink(t);
      drawPowder(t);
      drawStrip();
      drawSachet(t);
      // soft fade between loops
      var f = t < .5 ? 1 - t / .5 : t > LOOP - .7 ? (t - (LOOP - .7)) / .7 : 0;
      if (f > 0){ ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = 'rgba(244,239,229,' + clamp(f, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
      var s = stepAt(t); if (s !== lastStep){ lastStep = s; if (onStep) onStep(s); }
    }

    function still(){ reset(); d = 1; bubbles = []; for (var i = 0; i < 14; i++) bubbles.push({x: G.cx + (Math.random() - .5) * 80, y: G.level + 20 + Math.random() * 100, r: .8 + Math.random() * 1.4, vy: 0, a: 1}); draw(9.5); if (onStep) onStep('enjoy'); }

    size();
    var raf = 0, visible = true, last = 0, t = 0;
    function frame(now){
      raf = 0; if (!visible || document.hidden) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      t += dt; if (t >= LOOP){ t = 0; reset(); }
      update(t, dt); draw(t);
      raf = requestAnimationFrame(frame);
    }
    function kick(){ if (!raf && visible && !document.hidden && !reduce){ last = 0; raf = requestAnimationFrame(frame); } }
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ size(); if (reduce) still(); }, 150); });
    document.addEventListener('visibilitychange', kick);
    if ('IntersectionObserver' in window) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; kick(); }, {threshold: .15}).observe(canvas);
    if (reduce) still(); else kick();
  }

  document.querySelectorAll('[data-ritual]').forEach(function(box){
    var canvas = box.querySelector('canvas');
    var scope = box.closest('section') || document;
    var steps = scope.querySelectorAll('[data-step]');
    if (canvas) Scene(canvas, function(s){ steps.forEach(function(el){ el.classList.toggle('is-on', el.getAttribute('data-step') === s); }); });
  });
})();
