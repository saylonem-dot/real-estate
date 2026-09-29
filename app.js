/**
 * Emmanuel Real Estate - Main Application Script
 * Luxury Dubai Property Sales Experience
 */

// ============================================================================
// CURATED PROPERTY DATA (100% Fictional, Luxury Dubai Portfolios, AED Currency)
// (Strict rule: No real developer names, logos, or text used)
// ============================================================================

const READY_PROPERTIES = [
  {
    id: 'prop-1',
    name: 'The Palm Crest Sanctuary',
    category: 'villa',
    community: 'palm-jumeirah',
    area: 'Palm Jumeirah',
    priceAed: 48000000,
    priceFormatted: 'AED 48,000,000',
    beds: '6 Bedrooms',
    baths: '8 Bathrooms',
    size: '12,850 Sq.Ft',
    tag: 'Private Beachfront',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85',
    features: [
      'Private 40-meter white sand beach frontage',
      'Infinity pool with underwater acoustic sound system',
      'Subterranean 6-car climate-controlled showroom',
      'Private spa, steam room and Nordic cedar sauna',
      'Automated floor-to-ceiling Schuco structural glass'
    ]
  },
  {
    id: 'prop-2',
    name: 'Celestia Sky Penthouse',
    category: 'penthouse',
    community: 'downtown-dubai',
    area: 'Downtown Dubai',
    priceAed: 32500000,
    priceFormatted: 'AED 32,500,000',
    beds: '4 Bedrooms',
    baths: '5 Bathrooms',
    size: '8,420 Sq.Ft',
    tag: 'Crown Duplex',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
    features: [
      '360-degree unobstructed skyline & fountain views',
      'Double-height 7.2-meter living gallery ceilings',
      'Private sky deck with heated plunge jacuzzi',
      'Italian Calacatta gold marble island kitchen',
      'Dedicated biometric high-speed express lift'
    ]
  },
  {
    id: 'prop-3',
    name: 'Azure Water Villa',
    category: 'waterfront',
    community: 'dubai-marina',
    area: 'Dubai Marina',
    priceAed: 26000000,
    priceFormatted: 'AED 26,000,000',
    beds: '5 Bedrooms',
    baths: '6 Bathrooms',
    size: '7,950 Sq.Ft',
    tag: 'Private Berth',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85',
    features: [
      'Direct private mooring for up to 75ft motor yacht',
      'Wraparound teak sun lounge and plunge pool',
      'Gourmet show kitchen and chef catering pantry',
      'Smart Creston automated ambient environment',
      'Private office suite overlooking the water channel'
    ]
  },
  {
    id: 'prop-4',
    name: 'The Mirage Hills Manor',
    category: 'villa',
    community: 'emirates-hills',
    area: 'Emirates Hills',
    priceAed: 54000000,
    priceFormatted: 'AED 54,000,000',
    beds: '7 Bedrooms',
    baths: '9 Bathrooms',
    size: '15,200 Sq.Ft',
    tag: 'Championship Golf Front',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    features: [
      'Prime fairway frontage along championship 18th hole',
      'Private cinema with Dolby Atmos spatial sound',
      'Internal glass courtyard with 200-year-old bonsai olive trees',
      'Separate service staff quarters and security outpost',
      'Custom wine cellar with 1,200 bottle display'
    ]
  },
  {
    id: 'prop-5',
    name: 'Luminary Grand Residence',
    category: 'penthouse',
    community: 'downtown-dubai',
    area: 'Downtown Dubai',
    priceAed: 18750000,
    priceFormatted: 'AED 18,750,000',
    beds: '3 Bedrooms',
    baths: '4 Bathrooms',
    size: '5,100 Sq.Ft',
    tag: 'Turnkey Luxury',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
    features: [
      'Furnished by renowned Parisian interior artisans',
      'Floor-to-ceiling acoustic triple-glazed windows',
      'Integrated Gaggenau series 400 appliances',
      'Primary master suite with dual dressing boudoirs',
      'Direct access to 5-star concierge & valet service'
    ]
  },
  {
    id: 'prop-6',
    name: 'The Elysian Palm Villa',
    category: 'waterfront',
    community: 'palm-jumeirah',
    area: 'Palm Jumeirah',
    priceAed: 65000000,
    priceFormatted: 'AED 65,000,000',
    beds: '6 Bedrooms',
    baths: '8 Bathrooms',
    size: '14,400 Sq.Ft',
    tag: 'Sunset Facing Frond',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
    features: [
      'West-facing orientation capturing sunset over the Arabian Gulf',
      'Cantilevered master terrace floating over swimming pavilion',
      'State-of-the-art wellness pavilion and cryotherapy room',
      'Bespoke bronze sculptural staircase centerpiece',
      'Full solar-integrated zero-carbon standby microgrid'
    ]
  }
];

