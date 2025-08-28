// Respect reduced motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Elements
const root = document.documentElement;
const navWrap = document.getElementById('navWrap');
const progress = document.getElementById('progress');
const themeBtns = [document.getElementById('toggleTheme'), document.getElementById('toggleThemeMobile')];
const animBtns  = [document.getElementById('toggleAnim'), document.getElementById('toggleAnimMobile')];
const links = [...document.querySelectorAll('.menu a[href^="#"]')];
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

// 1) Year
document.getElementById('year').textContent = new Date().getFullYear();

// 2) Theme toggle (saved)
const THEME_KEY = 'fp-theme';
function applyTheme(theme){
  if(theme === 'dark'){ root.classList.add('dark'); setPressed(themeBtns, true); }
  else { root.classList.remove('dark'); setPressed(themeBtns, false); }
  localStorage.setItem(THEME_KEY, theme);
}
function setPressed(btns, pressed){ btns.forEach(b => { if(!b) return; b.setAttribute('aria-pressed', String(pressed)); }); }
const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(saved);
themeBtns.forEach(btn => btn && btn.addEventListener('click', () => {
  applyTheme(root.classList.contains('dark') ? 'light' : 'dark');
}));

// 3) Toggle animated gradient
const ANIM_KEY = 'fp-anim';
function setAnim(on){
  if(prefersReduced) on = false; // honor reduced motion
  navWrap.classList.toggle('animate', on);
  setPressed(animBtns, on);
  localStorage.setItem(ANIM_KEY, on ? 'on' : 'off');
}
const savedAnim = localStorage.getItem(ANIM_KEY);
setAnim(savedAnim ? savedAnim === 'on' : true);
animBtns.forEach(btn => btn && btn.addEventListener('click', () => setAnim(!navWrap.classList.contains('animate'))));

// 4) Scroll progress bar
function updateProgress(){
  const h = document.documentElement;
  const scrollTop = h.scrollTop || document.body.scrollTop;
  const docHeight = h.scrollHeight - h.clientHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progress.style.width = pct + '%';
}
document.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// 5) Scroll-spy (highlights current link)
const spy = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const id = '#' + entry.target.id;
    const link = links.find(a => a.getAttribute('href') === id);
    if (link) link.toggleAttribute('aria-current', entry.isIntersecting);
  });
}, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
sections.forEach(s => s && spy.observe(s));

// 6) Reveal-on-scroll cards
const reveal = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('reveal'); obs.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.card').forEach(el => reveal.observe(el));

// 7) Hide/show header on scroll direction
let lastY = window.scrollY;
function handleHeader(){
  const y = window.scrollY;
  const goingDown = y > lastY && y > 10;
  navWrap.classList.toggle('nav-hide', goingDown);
  navWrap.classList.toggle('nav-show', !goingDown);
  lastY = y;
}
document.addEventListener('scroll', handleHeader, { passive: true });

// 8) Keyboard navigation among menu items (←/→)
const menuLinks = [...document.querySelectorAll('.menu a[role="menuitem"]')];
menuLinks.forEach((a, idx) => {
  a.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = menuLinks[(idx + dir + menuLinks.length) % menuLinks.length];
      next.focus();
    }
  });
});

// 9) Smooth scroll enhancement for internal links (with offset)
function smoothScrollTo(id){
  const el = document.querySelector(id);
  if(!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 66; // offset for sticky nav
  window.scrollTo({ top, behavior: 'smooth' });
}
links.forEach(a => a.addEventListener('click', (e) => {
  const href = a.getAttribute('href');