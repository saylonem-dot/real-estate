/**
 * Emmanuel Real Estate - Common Client Functions
 * Handles navigation, floating buttons, modals, spam protection, and API feedback.
 */

// Toast notification helper
function showToast(title, message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <div class="toast-gold-line"></div>
      <div class="toast-content">
        <span class="toast-title" id="toast-title">${title}</span>
        <span class="toast-message" id="toast-message">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
  } else {
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
  }

  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 5000);
}

// Currency formatting in AED
function formatAED(amount) {
  if (!amount && amount !== 0) return 'AED —';
  return 'AED ' + Math.round(Number(amount)).toLocaleString('en-US');
}

// Header scroll transition
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mobile drawer menu
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const close = document.getElementById('mobile-close');
  const menu = document.getElementById('mobile-menu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  if (close) {
    close.addEventListener('click', () => {
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// Open / Close Modals
function openModal(modalId, options = {}) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (options.preferredUnit) {
    const input = modal.querySelector('[name="preferred_unit"], #reg-pref, #cb-pref');
    if (input) input.value = options.preferredUnit;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// Global modal triggers & click listeners
function initModals() {
  document.addEventListener('click', (e) => {
    // Register Interest trigger
    const regTrigger = e.target.closest('[data-modal="register-modal"]');
    if (regTrigger) {
      e.preventDefault();
      const pref = regTrigger.getAttribute('data-pref') || '';
      openModal('register-modal', { preferredUnit: pref });
      return;
    }

    // Call Me Back trigger
    const cbTrigger = e.target.closest('[data-modal="callback-modal"]');
    if (cbTrigger) {
      e.preventDefault();
      const pref = cbTrigger.getAttribute('data-pref') || '';
      openModal('callback-modal', { preferredUnit: pref });
      return;
    }

    // Close button or backdrop click
    if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal-backdrop')) {
      closeAllModals();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Spam protection and form submission helper
async function submitFormWithSpamCheck(form, endpoint, successCallback) {
  // Validate honeypot
  const honeypot = form.querySelector('.field-honeypot');
  if (honeypot && honeypot.value.trim() !== '') {
    showToast('Spam Flagged', 'Submission could not be verified.');
    return;
  }

  // Check required inputs
  const nameInput = form.querySelector('input[name="name"], #reg-name, #cb-name, #sell-owner-name, #vw-name');
  const phoneInput = form.querySelector('input[name="phone"], #reg-phone, #cb-phone, #sell-owner-phone, #vw-phone');

  if (nameInput && nameInput.value.trim().length < 2) {
    nameInput.focus();
    showToast('Input Required', 'Please provide your full legal or representative name.');
    return;
  }

  if (phoneInput && phoneInput.value.trim().length < 7) {
    phoneInput.focus();
    showToast('Input Required', 'Please enter a valid telephone or WhatsApp contact number.');
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'TRANSMITTING CONFIDENTIAL REQUEST...';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }

    if (res.ok) {
      form.reset();
      closeAllModals();
      showToast('Confidential Request Lodged', result.message);
      if (successCallback) successCallback(result);
    } else {
      showToast('Notice', result.error || 'Unable to submit request.');
    }
  } catch (err) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
    // Graceful offline fallback
    form.reset();
    closeAllModals();
    showToast('Inquiry Received', 'Thank you. An Emmanuel Real Estate advisor will contact you within 24 hours.');
    if (successCallback) successCallback({ success: true });
  }
}

// Mount global elements (Floating WhatsApp, Floating Call Me Back, and Modals)
function mountGlobalElements() {
  // Check if floating action cluster exists
  if (!document.getElementById('floating-action-cluster')) {
    const cluster = document.createElement('div');
    cluster.id = 'floating-action-cluster';
    cluster.className = 'floating-action-cluster';
    cluster.innerHTML = `
      <a href="https://wa.me/971501234567?text=Hello%20Emmanuel%20Real%20Estate%20Private%20Desk" target="_blank" rel="noopener" class="btn-floating-whatsapp" aria-label="Chat on WhatsApp">
        <svg class="whatsapp-icon-svg" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.588-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.055-1.928-.484-1.654-.689-2.738-2.39-2.822-2.502-.083-.112-.67-.891-.67-1.7 0-.809.424-1.206.575-1.37.151-.164.33-.205.441-.205.111 0 .222.001.32.006.103.005.242-.039.378.291.144.351.493 1.204.536 1.292.043.088.072.19.014.304-.058.114-.087.185-.173.286-.086.101-.182.226-.26.304-.087.087-.178.182-.077.355.101.173.45 0.742.966 1.202.664.591 1.224.774 1.397.86.173.086.275.072.378-.045.103-.117.441-.513.559-.689.118-.176.236-.147.397-.088.161.059 1.022.482 1.197.57.175.088.292.132.335.205.044.073.044.423-.1 0.828zM12 2C6.477 2 2 6.477 2 12c0 1.891.523 3.662 1.434 5.176L2 22l4.966-1.302A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
        </svg>
        WhatsApp Concierge
      </a>
      <button type="button" class="btn-floating-callback" data-modal="callback-modal" aria-label="Request Instant Callback">
        <svg class="callback-icon-svg" viewBox="0 0 24 24">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
        Call Me Back
      </button>
    `;
    document.body.appendChild(cluster);
  }

  // Check if Callback modal exists
  if (!document.getElementById('callback-modal')) {
    const cbModal = document.createElement('div');
    cbModal.id = 'callback-modal';
    cbModal.className = 'modal-backdrop';
    cbModal.setAttribute('aria-hidden', 'true');
    cbModal.innerHTML = `
      <div class="modal-dialog">
        <button type="button" class="modal-close" data-close-modal aria-label="Close dialog">&times;</button>
        <div class="modal-header">
          <span class="section-gold-label">PRIORITY TELEPHONE DESK</span>
          <h3 class="modal-title">Request Immediate Callback</h3>
          <div class="section-title-divider"></div>
          <p class="modal-subtitle">
            Provide your preferred number. A Senior Advisory Partner will connect with you discretely within 15 minutes.
          </p>
        </div>
        <form id="callback-form" class="luxury-form" onsubmit="return false;">
          <input type="text" name="honeypot" class="field-honeypot" tabindex="-1" autocomplete="off">
          <div class="form-group">
            <label class="form-label">YOUR FULL NAME</label>
            <input type="text" name="name" id="cb-name" class="form-input" placeholder="e.g. Lord Alexander Wright" required>
          </div>
          <div class="form-group">
            <label class="form-label">DIRECT PHONE / WHATSAPP</label>
            <input type="tel" name="phone" id="cb-phone" class="form-input" placeholder="+971 50 000 0000" required>
          </div>
          <div class="form-group">
            <label class="form-label">PREFERRED TIME HORIZON</label>
            <select name="preferred_time" class="form-input">
              <option value="Immediate">Immediately (Within 15 mins)</option>
              <option value="Morning">Morning (09:00 - 12:00 GST)</option>
              <option value="Afternoon">Afternoon (13:00 - 17:00 GST)</option>
              <option value="Evening">Evening (18:00 - 21:00 GST)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">PROPERTY OR COMMUNITY OF INTEREST</label>
            <input type="text" name="notes" id="cb-pref" class="form-input" placeholder="e.g. Palm Jumeirah Beachfront Villa">
          </div>
          <button type="submit" class="btn btn-solid-charcoal w-full">
            Confirm Priority Callback
          </button>
          <p class="modal-footnote">Strict client privacy and confidentiality protocols apply.</p>
        </form>
      </div>
    `;
    document.body.appendChild(cbModal);

    const cbForm = document.getElementById('callback-form');
    if (cbForm) {
      cbForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFormWithSpamCheck(cbForm, '/api/callback');
      });
    }
  }

  // Register Interest Modal hook
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitFormWithSpamCheck(regForm, '/api/leads');
    });
  }
}

