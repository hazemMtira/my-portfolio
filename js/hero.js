/* 3D hero scene (Three.js r128, self-hosted in js/vendor). The page works without it. */
(() => {
  const canvas = document.getElementById('scene');
  if (!canvas || typeof THREE === 'undefined') return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { return; }                         // no WebGL: keep the plain background
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  cam.position.z = 5;

  const wire = (radius, color, opacity) => {
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity })
    );
    scene.add(mesh);
    return mesh;
  };
  const inner = wire(1.5, 0xFF0033, 0.22);
  const outer = wire(2.3, 0x8B0000, 0.10);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.012, 8, 100),
    new THREE.MeshBasicMaterial({ color: 0xFF0033, transparent: true, opacity: 0.3 })
  );
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  const stars = (count, size, color, opacity) => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 22;
      p[i * 3 + 1] = (Math.random() - 0.5) * 14;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity })));
  };
  stars(700, 0.03, 0xFF0033, 0.4);
  stars(300, 0.045, 0x8B0000, 0.3);

  const hero = canvas.parentElement;
  let mx = 0, my = 0, t = 0, visible = true;

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    const x = w > 900 ? 3 : 0;                  // solid sits right of the text on wide screens
    [inner, outer, ring].forEach(o => { o.position.x = x; });
    if (reduce) frame();
  }

  function frame() {
    if (visible) {
      t += 0.007;
      inner.rotation.set(t * 0.45 + my * 0.2, t * 0.65 + mx * 0.3, 0);
      outer.rotation.set(-t * 0.2, -t * 0.3, 0);
      ring.rotation.z = t * 0.12;
      ring.position.y = Math.sin(t * 0.7) * 0.22;
      cam.position.set(mx * 0.5, -my * 0.3, 5);
      renderer.render(scene, cam);
    }
    if (!reduce) requestAnimationFrame(frame);
  }

  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  resize();
  frame();
})();