const OFFPLAN_PROJECTS = [
  {
    id: 'offplan-1',
    name: 'Solarium Bay Residences',
    community: 'dubai-marina',
    area: 'Dubai Marina',
    priceAed: 8900000,
    priceFormatted: 'AED 8,900,000',
    handover: 'Q4 2027',
    plan: '70/30 Post-Handover',
    projectType: 'High-Rise Architectural Landmark',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1600&q=85',
    estRoi: '8.4% Net Yield',
    features: [
      'Curved aerodynamic tower with cascading sky gardens',
      'Residents-only private marina yacht club access',
      'Elevated cantilever infinity pool at Level 54'
    ]
  },
  {
    id: 'offplan-2',
    name: 'The Horizon Sanctuary Towers',
    community: 'downtown-dubai',
    area: 'Downtown Dubai',
    priceAed: 14200000,
    priceFormatted: 'AED 14,200,000',
    handover: 'Q2 2028',
    plan: '60/40 Construction-Linked',
    projectType: 'Twin Crown Skyscraper Residences',
    image: 'https://images.unsplash.com/photo-1571888160334-1194796400d4?auto=format&fit=crop&w=1600&q=85',
    estRoi: '9.1% Projected Capital Gain',
    features: [
      'Connected via iconic sky bridge with panoramic observatory',
      'Private art collector exhibition galleries',
      'Dedicated residential butler and sommelier staff'
    ]
  },
  {
    id: 'offplan-3',
    name: 'Serengeti Oasis Estates',
    community: 'dubai-hills',
    area: 'Dubai Hills Estate',
    priceAed: 22500000,
    priceFormatted: 'AED 22,500,000',
    handover: 'Q1 2028',
    plan: '80/20 on Handover',
    projectType: 'Limited Collection of 24 Mansions',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    estRoi: '12% Expected Handover Appreciation',
    features: [
      'Surrounded by 1.2 million sq.ft of private green parkland',
      'Custom architectural layouts with renowned Scandinavian designers',
      'Full private basement level for personal wellness & car gallery'
    ]
  }
];

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatAED(amount) {
  return 'AED ' + Math.round(amount).toLocaleString('en-US');
}

// ============================================================================
// TOP MENU SCROLL BEHAVIOR
// "see-through over the home page photo with the white logo.
// When you scroll down, it turns white with the charcoal logo and a soft shadow."
// ============================================================================

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
  onScroll(); // initial trigger
}

// ============================================================================
// MOBILE MENU DRAWER
// ============================================================================

function initMobileMenu() {
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileClose = document.getElementById('mobile-close');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!mobileToggle || !mobileMenu) return;

  const openMenu = () => {
    mobileMenu.classList.add('active');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    mobileMenu.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  mobileToggle.addEventListener('click', openMenu);
  if (mobileClose) {
    mobileClose.addEventListener('click', closeMenu);
  }

  // Close menu when tapping links
  const mobileLinks = mobileMenu.querySelectorAll('.mobile-link, .btn-register-trigger');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
}

// ============================================================================
// RENDER READY PROPERTY CARDS
// "a tall photo that slowly zooms in when the mouse moves over it,
// a thin gold line, the property name in the elegant font,
// and the area plus 'From AED X' in small capital letters."
// ============================================================================

