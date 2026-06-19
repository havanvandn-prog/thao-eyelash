(function () {
  const reviews = window.THAO_REVIEWS;
  if (!reviews?.length) return;

  const track = document.getElementById("reviews-track");
  const marquee = document.querySelector(".reviews-marquee");
  const marqueeShell = document.querySelector(".reviews-marquee-shell");
  const reviewDialog = document.getElementById("review-dialog");
  const lightbox = document.getElementById("review-lightbox");
  if (!track || !marquee) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function starsMarkup(n, className = "stars stars--outline") {
    const path =
      '<path d="M12 2.5l2.47 5.01 5.53.8-4 3.9.94 5.5L12 15.9l-4.94 2.6.94-5.5-4-3.9 5.53-.8L12 2.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>';
    const one = `<svg class="star-outline-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${path}</svg>`;
    return `<span class="${className}" role="img" aria-label="${n} out of 5 stars">${one.repeat(n)}</span>`;
  }

  function fillStarsElement(el, n) {
    if (!el) return;
    el.className = "stars stars--outline review-dialog__stars";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", `${n} out of 5 stars`);
    const path =
      '<path d="M12 2.5l2.47 5.01 5.53.8-4 3.9.94 5.5L12 15.9l-4.94 2.6.94-5.5-4-3.9 5.53-.8L12 2.5z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>';
    const one = `<svg class="star-outline-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${path}</svg>`;
    el.innerHTML = one.repeat(n);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatParagraphs(text) {
    return escapeHtml(text)
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  function reviewDefaultsToEnglish(review) {
    return !!review.defaultEnglish && !!review.fullEn;
  }

  function cardHasInlineTranslation(review) {
    return review.lang === "ko" && !!review.fullEn;
  }

  function cardExcerpt(review, inEnglish = reviewDefaultsToEnglish(review)) {
    if (inEnglish && review.excerptEn) return review.excerptEn;
    return review.excerpt;
  }

  function needsExpand(review) {
    const excerpt = cardExcerpt(review);
    const full = reviewDefaultsToEnglish(review) ? review.fullEn : review.full;
    return full.length > excerpt.length + 20;
  }

  function reviewHasTranslation(review) {
    return (review.lang === "ko" || review.lang === "ja" || review.lang === "vi") && !!review.fullEn;
  }

  function originalLanguageLabel(review) {
    if (review.lang === "ja") return "日本語で読む";
    if (review.lang === "ko") return "한국어로 보기";
    if (review.lang === "vi") return "Xem bản tiếng Việt";
    return "View original";
  }

  function avatarMarkup(review, extraClass = "") {
    const cls = `review-avatar${extraClass ? ` ${extraClass}` : ""}`;
    if (review.avatarImage) {
      return `<span class="${cls} review-avatar--img"><img src="${escapeHtml(review.avatarImage)}" alt="" width="46" height="46" loading="lazy" decoding="async" /></span>`;
    }
    return `<span class="${cls}" style="--avatar-hue: ${review.avatarHue}">${escapeHtml(review.initials)}</span>`;
  }

  function setDialogAvatar(avatarEl, review) {
    if (!avatarEl) return;
    if (review.avatarImage) {
      avatarEl.className = "review-avatar review-avatar--img review-dialog__avatar";
      avatarEl.removeAttribute("style");
      avatarEl.innerHTML = `<img src="${escapeHtml(review.avatarImage)}" alt="" width="46" height="46" loading="lazy" decoding="async" />`;
      return;
    }
    avatarEl.className = "review-avatar review-dialog__avatar";
    avatarEl.innerHTML = "";
    avatarEl.textContent = review.initials;
    avatarEl.style.setProperty("--avatar-hue", review.avatarHue);
  }

  function buildCard(review) {
    const expand = needsExpand(review);
    const showTranslate = cardHasInlineTranslation(review);

    return `<article class="review-card" data-review-id="${review.id}" data-review-lang="${review.lang || "en"}">
      <header class="review-header">
        ${avatarMarkup(review)}
        <div class="review-meta">
          <strong class="review-name">${escapeHtml(review.name)}</strong>
          ${starsMarkup(review.rating)}
        </div>
      </header>
      <div class="review-body">
        <p class="review-excerpt" lang="${review.lang || "en"}">${escapeHtml(cardExcerpt(review))}</p>
        <div class="review-card-actions">
          ${showTranslate ? `<button type="button" class="review-card-translate review-read-more" data-review-id="${review.id}" aria-pressed="false">Read in English</button>` : ""}
          ${expand ? `<button type="button" class="review-read-more" data-review-id="${review.id}">Read full review</button>` : ""}
        </div>
      </div>
    </article>`;
  }

  const cardsHtml = reviews.map(buildCard).join("");
  /* Duplicate strip for seamless horizontal loop (two identical sequences in DOM) */
  track.innerHTML = cardsHtml + cardsHtml;

  let loopWidth = 0;
  let offsetPx = 0;

  /** px/frame @ ~60fps — horizontal drift (right → left) */
  function speedPxPerFrame() {
    return prefersReducedMotion ? 0.4 : 1.5;
  }

  function measureLoop() {
    const cards = track.querySelectorAll(".review-card");
    const half = cards.length / 2;
    if (half < 1) {
      loopWidth = 0;
      return;
    }
    const firstSet = cards[0];
    const secondSet = cards[half];
    const measured = secondSet.offsetLeft - firstSet.offsetLeft;
    loopWidth = measured > 0 ? measured : track.scrollWidth / 2;
    if (loopWidth > 0) normalizeOffset();
  }

  function applyOffset() {
    track.style.transform = `translate3d(${-offsetPx}px,0,0)`;
  }

  function normalizeOffset() {
    if (loopWidth <= 0) return;
    offsetPx = ((offsetPx % loopWidth) + loopWidth) % loopWidth;
  }

  function wrapOffset() {
    normalizeOffset();
  }

  const DESKTOP_BP = 993;
  const mapWrap = document.querySelector(".reviews-map-wrap");

  function clearDesktopMarqueeLayout() {
    if (!marqueeShell) return;
    marqueeShell.style.width = "";
    marqueeShell.style.marginLeft = "";
    marqueeShell.style.removeProperty("--reviews-fade-width");
    track.style.marginLeft = "";
    track.style.paddingLeft = "";
  }

  /** Desktop: full-bleed phải; track bleed trái để card trượt dưới Maps (fade bằng CSS overlay) */
  function syncMarqueeShellWidth() {
    if (!marqueeShell) return;
    if (window.innerWidth < DESKTOP_BP) {
      clearDesktopMarqueeLayout();
      return;
    }

    const left = marqueeShell.getBoundingClientRect().left;
    marqueeShell.style.marginLeft = "";
    marqueeShell.style.width = `${Math.max(0, window.innerWidth - left)}px`;

    const mapRect = mapWrap?.getBoundingClientRect();
    if (mapRect?.width) {
      const bleedPx = Math.max(0, Math.ceil(left - mapRect.right));
      const fadePx = Math.min(56, Math.max(32, bleedPx + 24));
      track.style.marginLeft = bleedPx > 0 ? `${-bleedPx}px` : "";
      track.style.paddingLeft = bleedPx > 0 ? `${bleedPx}px` : "";
      marqueeShell.style.setProperty("--reviews-fade-width", `${fadePx}px`);
    } else {
      track.style.marginLeft = "";
      track.style.paddingLeft = "";
      marqueeShell.style.removeProperty("--reviews-fade-width");
    }
  }

  let isDragging = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let dragMoved = false;
  let marqueePauseTimer = null;

  const MARQUEE_PAUSE_MS = 10000;

  function pauseMarquee(durationMs = MARQUEE_PAUSE_MS) {
    marquee.classList.add("is-paused");
    clearTimeout(marqueePauseTimer);
    marqueePauseTimer = window.setTimeout(() => {
      marqueePauseTimer = null;
      if (!isDragging) marquee.classList.remove("is-paused");
    }, durationMs);
  }

  function endDrag(clientX) {
    if (!isDragging) return;
    dragMoved = Math.abs(clientX - dragStartX) > 6;
    isDragging = false;
    marquee.classList.remove("is-paused", "is-dragging");
    if (dragMoved) {
      window.setTimeout(() => {
        dragMoved = false;
      }, 80);
    }
  }

  function isMarqueeInteractiveTarget(el) {
    return !!el.closest(".review-read-more, button, a");
  }

  marquee.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (isMarqueeInteractiveTarget(e.target)) return;
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartOffset = offsetPx;
    marquee.classList.add("is-paused", "is-dragging");
    marquee.setPointerCapture(e.pointerId);
  });

  marquee.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 4) dragMoved = true;
    offsetPx = dragStartOffset - dx;
    wrapOffset();
    applyOffset();
  });

  marquee.addEventListener("pointerup", (e) => endDrag(e.clientX));
  marquee.addEventListener("pointercancel", (e) => endDrag(e.clientX));
  marquee.addEventListener("lostpointercapture", (e) => {
    if (isDragging) endDrag(e.clientX ?? dragStartX);
  });

  let ro;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() =>
      requestAnimationFrame(() => {
        syncMarqueeShellWidth();
        measureLoop();
      })
    );
    ro.observe(track);
    if (mapWrap) ro.observe(mapWrap);
  }
  window.addEventListener(
    "resize",
    () => {
      requestAnimationFrame(() => {
        syncMarqueeShellWidth();
        measureLoop();
      });
    },
    { passive: true }
  );
  window.addEventListener(
    "load",
    () => {
      requestAnimationFrame(() => {
        syncMarqueeShellWidth();
        measureLoop();
      });
    },
    { passive: true }
  );
  document.fonts?.ready?.then(() =>
    requestAnimationFrame(() => {
      syncMarqueeShellWidth();
      measureLoop();
    })
  );

  function tick() {
    if (!marquee.classList.contains("is-paused") && loopWidth > 0) {
      offsetPx += speedPxPerFrame();
      if (offsetPx >= loopWidth) offsetPx -= loopWidth;
      applyOffset();
    }
    requestAnimationFrame(tick);
  }

  track.querySelectorAll(".review-card img").forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", () => requestAnimationFrame(measureLoop), { once: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      requestAnimationFrame(() => {
        syncMarqueeShellWidth();
        measureLoop();
      });
    }
  });

  let bootAttempts = 0;

  function bootMarquee() {
    syncMarqueeShellWidth();
    measureLoop();
    if (loopWidth <= 0 && bootAttempts++ < 80) {
      requestAnimationFrame(bootMarquee);
      return;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(bootMarquee);

  let currentReviewIndex = 0;
  let dialogInEnglish = false;
  const cardInEnglish = new Set();

  function setCardLanguage(reviewId, inEnglish) {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review || !cardHasInlineTranslation(review)) return;

    if (inEnglish) cardInEnglish.add(reviewId);
    else cardInEnglish.delete(reviewId);

    track.querySelectorAll(`.review-card[data-review-id="${CSS.escape(reviewId)}"]`).forEach((card) => {
      const excerptEl = card.querySelector(".review-excerpt");
      const translateBtn = card.querySelector(".review-card-translate");

      if (excerptEl) {
        excerptEl.textContent = cardExcerpt(review, inEnglish);
        excerptEl.setAttribute("lang", inEnglish ? "en" : review.lang || "en");
      }
      if (translateBtn) {
        translateBtn.textContent = inEnglish ? "한국어로 보기" : "Read in English";
        translateBtn.setAttribute("aria-pressed", String(inEnglish));
      }
    });
  }

  const dialogActionsEl = reviewDialog?.querySelector(".review-dialog__actions");
  const dialogTranslateBtn = reviewDialog?.querySelector("[data-review-dialog-translate]");
  const dialogTextWrap = reviewDialog?.querySelector(".review-dialog__text-wrap");
  const dialogScrollHint = reviewDialog?.querySelector(".review-dialog__scroll-hint");

  let scrollLockY = 0;

  function lockBodyScroll() {
    scrollLockY = window.scrollY;
    document.documentElement.classList.add("review-dialog-open");
    document.body.classList.add("review-dialog-open");
    document.body.style.top = `-${scrollLockY}px`;
  }

  function unlockBodyScroll() {
    document.documentElement.classList.remove("review-dialog-open");
    document.body.classList.remove("review-dialog-open");
    document.body.style.top = "";
    window.scrollTo(0, scrollLockY);
  }

  function updateDialogScrollHint() {
    const textEl = reviewDialog?.querySelector(".review-dialog__text");
    if (!dialogTextWrap || !textEl) return;
    const scrollable = textEl.scrollHeight > textEl.clientHeight + 2;
    const atBottom = textEl.scrollTop + textEl.clientHeight >= textEl.scrollHeight - 12;
    dialogTextWrap.classList.toggle("is-scrollable", scrollable);
    dialogTextWrap.classList.toggle("is-scrolled-bottom", atBottom);
    if (dialogScrollHint) dialogScrollHint.hidden = !scrollable || atBottom;
  }

  function scheduleDialogScrollHint() {
    requestAnimationFrame(() => {
      updateDialogScrollHint();
      requestAnimationFrame(updateDialogScrollHint);
    });
  }

  reviewDialog?.querySelector(".review-dialog__text")?.addEventListener(
    "scroll",
    () => updateDialogScrollHint(),
    { passive: true }
  );

  function dialogFullText(review) {
    return dialogInEnglish && review.fullEn ? review.fullEn : review.full;
  }

  function updateDialogTranslateUi(review) {
    if (!dialogActionsEl || !dialogTranslateBtn) return;
    if (!reviewHasTranslation(review)) {
      dialogActionsEl.hidden = true;
      return;
    }
    dialogActionsEl.hidden = false;
    dialogTranslateBtn.textContent = dialogInEnglish
      ? originalLanguageLabel(review)
      : "Read in English";
    dialogTranslateBtn.setAttribute(
      "aria-pressed",
      dialogInEnglish ? "true" : "false"
    );
  }

  function renderReviewInDialog(review) {
    if (!review || !reviewDialog) return;

    const titleEl = reviewDialog.querySelector(".review-dialog__name");
    const starsWrap = reviewDialog.querySelector(".review-dialog__stars");
    const avatarEl = reviewDialog.querySelector(".review-dialog__avatar");
    const textEl = reviewDialog.querySelector(".review-dialog__text");
    const photosEl = reviewDialog.querySelector(".review-dialog__photos");

    if (titleEl) titleEl.textContent = review.name;
    if (starsWrap) fillStarsElement(starsWrap, review.rating);
    setDialogAvatar(avatarEl, review);
    if (textEl) {
      textEl.innerHTML = formatParagraphs(dialogFullText(review));
      textEl.scrollTop = 0;
      textEl.setAttribute("lang", dialogInEnglish && review.fullEn ? "en" : review.lang || "en");
    }
    updateDialogTranslateUi(review);

    if (photosEl) {
      if (review.images?.length) {
        photosEl.hidden = false;
        photosEl.innerHTML = review.images
          .map(
            (src, i) =>
              `<button type="button" class="review-dialog-photo" data-review-id="${review.id}" data-photo-index="${i}">
                <img src="${escapeHtml(src)}" alt="Review photo ${i + 1}" loading="lazy" />
              </button>`
          )
          .join("");
      } else {
        photosEl.hidden = true;
        photosEl.innerHTML = "";
      }
    }
    scheduleDialogScrollHint();
  }

  function stepReviewDialog(delta) {
    if (!reviews.length || !reviewDialog) return;
    closeLightbox();
    currentReviewIndex = (currentReviewIndex + delta + reviews.length) % reviews.length;
    dialogInEnglish = reviewDefaultsToEnglish(reviews[currentReviewIndex]);
    renderReviewInDialog(reviews[currentReviewIndex]);
  }

  function openReviewModal(id) {
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx < 0 || !reviewDialog) return;
    closeLightbox();
    currentReviewIndex = idx;
    const review = reviews[currentReviewIndex];
    dialogInEnglish = reviewDefaultsToEnglish(review) || cardInEnglish.has(review.id);
    renderReviewInDialog(review);
    reviewDialog.showModal();
    lockBodyScroll();
  }

  dialogTranslateBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const review = reviews[currentReviewIndex];
    if (!reviewHasTranslation(review)) return;
    dialogInEnglish = !dialogInEnglish;
    const textEl = reviewDialog.querySelector(".review-dialog__text");
    if (textEl) {
      textEl.innerHTML = formatParagraphs(dialogFullText(review));
      textEl.scrollTop = 0;
      textEl.setAttribute("lang", dialogInEnglish ? "en" : review.lang || "en");
    }
    updateDialogTranslateUi(review);
    scheduleDialogScrollHint();
  });

  function isLightboxOpen() {
    return !!lightbox && !lightbox.hidden;
  }

  function openLightbox(id, index) {
    const review = reviews.find((r) => r.id === id);
    if (!review?.images?.length || !lightbox) return;
    const i = Math.max(0, Math.min(index, review.images.length - 1));
    const img = lightbox.querySelector(".review-lightbox__img");
    const cap = lightbox.querySelector(".review-lightbox__caption");
    if (img) {
      img.src = review.images[i];
      img.alt = `Photo from ${review.name}'s review`;
    }
    if (cap) cap.textContent = `${review.name} · ${i + 1} / ${review.images.length}`;
    lightbox.hidden = false;
    lightbox.classList.add("is-open");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.hidden = true;
  }

  track.addEventListener("click", (e) => {
    if (dragMoved) return;

    const translateBtn = e.target.closest(".review-card-translate");
    if (translateBtn) {
      e.preventDefault();
      e.stopPropagation();
      const reviewId = translateBtn.dataset.reviewId;
      setCardLanguage(reviewId, !cardInEnglish.has(reviewId));
      return;
    }

    const readBtn = e.target.closest(".review-read-more:not(.review-card-translate)");
    if (readBtn) {
      e.preventDefault();
      e.stopPropagation();
      pauseMarquee();
      openReviewModal(readBtn.dataset.reviewId);
    }
  });

  reviewDialog?.addEventListener("click", (e) => {
    const photoBtn = e.target.closest(".review-dialog-photo");
    if (photoBtn) {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(photoBtn.dataset.reviewId, Number(photoBtn.dataset.photoIndex));
      return;
    }
    if (e.target.closest("[data-close-lightbox]")) {
      e.preventDefault();
      e.stopPropagation();
      closeLightbox();
    }
  });

  reviewDialog?.querySelector("[data-review-dialog-prev]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepReviewDialog(-1);
  });

  reviewDialog?.querySelector("[data-review-dialog-next]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    stepReviewDialog(1);
  });

  document.querySelectorAll("[data-close-review-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => reviewDialog?.close());
  });

  reviewDialog?.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (isLightboxOpen()) {
      closeLightbox();
      return;
    }
    reviewDialog.close();
  });

  reviewDialog?.addEventListener("close", () => {
    closeLightbox();
    unlockBodyScroll();
  });

  window.addEventListener(
    "resize",
    () => {
      if (reviewDialog?.open) scheduleDialogScrollHint();
    },
    { passive: true }
  );

  document.addEventListener("keydown", (e) => {
    if (!reviewDialog?.open) return;
    if (e.key === "Escape" && isLightboxOpen()) {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (isLightboxOpen()) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepReviewDialog(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      stepReviewDialog(1);
    }
  });
})();
