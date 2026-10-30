/**
 * BEYOND THE COUNTER — Interactive Banking Field Visit Presentation
 * Vanilla JavaScript Controller (Offline-Ready, Accessible, Zero Dependencies)
 */
(function () {
  'use strict';

  const TAB_IDS = [
    'layout',
    'products',
    'experience',
    'loan-case',
    'careers',
    'hospitality',
    'npl',
    'management',
    'notes',
    'contact'
  ];

  let currentTabIndex = 0;
  let isCoverVisible = true;
  let loanCaseTimers = [];
  let lastFocusedElement = null;

  // const prefersReducedMotion = window.matchMedia &&
  //   window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const prefersReducedMotion = false;
  /**
   * Format integer with standard commas
   */
  function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
  }

  /**
   * Animate numerical counters inside a container element
   */
  function animateCountersIn(container) {
    if (!container) return;
    const counters = container.querySelectorAll('[data-counter-target]');
    counters.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-counter-target') || '0');
      const prefix = el.getAttribute('data-counter-prefix') || '';
      const suffix = el.getAttribute('data-counter-suffix') || '';
      const noComma = el.getAttribute('data-counter-nocomma') === 'true';

      if (el._rafId) {
        cancelAnimationFrame(el._rafId);
      }

      if (prefersReducedMotion) {
        el.textContent = prefix + (noComma ? Math.round(target) : formatNumber(target)) + suffix;
        return;
      }

      const duration = 950;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentVal = target * eased;
        const formatted = noComma ? Math.round(currentVal) : formatNumber(currentVal);
        el.textContent = prefix + formatted + suffix;

        if (progress < 1) {
          el._rafId = requestAnimationFrame(tick);
        } else {
          el.textContent = prefix + (noComma ? Math.round(target) : formatNumber(target)) + suffix;
        }
      }

      el._rafId = requestAnimationFrame(tick);
    });
  }

  /**
   * Sequential reveal animation for Tab 4: Practical Loan Case Study
   */
  function runLoanCaseSequence() {
    loanCaseTimers.forEach((t) => clearTimeout(t));
    loanCaseTimers = [];

    const stages = document.querySelectorAll('#panel-loan-case .loan-stage-card');
    if (!stages.length) return;

    if (prefersReducedMotion) {
      stages.forEach((stage) => {
        stage.classList.add('is-revealed');
        animateCountersIn(stage);
      });
      return;
    }

    stages.forEach((stage) => stage.classList.remove('is-revealed'));

    stages.forEach((stage, idx) => {
      const timer = setTimeout(() => {
        stage.classList.add('is-revealed');
        animateCountersIn(stage);
      }, idx * 220);
      loanCaseTimers.push(timer);
    });
  }

  /**
   * Switch active presentation tab by index (0 to 9)
   */
  function selectTab(index, focusTabButton) {
    if (index < 0 || index >= TAB_IDS.length) return;
    currentTabIndex = index;
    const activeId = TAB_IDS[index];

    const tabButtons = document.querySelectorAll('.nav-tab[role="tab"]');
    const tabPanels = document.querySelectorAll('.tab-panel[role="tabpanel"]');

    tabButtons.forEach((btn, idx) => {
      const isSelected = idx === index;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.setAttribute('tabindex', isSelected ? '0' : '-1');
      if (isSelected && focusTabButton) {
        btn.focus();
      }
    });

    tabPanels.forEach((panel) => {
      const isMatch = panel.id === 'panel-' + activeId;
      panel.classList.toggle('is-active', isMatch);
      panel.hidden = !isMatch;
      if (isMatch) {
        const viewport = document.getElementById('slide-viewport');
        if (viewport) viewport.scrollTop = 0;

        if (activeId === 'loan-case') {
          runLoanCaseSequence();
        } else {
          animateCountersIn(panel);
        }
      }
    });

    const liveStatus = document.getElementById('sr-tab-announcer');
    const activeBtn = tabButtons[index];
    if (liveStatus && activeBtn) {
      liveStatus.textContent = 'Showing section ' + (index + 1) + ' of ' + TAB_IDS.length + ': ' + activeBtn.textContent.trim();
    }
  }

  /**
   * Enter the main presentation from the opening Cover Screen
   */
  function enterPresentation() {
    const cover = document.getElementById('cover-screen');
    const app = document.getElementById('presentation-app');
    if (cover) {
      cover.classList.add('is-hidden');
      cover.setAttribute('aria-hidden', 'true');
    }
    if (app) {
      app.removeAttribute('aria-hidden');
    }
    isCoverVisible = false;
    selectTab(currentTabIndex, false);
  }

  /**
   * Return to the Cover Screen
   */
  function showCoverScreen() {
    const cover = document.getElementById('cover-screen');
    const app = document.getElementById('presentation-app');
    if (cover) {
      cover.classList.remove('is-hidden');
      cover.setAttribute('aria-hidden', 'false');
    }
    if (app) {
      app.setAttribute('aria-hidden', 'true');
    }
    isCoverVisible = true;
    const exploreBtn = document.getElementById('lets-explore-btn');
    if (exploreBtn) exploreBtn.focus();
  }

  /**
   * Open Accessible Image Lightbox Modal
   */
  function openLightbox(src, title, caption, altText) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const captionEl = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close-btn');

    if (!modal || !img) return;
    lastFocusedElement = document.activeElement;

    img.src = src;
    img.alt = altText || title || 'Enlarged field visit photograph';
    if (titleEl) titleEl.textContent = title || 'Image Preview';
    if (captionEl) captionEl.textContent = caption || '';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (closeBtn) closeBtn.focus();
  }

  /**
   * Close Accessible Image Lightbox Modal
   */
  function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  /**
   * Guard against overriding keyboard events inside text fields or modifier combos
   */
  function shouldIgnoreKeyEvent(event) {
    if (event.ctrlKey || event.altKey || event.metaKey) return true;
    const target = event.target;
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
      return true;
    }
    return false;
  }

  /**
   * Initialize Event Listeners
   */
  function init() {
    const exploreBtn = document.getElementById('lets-explore-btn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', enterPresentation);
    }

    const brandHomeBtn = document.getElementById('brand-cover-btn');
    if (brandHomeBtn) {
      brandHomeBtn.addEventListener('click', showCoverScreen);
    }

    const tabButtons = document.querySelectorAll('.nav-tab[role="tab"]');
    tabButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        selectTab(idx, false);
      });
    });

    const replayLoanBtn = document.getElementById('replay-loan-case-btn');
    if (replayLoanBtn) {
      replayLoanBtn.addEventListener('click', runLoanCaseSequence);
    }

    const enlargeButtons = document.querySelectorAll('[data-lightbox-src]');
    enlargeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-lightbox-src');
        const title = btn.getAttribute('data-lightbox-title');
        const caption = btn.getAttribute('data-lightbox-caption');
        const alt = btn.getAttribute('data-lightbox-alt');
        openLightbox(src, title, caption, alt);
      });
    });

    const closeBtn = document.getElementById('lightbox-close-btn');
    const modal = document.getElementById('lightbox-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLightbox();
      });
    }

    document.addEventListener('keydown', (event) => {
      const lightboxOpen = modal && modal.classList.contains('is-open');

      if (lightboxOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeLightbox();
        }
        return;
      }

      if (shouldIgnoreKeyEvent(event)) return;

      if (isCoverVisible) {
        if (event.key === 'ArrowRight' || event.key === 'Home') {
          event.preventDefault();
          enterPresentation();
        }
        return;
      }

      const insideTablist = Boolean(
        document.activeElement &&
        document.activeElement.classList &&
        document.activeElement.classList.contains('nav-tab')
      );

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const nextIdx = (currentTabIndex + 1) % TAB_IDS.length;
        selectTab(nextIdx, insideTablist);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const prevIdx = (currentTabIndex - 1 + TAB_IDS.length) % TAB_IDS.length;
        selectTab(prevIdx, insideTablist);
      } else if (event.key === 'Home') {
        event.preventDefault();
        selectTab(0, insideTablist);
      } else if (event.key === 'End') {
        event.preventDefault();
        selectTab(TAB_IDS.length - 1, insideTablist);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
