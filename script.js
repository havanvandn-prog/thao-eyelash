document.addEventListener('DOMContentLoaded', () => {

    // 1. Header Scrolled Effect (also on reload with restored scroll position)
    const header = document.getElementById('header');
    const updateHeaderScrolled = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 50);
    };

    window.addEventListener('scroll', updateHeaderScrolled, { passive: true });
    updateHeaderScrolled();

    window.addEventListener('load', () => {
        updateHeaderScrolled();
        requestAnimationFrame(updateHeaderScrolled);
        setTimeout(updateHeaderScrolled, 0);
    });
    window.addEventListener('pageshow', updateHeaderScrolled);

    // 2. Mobile Navigation Toggle
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const primaryNav = document.getElementById('primary-navigation');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', () => {
            const isOpened = navToggle.getAttribute('aria-expanded') === 'true';
            
            navToggle.setAttribute('aria-expanded', !isOpened);
            primaryNav.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        });

        // Close mobile nav when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.setAttribute('aria-expanded', 'false');
                primaryNav.classList.remove('active');
                document.body.classList.remove('no-scroll');
            });
        });
    }

    // 3. Scroll Reveal Animations — reveal whole section at once; CSS delays stagger like hero
    const REVEAL_SELECTOR = '.fade-in-up, .fade-in-right, .fade-in-left';
    const REVEAL_SECTION_IDS = ['services', 'why-choose', 'reviews', 'book'];
    const revealedSections = new Set();

    const revealGroup = (root = document) => {
        const items = root.querySelectorAll(`${REVEAL_SELECTOR}:not(.appear)`);
        if (!items.length) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                items.forEach((el) => {
                    void el.offsetWidth;
                    el.classList.add('appear');
                });
            });
        });
    };

    const revealSectionById = (id) => {
        if (revealedSections.has(id)) return;
        const section = document.getElementById(id);
        if (!section) return;
        revealedSections.add(id);
        revealGroup(section);
    };

    const scanRevealSections = () => {
        REVEAL_SECTION_IDS.forEach((id) => {
            if (revealedSections.has(id)) return;
            const section = document.getElementById(id);
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const visible = rect.top < window.innerHeight * 0.88 && rect.bottom > window.innerHeight * 0.12;
            if (visible) revealSectionById(id);
        });
    };

    window.revealFadeInUp = revealGroup;

    if ('IntersectionObserver' in window) {
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                if (id) revealedSections.add(id);
                revealGroup(entry.target);
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        REVEAL_SECTION_IDS.forEach((id) => {
            const section = document.getElementById(id);
            if (section) sectionObserver.observe(section);
        });
    }

    window.addEventListener('scroll', scanRevealSections, { passive: true });
    window.addEventListener('resize', scanRevealSections, { passive: true });
    window.addEventListener('load', scanRevealSections);
    scanRevealSections();

    // 5. Smooth Anchor Scrolling with offset for header
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const headerHeight = header.offsetHeight;
                const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 6. Photo Marquee Gallery Integration
    (function () {
      const track = document.getElementById("photo-marquee-track");
      const marquee = document.querySelector(".photo-marquee");
      const lightbox = document.getElementById("gallery-lightbox");
      if (!track || !marquee) return;

      const paths = [
        "assets/images/carosel san pham/z7925270185895.webp",
        "assets/images/carosel san pham/z7925270199351.webp",
        "assets/images/carosel san pham/z7925270204246.webp",
        "assets/images/carosel san pham/z7925270207652.webp",
        "assets/images/carosel san pham/z7925270221871.webp",
        "assets/images/carosel san pham/z7925270062336.webp",
        "assets/images/carosel san pham/z7925270068594.webp",
        "assets/images/carosel san pham/z7925270075623.webp",
        "assets/images/carosel san pham/z7925270092463.webp",
        "assets/images/carosel san pham/z7925270096062.webp",
        "assets/images/carosel san pham/z7925270096370.webp",
        "assets/images/carosel san pham/z7925270120321.webp",
        "assets/images/carosel san pham/z7925270109359.webp",
        "assets/images/carosel san pham/z7925270111077.webp",
        "assets/images/carosel san pham/z7925270130140.webp",
        "assets/images/carosel san pham/z7925270132671.webp",
        "assets/images/carosel san pham/z7925270155468.webp",
        "assets/images/carosel san pham/z7925270145609.webp",
        "assets/images/carosel san pham/z7925270167388.webp",
        "assets/images/carosel san pham/z7925270145893.webp",
        "assets/images/carosel san pham/z7925270167796.webp",
        "assets/images/carosel san pham/z7925270174103.webp",
        "assets/images/carosel san pham/z7925270179461.webp",
        "assets/images/carosel san pham/z7867897131915_31e064e0b15415dc76495b08c57a9eea.webp",
        "assets/images/carosel san pham/z7867897141101_5a1452ef03965995718209c7c4ca57cd.webp",
        "assets/images/carosel san pham/z7867897152173_b810e442a741c718bb253b776ecd743e.webp",
        "assets/images/carosel san pham/z7867897199209_2403b3a45432f94eba0108a839f09871.webp",
        "assets/images/carosel san pham/z7867897209201_20bc4b6133585fe67af1c7219d3abc02.webp",
        "assets/images/carosel san pham/z7867897211617_bee7c5e432199a48d953513d9f2d6e19.webp",
        "assets/images/carosel san pham/z7867897235903_816e46493bfbd69ad848356cd7616e46.webp",
        "assets/images/carosel san pham/z7867897236116_dbc5f3e2373e52630fcb908847dcb95f.webp",
        "assets/images/carosel san pham/z7867897249286_c78a98797165074103abb71405e04b4a.webp",
        "assets/images/carosel san pham/z7867897269599_26484cc839b807c69e937896695fd247.webp",
        "assets/images/carosel san pham/z7914943170263_046fb46da611d614689b287ec8b15c0a.webp",
        "assets/images/carosel san pham/z7914943177053_ee57d2c5bba8f36199044c1205184dee.webp",
        "assets/images/carosel san pham/z7914963303488_8044370f4dae62d9e0588840503c6a83.webp",
        "assets/images/carosel san pham/z7914963328006_8cda2fb3524b72dbff720d0e978fb7d0.webp",
        "assets/images/carosel san pham/z7914963331897_1121cd3e7620a383222e07e68a1e1cc3.webp",
        "assets/images/carosel san pham/z7914982572852_00d17d4aa04912ebadc4e816b4179d21.webp",
        "assets/images/carosel san pham/z7914982573170_380ede29b1a77f18aa10d2e7812eb951.webp",
        "assets/images/carosel san pham/z7914982577646_0425ad3f156cbdeee93e2be4ef2c2a2b.webp",
        "assets/images/carosel san pham/z7914982585280_40fdbaa40b7cf931937d4910c79cad1e.webp",
        "assets/images/carosel san pham/z7914982595782_599850562dc0e9177fd4e2233c6f1c0c.webp",
        "assets/images/carosel san pham/z7914982596449_c5cae3894ca20da27178ef1f85374ff7.webp",
        "assets/images/carosel san pham/z7915011396651_e21b2be10069c1e30389975963e55a71.webp",
        "assets/images/carosel san pham/z7915011398196_0f0b47d92e3a70dd66c65a7d32921be8.webp",
        "assets/images/carosel san pham/z7915011406150_7d40ea3a4e0260ca985ebd2f30dc9606.webp",
        "assets/images/carosel san pham/z7915011430772_4ffe0c7ec22a2094a3afebbf7ada09d7.webp",
        "assets/images/carosel san pham/z7915011438064_08ee794f94af4a4fac25c0300c4b078c.webp",
        "assets/images/carosel san pham/z7915011463521_4496831175d9c1844995e9b52e4a2fd2.webp",
        "assets/images/carosel san pham/z7915026279654_4b6ff2128fea503d47840874c77cea5c.webp",
        "assets/images/carosel san pham/z7915026308840_f00347fb750cc87ea325f63f989dd904.webp",
        "assets/images/carosel san pham/z7915026317749_a3591012ebc24ddb3d5e7d7cd335d7bc.webp",
        "assets/images/carosel san pham/z7915026320808_3e22523fffe806efd910736b0da24d28.webp",
        "assets/images/carosel san pham/z7915077342528_1592086994dd030233105e8d0d9f5891.webp",
        "assets/images/carosel san pham/z7915087432333_d869812db61a2788faef752684f4cab3.webp"
      ];
      const COUNT = paths.length;

      function encodeAssetPath(path) {
        return path
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/");
      }

      const encodedPaths = paths.map(encodeAssetPath);

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let loopWidth = 0;
      let offsetPx = 0;
      let lightboxIndex = 0;

      const lbImg = lightbox?.querySelector(".gallery-lightbox__img");
      const lbCap = lightbox?.querySelector(".gallery-lightbox__caption");

      function speedPxPerFrame() {
        return prefersReducedMotion ? 1.4 : 1.5;
      }

      const EAGER_GALLERY_COUNT = 5;

      function slideMarkup(src, index, pathIndex) {
        const loading = pathIndex < EAGER_GALLERY_COUNT ? "eager" : "lazy";
        return `<button type="button" class="photo-marquee-slide photo-marquee-slide--landscape" data-gallery-index="${index}" aria-label="View photo ${index}">
          <img src="${src}" alt="" loading="${loading}" decoding="async" draggable="false" />
        </button>`;
      }

      const html = encodedPaths.map((src, i) => slideMarkup(src, i + 1, i)).join("");
      track.innerHTML = html + html;

      function sizeSlide(img) {
        const slide = img.closest(".photo-marquee-slide");
        if (!slide || !img.naturalWidth || !img.naturalHeight) return;
        const h = marquee.offsetHeight;
        if (!h) return;
        const w = Math.round((h * img.naturalWidth) / img.naturalHeight);
        if (w > 0) slide.style.width = `${w}px`;
      }

      function sizeAllSlides() {
        track.querySelectorAll(".photo-marquee-slide img").forEach((img) => {
          if (img.naturalWidth) sizeSlide(img);
        });
      }

      function applyOrientation(img) {
        const slide = img.closest(".photo-marquee-slide");
        if (!slide) return;
        const isPortrait = img.naturalHeight > img.naturalWidth;
        slide.classList.toggle("photo-marquee-slide--portrait", isPortrait);
        slide.classList.toggle("photo-marquee-slide--landscape", !isPortrait);
        sizeSlide(img);
        requestAnimationFrame(measureLoop);
      }

      track.querySelectorAll(".photo-marquee-slide img").forEach((img) => {
        if (img.complete && img.naturalWidth) applyOrientation(img);
        else img.addEventListener("load", () => applyOrientation(img), { once: true });
      });

      function measureLoop() {
        const slides = track.querySelectorAll(".photo-marquee-slide");
        const half = slides.length / 2;
        if (half < 1) {
          loopWidth = 0;
          return;
        }
        let measured = 0;
        for (let i = 0; i < half; i++) {
          measured += slides[i].offsetWidth;
        }
        if (measured <= 0) {
          measured = slides[half].offsetLeft - slides[0].offsetLeft;
        }
        loopWidth = measured > 0 ? measured : track.scrollWidth / 2;
        if (loopWidth > 0) {
          offsetPx = ((offsetPx % loopWidth) + loopWidth) % loopWidth;
        }
      }

      function applyOffset() {
        track.style.transform = `translate3d(${-offsetPx}px,0,0)`;
      }

      let dragPending = false;
      let isDragging = false;
      let dragMoved = false;
      let dragStartX = 0;
      let dragStartOffset = 0;
      let pointerDownTarget = null;

      function releaseCapture(e) {
        if (!marquee.hasPointerCapture(e.pointerId)) return;
        try {
          marquee.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }

      function finishPointerInteraction(e) {
        if (!dragPending && !isDragging) return;
        const tap = dragPending && !dragMoved;
        const slide = pointerDownTarget?.closest?.(".photo-marquee-slide[data-gallery-index]");
        releaseCapture(e);
        if (tap && slide) showLightbox(Number(slide.dataset.galleryIndex));
        isDragging = false;
        dragPending = false;
        dragMoved = false;
        pointerDownTarget = null;
        marquee.classList.remove("is-paused", "is-dragging");
      }

      marquee.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        dragPending = true;
        isDragging = false;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartOffset = offsetPx;
        pointerDownTarget = e.target;
        marquee.classList.add("is-paused");
        try {
          marquee.setPointerCapture(e.pointerId);
        } catch (_) {}
      });

      marquee.addEventListener("pointermove", (e) => {
        if (!dragPending && !isDragging) return;
        const dx = e.clientX - dragStartX;
        if (!isDragging && Math.abs(dx) > 4) {
          isDragging = true;
          dragMoved = true;
          marquee.classList.add("is-dragging");
        }
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        offsetPx = dragStartOffset - dx;
        if (loopWidth > 0) offsetPx = ((offsetPx % loopWidth) + loopWidth) % loopWidth;
        applyOffset();
      });

      marquee.addEventListener("pointerup", finishPointerInteraction);
      marquee.addEventListener("pointercancel", finishPointerInteraction);
      marquee.addEventListener("lostpointercapture", (e) => {
        if (dragPending || isDragging) finishPointerInteraction(e);
      });

      function remeasure() {
        sizeAllSlides();
        requestAnimationFrame(measureLoop);
      }

      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => requestAnimationFrame(remeasure));
        ro.observe(marquee);
      }
      window.addEventListener("resize", () => requestAnimationFrame(remeasure), { passive: true });
      window.addEventListener("load", () => requestAnimationFrame(remeasure), { passive: true });

      function tick() {
        if (!marquee.classList.contains("is-paused") && loopWidth > 0) {
          offsetPx += speedPxPerFrame();
          while (offsetPx >= loopWidth) offsetPx -= loopWidth;
          applyOffset();
        }
        requestAnimationFrame(tick);
      }

      requestAnimationFrame(() => {
        measureLoop();
        requestAnimationFrame(tick);
      });

      function showLightbox(index) {
        if (!lightbox || !lbImg) return;
        lightboxIndex = ((index - 1) % COUNT + COUNT) % COUNT;
        const src = encodedPaths[lightboxIndex];
        lbImg.src = src;
        lbImg.alt = `Photo ${lightboxIndex + 1}`;
        if (lbCap) lbCap.textContent = `${lightboxIndex + 1} / ${COUNT}`;
        lightbox.showModal();
      }

      function stepLightbox(delta) {
        showLightbox(lightboxIndex + 1 + delta);
      }

      document.querySelectorAll("[data-close-gallery-lightbox]").forEach((btn) => {
        btn.addEventListener("click", () => lightbox?.close());
      });

      lightbox?.querySelector("[data-gallery-prev]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        stepLightbox(-1);
      });

      lightbox?.querySelector("[data-gallery-next]")?.addEventListener("click", (e) => {
        e.stopPropagation();
        stepLightbox(1);
      });

      lightbox?.addEventListener("cancel", (e) => {
        e.preventDefault();
        lightbox.close();
      });

      lightbox?.addEventListener("click", (e) => {
        if (e.target === lightbox) lightbox.close();
      });

      document.addEventListener("keydown", (e) => {
        if (!lightbox?.open) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          stepLightbox(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          stepLightbox(1);
        } else if (e.key === "Escape") {
          lightbox.close();
        }
      });
    })();
});