function renderProperties(list) {
  const grid = document.getElementById('properties-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <p style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--color-warm-gray);">
          No residences found matching this criteria.
        </p>
        <p style="font-size: 0.9rem; color: var(--color-warm-gray); margin-top: 0.5rem;">
          Inquire with our private client desk for confidential off-market inventory.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(item => `
    <article class="property-card" data-id="${item.id}" tabindex="0">
      <div class="property-media">
        <img 
          src="${item.image}" 
          alt="${item.name} - ${item.area}, Dubai" 
          class="property-img"
          loading="lazy"
        >
        <span class="property-tag-badge">${item.tag}</span>
        <button type="button" class="property-quickview-btn" data-view-id="${item.id}">
          View Residence
        </button>
      </div>

      <div class="property-details">
        <div class="property-gold-line"></div>
        <h3 class="property-name">${item.name}</h3>
        <div class="property-meta-row">
          <span class="property-area-name">${item.area}</span>
          <span class="property-price">From ${item.priceFormatted}</span>
        </div>
        <div class="property-specs">
          <span>${item.beds}</span>
          <span>•</span>
          <span>${item.baths}</span>
          <span>•</span>
          <span>${item.size}</span>
        </div>
      </div>
    </article>
  `).join('');

  // Add click listeners to cards and quickview buttons
  grid.querySelectorAll('.property-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.getAttribute('data-id');
      openPropertyModal(id);
    });
  });
}

// ============================================================================
// RENDER OFF-PLAN PROJECTS
// "a tall photo that slowly zooms in when the mouse moves over it,
// a thin gold line, the property name in the elegant font,
// and the area plus 'From AED X' in small capital letters."
// ============================================================================

function renderOffPlanProjects(list) {
  const grid = document.getElementById('offplan-grid');
  if (!grid) return;

  grid.innerHTML = list.map(item => `
    <article class="offplan-card" data-id="${item.id}" tabindex="0">
      <div class="offplan-media">
        <img 
          src="${item.image}" 
          alt="${item.name} Dubai Architectural Off-Plan" 
          class="offplan-img"
          loading="lazy"
        >
        <div class="offplan-badges">
          <span class="offplan-status">HANDOVER: ${item.handover}</span>
          <span class="offplan-plan-badge">${item.plan}</span>
        </div>
      </div>

      <div class="offplan-details">
        <div class="property-gold-line"></div>
        <h3 class="offplan-name">${item.name}</h3>
        <div class="offplan-meta-row">
          <span class="property-area-name">${item.area}</span>
          <span class="property-price">From ${item.priceFormatted}</span>
        </div>
        <div class="offplan-highlights">
          <div class="highlight-box">
            <span class="highlight-label">PROJECT TYPE</span>
            <span class="highlight-val" style="font-size: 0.95rem;">${item.projectType}</span>
          </div>
          <div class="highlight-box">
            <span class="highlight-label">FORECAST RETURN</span>
            <span class="highlight-val" style="color: var(--color-gold); font-size: 0.95rem;">${item.estRoi}</span>
          </div>
        </div>

        <button type="button" class="btn btn-outline-charcoal w-full" style="margin-top: 1.5rem;" data-modal="register-modal" data-pref="${item.name}">
          Inquire For Allocation
        </button>
      </div>
    </article>
  `).join('');
}

// ============================================================================
// FILTER & SEARCH LOGIC
// ============================================================================

function initFilterSystem() {
  const typeSelect = document.getElementById('filter-type');
  const communitySelect = document.getElementById('filter-community');
  const priceSelect = document.getElementById('filter-price');
  const applyBtn = document.getElementById('btn-apply-filters');
  const pillBtns = document.querySelectorAll('.pill-btn');

  function filterProperties() {
    const selectedCommunity = communitySelect ? communitySelect.value : 'all';
    const selectedPrice = priceSelect ? priceSelect.value : 'all';
    const activePill = document.querySelector('.pill-btn.active');
    const pillFilter = activePill ? activePill.getAttribute('data-filter') : 'all';

    let filtered = READY_PROPERTIES.filter(item => {
      // Pill category filter
      if (pillFilter !== 'all' && item.category !== pillFilter) {
        return false;
      }
      // Community filter
      if (selectedCommunity !== 'all' && item.community !== selectedCommunity) {
        return false;
      }
      // Price filter
      if (selectedPrice === 'under15m' && item.priceAed >= 15000000) return false;
      if (selectedPrice === '15m-30m' && (item.priceAed < 15000000 || item.priceAed > 30000000)) return false;
      if (selectedPrice === 'over30m' && item.priceAed <= 30000000) return false;

      return true;
    });

    renderProperties(filtered);
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const typeVal = typeSelect ? typeSelect.value : 'all';
      if (typeVal === 'offplan') {
        const offplanSection = document.getElementById('off-plan');
        if (offplanSection) {
          offplanSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        const propSection = document.getElementById('properties');
        if (propSection) {
          propSection.scrollIntoView({ behavior: 'smooth' });
        }
        filterProperties();
      }
    });
  }

  pillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProperties();
    });
  });

  const exploreAllBtn = document.getElementById('btn-explore-all');
  if (exploreAllBtn) {
    exploreAllBtn.addEventListener('click', () => {
      openRegisterModal('Private Off-Market Catalog Request');
    });
  }
}