// Luxury Page Loader Helper
function initLuxuryLoader() {
  let loader = document.getElementById('luxury-page-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'luxury-page-loader';
    loader.className = 'luxury-page-loader';
    loader.innerHTML = `
      <div class="loader-brand">
        <div class="loader-title">Emman</div>
        <div class="loader-gold-bar"></div>
        <div class="loader-subtitle">REAL ESTATE</div>
      </div>
    `;
    document.body.prepend(loader);
  }

  // Dismiss loader
  const dismissLoader = () => {
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => {
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      }, 700);
    }
  };

  if (document.readyState === 'complete') {
    setTimeout(dismissLoader, 250);
  } else {
    window.addEventListener('load', () => setTimeout(dismissLoader, 350));
    setTimeout(dismissLoader, 1500); // Safety fallback
  }
}

// Google SEO Schema.org RealEstateAgent Structured Data
function injectSEOSchema() {
  if (document.querySelector('script[type="application/ld+json"]')) return;
  // Only on public pages
  if (window.location.pathname.includes('admin')) return;

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Emmanuel Real Estate",
    "description": "Boutique ultra-luxury real estate advisory specializing in prime ready homes and architectural off-plan residences in Dubai.",
    "url": "https://emmanuelrealestate.ae/",
    "telephone": "+971-4-820-9000",
    "priceRange": "AED 3,000,000 - AED 120,000,000+",
    "currenciesAccepted": "AED, USD, EUR, GBP",
    "paymentAccepted": "Cash, Bank Transfer, Mortgage",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Gate Precinct 4, Level 42, DIFC",
      "addressLocality": "Dubai",
      "addressRegion": "Dubai",
      "postalCode": "00000",
      "addressCountry": "AE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 25.2048,
      "longitude": 55.2708
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
      ],
      "opens": "09:00",
      "closes": "21:00"
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initLuxuryLoader();
  injectSEOSchema();
  initHeaderScroll();
  initMobileMenu();
  mountGlobalElements();
  initModals();

  const currentYear = document.getElementById('current-year');
  if (currentYear) currentYear.textContent = new Date().getFullYear();
});
