document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("services");
  if (!section) return;

  const tabs = section.querySelectorAll("[data-services-tab]");
  const panels = section.querySelectorAll("[data-services-panel]");
  const slider = section.querySelector("[data-services-slider]");
  const track = slider?.querySelector("[data-services-track]");
  const prevBtn = slider?.querySelector("[data-services-prev]");
  const nextBtn = slider?.querySelector("[data-services-next]");
  const viewport = slider?.querySelector(".services-slider__viewport");
  const extensionsPanel = document.getElementById("services-panel-extensions");

  const IMG_V = "20260619a";

  const EXTENSIONS = [
    {
      name: "Classic",
      price: "200.000 - 300.000 VNĐ",
      image: `assets/images/services/classic.webp?v=${IMG_V}`,
    },
    {
      name: "Classic Design",
      price: "300.000 - 450.000 VNĐ",
      image: `assets/images/services/classic-design.webp?v=${IMG_V}`,
    },
    {
      name: "Anime",
      price: "300.000 - 400.000 VNĐ",
      image: `assets/images/services/anime.webp?v=${IMG_V}`,
    },
    {
      name: "Hybrid",
      price: "350.000 - 500.000 VNĐ",
      image: `assets/images/services/hybrid.webp?v=${IMG_V}`,
    },
    {
      name: "Volume & Megavolume",
      price: "300.000 - 1.000.000 VNĐ",
      image: `assets/images/services/volume-megavolume.webp?v=${IMG_V}`,
    },
    {
      name: "Fox Eye",
      price: "350.000 - 500.000 VNĐ",
      image: `assets/images/services/fox-eye.webp?v=${IMG_V}`,
    },
    {
      name: "Wispy",
      price: "450.000 - 850.000 VNĐ",
      image: `assets/images/services/wispy.webp?v=${IMG_V}`,
    },
  ];

  const DESKTOP_VISIBLE = 3;
  const MOBILE_VISIBLE = 2;

  let cardIndex = DESKTOP_VISIBLE;
  let isTransitioning = false;
  let transitionTimer = null;
  let resizeTimer = null;
  let metricsRetryTimer = null;
  let lastGoodStepPx = 0;
  let mobileQuery = window.matchMedia("(max-width: 900px)");

  function isExtensionsPanelVisible() {
    return !!extensionsPanel && !extensionsPanel.hidden;
  }

  function clearSliderMetrics() {
    clearTimeout(metricsRetryTimer);
    metricsRetryTimer = null;
    viewport?.style.removeProperty("--slide-card-width");
    track?.style.removeProperty("--slide-card-width");
    lastGoodStepPx = 0;
  }

  function isMobile() {
    return mobileQuery.matches;
  }

  function getVisibleCount() {
    return isMobile() ? MOBILE_VISIBLE : DESKTOP_VISIBLE;
  }

  function renderCard(item) {
    return `
      <article class="service-card">
        <div class="service-card__img-wrap">
          <img src="${item.image}" alt="${item.name} eyelash extension style" loading="eager" decoding="async" width="720" height="720">
        </div>
        <h3 class="service-card__name">${item.name}</h3>
        <p class="service-card__price">${item.price}</p>
        <a href="#book" class="btn btn-dark service-card__cta">Book Now</a>
      </article>
    `;
  }

  function getInfiniteSequence(visibleCount) {
    const head = EXTENSIONS.slice(-visibleCount);
    const tail = EXTENSIONS.slice(0, visibleCount);
    return [...head, ...EXTENSIONS, ...tail];
  }

  function getCardStepPx() {
    if (!viewport) return 0;
    const viewportWidth = viewport.getBoundingClientRect().width;
    if (!viewportWidth) return 0;
    return Math.floor(viewportWidth / getVisibleCount());
  }

  function syncCardMetrics() {
    if (!track || !viewport || !isExtensionsPanelVisible()) return;

    const step = getCardStepPx();
    if (step < 16) return;

    clearTimeout(metricsRetryTimer);
    metricsRetryTimer = null;
    lastGoodStepPx = step;
    const cardWidth = `${step}px`;
    viewport.style.setProperty("--slide-card-width", cardWidth);
    track.style.setProperty("--slide-card-width", cardWidth);
  }

  function refreshSliderLayout() {
    if (!track || !isExtensionsPanelVisible()) return;

    isTransitioning = false;
    clearTimeout(transitionTimer);
    slider?.classList.toggle("is-mobile-row-slider", isMobile());

    const remeasure = () => {
      if (!isExtensionsPanelVisible()) return;

      syncCardMetrics();
      const step = getCardStepPx();
      if (step < 16) {
        clearTimeout(metricsRetryTimer);
        metricsRetryTimer = window.setTimeout(remeasure, 50);
        return;
      }

      updateCardPosition(false);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(remeasure);
    });
  }

  function updateCardPosition(animate = true) {
    if (!track || !isExtensionsPanelVisible()) return;

    syncCardMetrics();
    const step = getCardStepPx();
    const effectiveStep = step >= 16 ? step : lastGoodStepPx;
    if (effectiveStep < 16) return;

    track.classList.toggle("is-animating", animate);
    track.style.transform = `translate3d(-${cardIndex * effectiveStep}px, 0, 0)`;

    if (!animate) {
      finishTransition();
      return;
    }

    isTransitioning = true;
    clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => {
      handleSlideSettle();
    }, 500);
  }

  function buildInfiniteTrack() {
    if (!track) return;

    const visible = getVisibleCount();
    const sequence = getInfiniteSequence(visible);

    track.classList.add("services-slider__track--infinite");
    track.innerHTML = sequence.map(renderCard).join("");
    cardIndex = visible;
    track.classList.remove("is-animating");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateCardPosition(false);
      });
    });
    updateSliderControls();
  }

  function buildPages() {
    if (!track) return;

    isTransitioning = false;
    clearTimeout(transitionTimer);
    slider?.classList.toggle("is-mobile-row-slider", isMobile());
    buildInfiniteTrack();
  }

  function updateSliderControls() {
    if (!prevBtn || !nextBtn) return;

    const hideArrows = EXTENSIONS.length <= 1;
    prevBtn.hidden = hideArrows;
    nextBtn.hidden = hideArrows;
  }

  function finishTransition() {
    clearTimeout(transitionTimer);
    isTransitioning = false;
    updateSliderControls();
  }

  function handleSlideSettle() {
    const visible = getVisibleCount();
    const total = EXTENSIONS.length;

    if (cardIndex >= total + visible) {
      cardIndex = visible;
      updateCardPosition(false);
      return;
    }

    if (cardIndex < visible) {
      cardIndex = total + visible - 1;
      updateCardPosition(false);
      return;
    }

    finishTransition();
  }

  function onTrackTransitionEnd(event) {
    if (event.target !== track || event.propertyName !== "transform") return;
    handleSlideSettle();
  }

  function goNext() {
    if (isTransitioning || EXTENSIONS.length <= 1) return;

    isTransitioning = true;
    cardIndex += 1;
    updateCardPosition(true);
  }

  function goPrev() {
    if (isTransitioning || EXTENSIONS.length <= 1) return;

    isTransitioning = true;
    cardIndex -= 1;
    updateCardPosition(true);
  }

  track?.addEventListener("transitionend", onTrackTransitionEnd);

  prevBtn?.addEventListener("click", goPrev);
  nextBtn?.addEventListener("click", goNext);

  let touchStartX = 0;
  let touchDeltaX = 0;

  viewport?.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? 0;
      touchDeltaX = 0;
    },
    { passive: true }
  );

  viewport?.addEventListener(
    "touchmove",
    (event) => {
      const currentX = event.changedTouches[0]?.clientX ?? 0;
      touchDeltaX = currentX - touchStartX;
    },
    { passive: true }
  );

  viewport?.addEventListener("touchend", () => {
    if (Math.abs(touchDeltaX) < 40) return;
    if (touchDeltaX < 0) goNext();
    else goPrev();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.servicesTab;
      if (!target || tab.getAttribute("aria-selected") === "true") return;

      tabs.forEach((item) => {
        const isActive = item === tab;
        item.setAttribute("aria-selected", String(isActive));
        item.classList.toggle("is-active", isActive);
        item.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.servicesPanel === target;
        const wasExtensions = panel.dataset.servicesPanel === "extensions" && !panel.hidden;

        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);

        if (wasExtensions && !isActive) {
          clearSliderMetrics();
        }

        if (isActive && panel.dataset.servicesPanel === "extensions") {
          refreshSliderLayout();
        }

        if (isActive && typeof window.revealFadeInUp === "function") {
          window.revealFadeInUp(panel);
        }
      });
    });
  });

  function handleBreakpointChange() {
    cardIndex = getVisibleCount();
    buildPages();
  }

  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!isExtensionsPanelVisible()) return;
      updateCardPosition(false);
    }, 150);
  }

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleBreakpointChange);
  } else {
    mobileQuery.addListener(handleBreakpointChange);
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("load", () => refreshSliderLayout());

  if (extensionsPanel && typeof ResizeObserver !== "undefined") {
    let panelResizeTimer = null;
    const panelObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || entry.contentRect.width < 16) return;
      if (!isExtensionsPanelVisible()) return;
      if (isTransitioning) return;

      clearTimeout(panelResizeTimer);
      panelResizeTimer = window.setTimeout(() => {
        updateCardPosition(false);
      }, 100);
    });
    panelObserver.observe(extensionsPanel);
  }

  buildPages();
});