// ============================================================================
// MORTGAGE CALCULATOR LOGIC (UAE Framework in AED)
// ============================================================================

function initMortgageCalculator() {
  const priceSlider = document.getElementById('calc-price');
  const downSlider = document.getElementById('calc-down');
  const yearsSlider = document.getElementById('calc-years');
  const rateSlider = document.getElementById('calc-rate');

  const priceVal = document.getElementById('calc-price-val');
  const downPct = document.getElementById('calc-down-pct');
  const downVal = document.getElementById('calc-down-val');
  const yearsVal = document.getElementById('calc-years-val');
  const rateVal = document.getElementById('calc-rate-val');

  const resultMonthly = document.getElementById('result-monthly-payment');
  const resultLoanAmount = document.getElementById('result-loan-amount');
  const resultTotalInterest = document.getElementById('result-total-interest');
  const resultDld = document.getElementById('result-dld-fee');
  const resultUpfront = document.getElementById('result-upfront-capital');

  const barPrincipal = document.getElementById('ratio-principal-bar');
  const barInterest = document.getElementById('ratio-interest-bar');

  if (!priceSlider || !downSlider || !yearsSlider || !rateSlider) return;

  function calculate() {
    const price = parseFloat(priceSlider.value);
    const downPercentage = parseFloat(downSlider.value);
    const tenureYears = parseInt(yearsSlider.value, 10);
    const annualRate = parseFloat(rateSlider.value);

    // Update labels
    priceVal.textContent = formatAED(price);
    downPct.textContent = `${downPercentage}%`;
    const downAmount = price * (downPercentage / 100);
    downVal.textContent = formatAED(downAmount);
    yearsVal.textContent = `${tenureYears} Years`;
    rateVal.textContent = `${annualRate.toFixed(2)}%`;

    const principal = price - downAmount;
    const monthlyRate = (annualRate / 100) / 12;
    const totalMonths = tenureYears * 12;

    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyPayment = principal / totalMonths;
    }

    const totalRepay = monthlyPayment * totalMonths;
    const totalInterest = Math.max(0, totalRepay - principal);
    const dldFee = price * 0.04; // Standard Dubai Land Department 4% transfer fee
    const adminFees = 4000;
    const upfrontRequired = downAmount + dldFee + adminFees;

    // Display numbers
    resultMonthly.textContent = formatAED(monthlyPayment);
    resultLoanAmount.textContent = formatAED(principal);
    resultTotalInterest.textContent = formatAED(totalInterest);
    resultDld.textContent = formatAED(dldFee);
    resultUpfront.textContent = formatAED(upfrontRequired);

    // Update ratio bar
    const sum = principal + totalInterest;
    if (sum > 0) {
      const principalPct = Math.round((principal / sum) * 100);
      const interestPct = 100 - principalPct;
      if (barPrincipal && barInterest) {
        barPrincipal.style.width = `${principalPct}%`;
        barInterest.style.width = `${interestPct}%`;
      }
    }
  }

  [priceSlider, downSlider, yearsSlider, rateSlider].forEach(slider => {
    slider.addEventListener('input', calculate);
  });

  calculate(); // initialize
}

// ============================================================================
// MODALS MANAGEMENT & FORM HANDLING (NO EMAIL SENDING AS REQUIRED)
// ============================================================================

