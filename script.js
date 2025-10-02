// ========== Config ==========
const BREAKPOINT = 1024; // hamburger mode threshold (px)
const INITIAL_VISIBLE = 6; // how many project cards visible before "View more"
const categories = ['all','web','uiux'];

// ========== Elements ==========
const header = document.querySelector('.site-header');
const nav = document.getElementById('siteNav');
const navToggle = document.getElementById('navToggle');
const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
const printBtn = document.getElementById('printBtn');
const progressBar = document.getElementById('progressBar');

const sections = Array.from(document.querySelectorAll('main section[id]'));
const revealBlocks = Array.from(document.querySelectorAll('.reveal'));
const revealItems = Array.from(document.querySelectorAll('.reveal-item'));

// Projects
const grid = document.getElementById('projectsGrid');
const cards = Array.from(grid.querySelectorAll('.project-card'));
const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
const countBadges = {
  all: document.querySelector('[data-count="all"]'),
  web: document.querySelector('[data-count="web"]'),
  uiux: document.querySelector('[data-count="uiux"]')
};
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn  = document.getElementById('loadMoreBtn');

let activeFilter = 'all';
let expanded = false;

// Contact form
const contactForm = document.getElementById('contactForm');
const formAlert = document.getElementById('formAlert');

// ========== Helpers ==========
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function isDesktop(){ return window.innerWidth > BREAKPOINT; }

function hasCategory(card, filter){
  if(filter === 'all') return true;
  const cats = (card.dataset.category || '').toLowerCase().split(/\s+/);
  return cats.includes(filter);
}
function getMatching(filter){ return cards.filter(c => hasCategory(c, filter)); }
function readHash(){
  const h = (location.hash || '').replace('#','').toLowerCase();
  return categories.includes(h) ? h : 'all';
}

function closeNav(){
  nav.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
}

// ========== Navigation ==========
navToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

links.forEach(a => {
  a.addEventListener('click', () => {
    closeNav(); // Close mobile nav on link tap
  });
});

// Ensure nav closes when resizing to desktop
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if(isDesktop()){
      closeNav();
    }
  }, 120);
});

// Update active link based on scroll
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const id = entry.target.getAttribute('id');
    const link = nav.querySelector(`a[href="#${id}"]`);
    if(link && entry.isIntersecting){
      links.forEach(l => l.removeAttribute('aria-current'));
      link.setAttribute('aria-current','page');
    }
  });
}, { rootMargin: '-50% 0px -45% 0px', threshold: 0.01 });
sections.forEach(sec => sectionObserver.observe(sec));

// Scroll progress bar
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = clamp((scrollTop / max) * 100, 0, 100);
  progressBar.style.width = pct + '%';
}, { passive:true });

// ========== Reveal animations ==========
if(!prefersReduced){
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  revealBlocks.forEach(el => revealObserver.observe(el));
  revealItems.forEach(el => revealObserver.observe(el));
} else {
  revealBlocks.forEach(el => el.classList.add('in-view'));
  revealItems.forEach(el => el.classList.add('in-view'));
}

// Parallax orbs in hero (subtle)
const hero = document.querySelector('.hero');
if(hero && !prefersReduced){
  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const orbs = hero.querySelectorAll('.orb');
    orbs.forEach((orb, i) => {
      const intensity = (i+1) * 6;
      orb.style.transform = `translate(${x*intensity}px, ${y*intensity}px)`;
    });
  });
}

// ========== Projects: counts, filter, view more ==========
function updateCounts(){
  const totalAll = cards.length;
  const totalWeb = cards.filter(c => hasCategory(c, 'web')).length;
  const totalUx  = cards.filter(c => hasCategory(c, 'uiux')).length;
  countBadges.all.textContent = `(${totalAll})`;
  countBadges.web.textContent = `(${totalWeb})`;
  countBadges.uiux.textContent = `(${totalUx})`;
}

function applyFilter(filter, {resetExpanded = true} = {}){
  activeFilter = filter;
  if(resetExpanded) expanded = false;

  // Tab state + hash
  filterBtns.forEach(btn => {
    const pressed = btn.dataset.filter === filter;
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  });
  const newHash = `#${filter}`;
  if(location.hash !== newHash){
    history.replaceState(null, '', newHash);
  }

  // Visibility
  const matching = getMatching(filter);
  const showCount = expanded ? matching.length : INITIAL_VISIBLE;

  cards.forEach(c => c.classList.add('hidden'));
  matching.slice(0, showCount).forEach(c => c.classList.remove('hidden'));

  // Load more visibility + label
  if(matching.length > INITIAL_VISIBLE){
    loadMoreWrap.classList.remove('hidden');
    loadMoreBtn.textContent = expanded ? 'Show less' : 'View more projects';
    loadMoreBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  } else {
    loadMoreWrap.classList.add('hidden');
  }

  // Animate visible cards in category change
  if(!prefersReduced){
    requestAnimationFrame(() => {
      matching.slice(0, showCount).forEach((c, i) => {
        c.classList.remove('in-view'); // reset
        c.style.transitionDelay = `${Math.min(i, 8) * 50}ms`;
        requestAnimationFrame(() => c.classList.add('in-view'));
      });
    });
  }
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    applyFilter(btn.dataset.filter, {resetExpanded: true});
    document.getElementById('projects').scrollIntoView({behavior: prefersReduced ? 'auto' : 'smooth', block:'start'});
  });
});
loadMoreBtn.addEventListener('click', () => {
  expanded = !expanded;
  applyFilter(activeFilter, {resetExpanded:false});
});
window.addEventListener('hashchange', () => {
  const h = readHash();
  if(categories.includes(h)) applyFilter(h, {resetExpanded:true});
});

// ========== Footer year + print ==========
document.getElementById('year').textContent = new Date().getFullYear();
printBtn?.addEventListener('click', () => window.print());

// ========== Contact form: redirect and success message ==========
if(contactForm){
  // Make FormSubmit redirect back here with a success query param
  const next = contactForm.querySelector('input[name="_next"]');
  if(next){
    const base = window.location.origin + window.location.pathname;
    next.value = `${base}?submitted=true#contact`;
  }

  // If returned from a successful submit, show a message
  const params = new URLSearchParams(window.location.search);
  if(params.get('submitted') === 'true'){
    formAlert?.classList.remove('hidden');
    formAlert.textContent = 'Thanks! Your message has been sent successfully.';
    // Optional: remove the query param without reloading
    history.replaceState(null, '', window.location.pathname + '#contact');
  }
}

// ========== Init ==========
updateCounts();
applyFilter(readHash());