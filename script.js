const revealItems = document.querySelectorAll('.reveal');
const yearElement = document.getElementById('year');
const progressFill = document.querySelector('.progress-bar__fill');
const counterItems = document.querySelectorAll('[data-counter]');
const navLinks = [...document.querySelectorAll('.topbar__links a[href^="#"]')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
const tiltItems = document.querySelectorAll('[data-tilt]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsHover = window.matchMedia('(hover: hover)').matches;

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const updateScrollState = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

  if (progressFill) {
    progressFill.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
  }

  if (!navLinks.length || !sections.length) {
    return;
  }

  let currentId = sections[0].id;
  const checkpoint = window.innerHeight * 0.38;

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= checkpoint) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
  });
};

if (reduceMotion || typeof IntersectionObserver === 'undefined') {
  revealItems.forEach((item) => item.classList.add('is-visible'));
  counterItems.forEach((item) => {
    item.textContent = item.dataset.counter;
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -10% 0px'
    }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 90, 320)}ms`;
    revealObserver.observe(item);
  });

  const animateCounter = (element) => {
    const target = Number(element.dataset.counter || 0);
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        element.textContent = String(target);
      }
    };

    window.requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.animated === 'true') {
          return;
        }

        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.7
    }
  );

  counterItems.forEach((item) => counterObserver.observe(item));
}

updateScrollState();

let ticking = false;
window.addEventListener(
  'scroll',
  () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollState();
      ticking = false;
    });
  },
  { passive: true }
);

window.addEventListener('resize', updateScrollState);

if (!reduceMotion) {
  document.addEventListener(
    'mousemove',
    (event) => {
      const x = `${(event.clientX / window.innerWidth) * 100}%`;
      const y = `${(event.clientY / window.innerHeight) * 100}%`;

      document.documentElement.style.setProperty('--pointer-x', x);
      document.documentElement.style.setProperty('--pointer-y', y);
    },
    { passive: true }
  );
}

if (!reduceMotion && supportsHover) {
  tiltItems.forEach((item) => {
    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      item.style.setProperty('--tilt-x', `${x * 10}deg`);
      item.style.setProperty('--tilt-y', `${y * -10}deg`);
    });

    item.addEventListener('pointerleave', () => {
      item.style.removeProperty('--tilt-x');
      item.style.removeProperty('--tilt-y');
    });
  });
}
