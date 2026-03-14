// ===== TRAVELBEEZ SCRIPT.JS =====

// ─── Lucide Icons Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  initNavbar();
  initMobileMenu();
  initFormTabs();
  initPackagesSlider();
  initTestimonialsSlider();
  initCounterAnimation();
  initScrollAnimations();
  initForms();
  initSmoothScroll();
  initModal();
  updateSliderDots(0);
});

// ─── Navbar Scroll Effect ────────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link highlighting
    const sections = ['home','visas','packages','services','about','contact'];
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 100) current = id;
    });
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
  });
}

// ─── Mobile Hamburger Menu ───────────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
    });
  });
}

// ─── Hero Form Tabs ──────────────────────────────────────────────────────────
function initFormTabs() {
  const tabs = document.querySelectorAll('.form-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ─── Packages Slider ─────────────────────────────────────────────────────────
let pkgCurrent = 0;
const pkgTotal = 4;

function initPackagesSlider() {
  const slider = document.getElementById('packages-slider');
  const nextBtn = document.getElementById('next-btn');
  const prevBtn = document.getElementById('prev-btn');
  const dots = document.querySelectorAll('.dot');

  if (!slider) return;

  nextBtn.addEventListener('click', () => {
    pkgCurrent = (pkgCurrent + 1) % pkgTotal;
    updateSlider();
  });

  prevBtn.addEventListener('click', () => {
    pkgCurrent = (pkgCurrent - 1 + pkgTotal) % pkgTotal;
    updateSlider();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      pkgCurrent = i;
      updateSlider();
    });
  });

  // Touch support
  let touchStartX = 0;
  slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      pkgCurrent = diff > 0
        ? (pkgCurrent + 1) % pkgTotal
        : (pkgCurrent - 1 + pkgTotal) % pkgTotal;
      updateSlider();
    }
  });

  // Auto-advance
  setInterval(() => {
    pkgCurrent = (pkgCurrent + 1) % pkgTotal;
    updateSlider();
  }, 5500);
}

function updateSlider() {
  const slider = document.getElementById('packages-slider');
  if (!slider) return;
  slider.style.transform = `translateX(-${pkgCurrent * 100}%)`;
  updateSliderDots(pkgCurrent);
}

function updateSliderDots(idx) {
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
}

// ─── Testimonials Slider ──────────────────────────────────────────────────────
let tCurrent = 0;

function initTestimonialsSlider() {
  const track = document.getElementById('testimonials-track');
  const tPrev = document.getElementById('t-prev');
  const tNext = document.getElementById('t-next');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  const visibleCount = window.innerWidth <= 768 ? 1 : 2;

  const maxSlide = Math.max(0, total - visibleCount);

  function slideTestimonials() {
    const cardWidth = cards[0].offsetWidth + 24;
    track.style.transform = `translateX(-${tCurrent * cardWidth}px)`;
  }

  tNext.addEventListener('click', () => {
    const max = Math.max(0, total - (window.innerWidth <= 768 ? 1 : 2));
    tCurrent = Math.min(tCurrent + 1, max);
    slideTestimonials();
  });

  tPrev.addEventListener('click', () => {
    tCurrent = Math.max(tCurrent - 1, 0);
    slideTestimonials();
  });

  window.addEventListener('resize', () => { tCurrent = 0; slideTestimonials(); });

  // Auto-advance
  setInterval(() => {
    const max = Math.max(0, total - (window.innerWidth <= 768 ? 1 : 2));
    tCurrent = tCurrent >= max ? 0 : tCurrent + 1;
    slideTestimonials();
  }, 4800);
}

// ─── Counter Animation ────────────────────────────────────────────────────────
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-num');
  let started = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 1800;
        const step = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          counter.textContent = Math.floor(current).toLocaleString();
          if (current >= target) clearInterval(timer);
        }, 16);
      });
    }
  }, { threshold: 0.3 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
}

// ─── Scroll Fade-Up Animations ────────────────────────────────────────────────
function initScrollAnimations() {
  const animatables = [
    '.visa-card','.service-card','.expert-card','.package-card',
    '.testimonial-card','.dest-card','.contact-form-card'
  ];

  const elements = document.querySelectorAll(animatables.join(','));
  elements.forEach(el => el.classList.add('fade-up'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ─── Smooth Scroll ────────────────────────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ─── Forms & Modal ────────────────────────────────────────────────────────────
function initForms() {
  const heroForm = document.getElementById('hero-form');
  const contactForm = document.getElementById('contact-form');

  if (heroForm) {
    heroForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = document.getElementById('search-btn');
      btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> Sending...`;
      btn.disabled = true;

      setTimeout(() => {
        showModal();
        heroForm.reset();
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Get Free Quote`;
        btn.disabled = false;
      }, 1500);
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = document.getElementById('cf-submit-btn');
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> Sending...`;
      btn.disabled = true;

      setTimeout(() => {
        showModal();
        contactForm.reset();
        btn.innerHTML = orig;
        btn.disabled = false;
      }, 1500);
    });
  }
}

function initModal() {
  const closeBtn = document.getElementById('modal-close');
  const overlay = document.getElementById('success-modal');
  if (!closeBtn || !overlay) return;

  closeBtn.addEventListener('click', hideModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) hideModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
  });
}

function showModal() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.classList.add('active');
}

function hideModal() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.classList.remove('active');
}

// ─── Spinner CSS ──────────────────────────────────────────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
`;
document.head.appendChild(spinStyle);