function showToast(title, message) {
  const toast = document.getElementById('toast-notification');
  const toastTitle = document.getElementById('toast-title');
  const toastMsg = document.getElementById('toast-message');

  if (!toast) return;

  if (toastTitle) toastTitle.textContent = title;
  if (toastMsg) toastMsg.textContent = message;

  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 4500);
}

function openRegisterModal(preferredUnit = '') {
  const modal = document.getElementById('register-modal');
  if (!modal) return;

  if (preferredUnit) {
    const prefInput = document.getElementById('reg-pref');
    if (prefInput) {
      prefInput.value = preferredUnit;
    }
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function openPropertyModal(id) {
  const property = READY_PROPERTIES.find(p => p.id === id);
  if (!property) return;

  const modal = document.getElementById('property-modal');
  const container = document.getElementById('prop-detail-content');
  if (!modal || !container) return;

  container.innerHTML = `
    <div class="prop-detail-img-col">
      <img src="${property.image}" alt="${property.name}" class="prop-detail-img">
    </div>
    <div class="prop-detail-info-col">
      <span class="prop-detail-tag">${property.tag}</span>
      <h2 class="prop-detail-title">${property.name}</h2>
      <div class="prop-detail-location">${property.area} • DUBAI, UAE</div>
      <div class="prop-detail-price">${property.priceFormatted}</div>

      <div class="prop-specs-grid">
        <div class="spec-cell">
          <span class="spec-cell-label">BEDROOMS</span>
          <span class="spec-cell-val">${property.beds.split(' ')[0]}</span>
        </div>
        <div class="spec-cell">
          <span class="spec-cell-label">BATHROOMS</span>
          <span class="spec-cell-val">${property.baths.split(' ')[0]}</span>
        </div>
        <div class="spec-cell">
          <span class="spec-cell-label">BUILT-UP AREA</span>
          <span class="spec-cell-val">${property.size.split(' ')[0]}</span>
        </div>
      </div>

      <div class="prop-features-list">
        ${property.features.map(f => `<div class="feature-bullet">${f}</div>`).join('')}
      </div>

      <div style="display: flex; gap: 1rem; margin-top: auto;">
        <button type="button" class="btn btn-solid-charcoal w-full" id="btn-modal-inquire" data-pref="${property.name}">
          Register Interest For This Residence
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const inquireBtn = container.querySelector('#btn-modal-inquire');
  if (inquireBtn) {
    inquireBtn.addEventListener('click', () => {
      closeAllModals();
      openRegisterModal(property.name);
    });
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal-backdrop');
  modals.forEach(m => {
    m.classList.remove('active');
    m.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}

function initModals() {
  // Global triggers
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal="register-modal"]');
    if (trigger) {
      e.preventDefault();
      const pref = trigger.getAttribute('data-pref') || '';
      openRegisterModal(pref);
    }

    if (e.target.closest('[data-close-modal]') || e.target.classList.contains('modal-backdrop')) {
      closeAllModals();
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });

  // Register Form Submit (NO EMAIL SENDING)
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const unit = document.getElementById('reg-pref').value || 'curated portfolio';
      closeAllModals();
      registerForm.reset();
      showToast(
        'Inquiry Lodged',
        `Thank you, ${name}. Your confidential inquiry for ${unit} has been prioritized with our Private Office desk.`
      );
    });
  }

  // Sell Form Submit (NO EMAIL SENDING)
  const sellForm = document.getElementById('sell-inquiry-form');
  if (sellForm) {
    sellForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('sell-owner-name').value;
      const community = document.getElementById('sell-community').value;
      sellForm.reset();
      showToast(
        'Valuation Request Received',
        `Thank you, ${name}. A Senior Advisory Partner for ${community} will prepare your confidential property dossier.`
      );
    });
  }
}

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Dynamic current year
  const yr = document.getElementById('current-year');
  if (yr) yr.textContent = new Date().getFullYear();

  initHeaderScroll();
  initMobileMenu();
  renderProperties(READY_PROPERTIES);
  renderOffPlanProjects(OFFPLAN_PROJECTS);
  initFilterSystem();
  initMortgageCalculator();
  initModals();
});
