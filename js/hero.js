/* Hero background: a rotating wireframe solid, a ring and a star field on a plain 2D canvas.
   No libraries and no WebGL needed, so it works on any browser. The page still works without it. */
(() => {
  const canvas = document.getElementById('scene');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx) return;
  const hero = canvas.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED = '255,0,51', DARK = '139,0,0';

  /* Icosahedron, subdivided once: 42 points, 120 edges, radius 1 */
  const g = (1 + Math.sqrt(5)) / 2;
  const unit = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const V = [[-1,g,0],[1,g,0],[-1,-g,0],[1,-g,0],[0,-1,g],[0,1,g],[0,-1,-g],[0,1,-g],[g,0,-1],[g,0,1],[-g,0,-1],[-g,0,1]].map(unit);
  const F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
             [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const cache = {}, edgeSet = new Set();
  const mid = (a, b) => {
    const k = a < b ? a + '_' + b : b + '_' + a;
    if (!(k in cache)) { cache[k] = V.length; V.push(unit([(V[a][0]+V[b][0])/2, (V[a][1]+V[b][1])/2, (V[a][2]+V[b][2])/2])); }
    return cache[k];
  };
  const addEdge = (p, q) => edgeSet.add(p < q ? p + '_' + q : q + '_' + p);
  F.forEach(([a, b, c]) => {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]].forEach(([x, y, z]) => { addEdge(x, y); addEdge(y, z); addEdge(z, x); });
  });
  const E = [...edgeSet].map(k => k.split('_').map(Number));

  /* Star field */
  const stars = Array.from({ length: 900 }, () => ({
    x: (Math.random() - 0.5) * 22, y: (Math.random() - 0.5) * 14, z: (Math.random() - 0.5) * 10 - 2, big: Math.random() < 0.3
  }));

  let W = 0, H = 0, f = 1, t = 0, last = 0, visible = true;
  let mx = 0, my = 0, cx = 0, cy = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    f = H / 2 / Math.tan(Math.PI / 6);          // same framing as a 60 degree camera at distance 5
    if (reduce) draw();
  }

  const spin = (p, rx, ry) => {                  // rotate around Y, then X
    let [x, y, z] = p, c = Math.cos(ry), s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rx); s = Math.sin(rx);
    return [x, y * c - z * s, y * s + z * c];
  };
  const proj = (x, y, z) => { const d = 5 - z; return [W / 2 + (x - cx * 0.5) * f / d, H / 2 - (y + cy * 0.3) * f / d]; };

  function wire(radius, rx, ry, ox, oy, color, alpha) {
    const P = V.map(v => { const r = spin([v[0] * radius, v[1] * radius, v[2] * radius], rx, ry); return proj(r[0] + ox, r[1] + oy, r[2]); });
    ctx.strokeStyle = 'rgba(' + color + ',' + alpha + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    E.forEach(([a, b]) => { ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); });
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const ox = W > 900 ? 3 : 0;                  // solid sits to the right of the text on wide screens
    stars.forEach(s => {
      const d = 5 - s.z, p = proj(s.x, s.y, s.z), size = Math.max(1, (s.big ? 0.045 : 0.03) * f / d);
      ctx.fillStyle = s.big ? 'rgba(' + DARK + ',.5)' : 'rgba(' + RED + ',.45)';
      ctx.fillRect(p[0], p[1], size, size);
    });
    wire(1.5, t * 0.45 + cy * 0.4, t * 0.65 + cx * 0.6, ox, 0, RED, 0.34);
    wire(2.3, -t * 0.2, -t * 0.3, ox, 0, DARK, 0.2);
    ctx.strokeStyle = 'rgba(' + RED + ',.35)';    // flat ring that bobs gently
    ctx.beginPath();
    const bob = Math.sin(t * 0.7) * 0.22;
    for (let i = 0; i <= 100; i++) {
      const a = i / 100 * Math.PI * 2, p = proj(Math.cos(a) * 1.9 + ox, bob, Math.sin(a) * 1.9);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05); last = now;
    if (visible) {
      t += dt * 0.42;
      cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
      draw();
    }
    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero); else addEventListener('resize', resize);
  resize();
  if (reduce) draw(); else requestAnimationFrame(frame);
})();
