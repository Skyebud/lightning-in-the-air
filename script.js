(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-site-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = lightbox?.querySelector('img');
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-lightbox-src]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!lightbox || !lightboxImage) return;
      lightboxImage.src = button.dataset.lightboxSrc;
      lightboxImage.alt = button.dataset.lightboxAlt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('[data-lightbox-close]')) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });

  const form = document.querySelector('[data-booking-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const value = (name) => String(data.get(name) || '').trim();
    const subject = `Booking inquiry: ${value('event') || 'Lightning in the Air'}${value('date') ? ` — ${value('date')}` : ''}`;
    const body = [
      'Hello Tom,',
      '',
      'I would like to ask about booking Lightning in the Air.',
      '',
      `Contact name: ${value('name')}`,
      `Email: ${value('email')}`,
      `Phone: ${value('phone')}`,
      `Venue / event: ${value('event')}`,
      `Location: ${value('location')}`,
      `Preferred date: ${value('date')}`,
      `Estimated audience / capacity: ${value('capacity')}`,
      `Budget range: ${value('budget')}`,
      '',
      'Event details:',
      value('message'),
      '',
      'Thank you.'
    ].join('\n');

    window.location.href = `mailto:lita.bhm@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
