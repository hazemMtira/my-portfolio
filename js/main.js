/* Page behaviour: footer year and gentle scroll reveal. */
(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const items = document.querySelectorAll('.reveal');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || calm) {
    items.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  items.forEach(el => io.observe(el));
})();
