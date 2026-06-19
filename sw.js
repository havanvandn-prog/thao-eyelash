const CACHE_VERSION = "20260619a";
const CACHE_NAME = `thao-eyelash-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css?v=20260619a",
  "./assets/images/logo.webp?v=20260619a",
  "./assets/images/logo-trang.webp?v=20260619a",
  "./script.js?v=20260619a",
  "./reviews-data.js",
  "./reviews-marquee.js?v=20260619a",
  "./services-slider.js?v=20260619a",
  "./booking-form.js?v=20260619a",
  "./legal-dialog.js",
  "./instagram-dm.js?v=20260612a",
  "./assets/images/nhan-vat-hero-desktop.webp?v=20260619a",
  "./assets/images/nhan-vat-mobile-2.webp?v=20260619a",
  "./assets/images/services/classic.webp?v=20260619a",
  "./assets/images/services/classic-design.webp?v=20260619a",
  "./assets/images/services/anime.webp?v=20260619a",
  "./assets/images/services/hybrid.webp?v=20260619a",
  "./assets/images/services/fox-eye.webp?v=20260619a",
  "./assets/images/contact/sticky-phone.png",
  "./assets/images/contact/sticky-whatsapp.png",
  "./assets/images/contact/sticky-kakao.png",
  "./assets/images/contact/sticky-instagram.png",
  "./assets/images/contact/sticky-messenger.png?v=20260611c",
];

const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("thao-eyelash-") && key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isStaticAsset(request) {
  if (request.method !== "GET" || !isSameOrigin(request)) return false;
  const url = new URL(request.url);
  if (url.pathname.endsWith(".html") || url.pathname === "/" || url.pathname.endsWith("/")) return false;
  if (STATIC_DESTINATIONS.has(request.destination)) return true;
  return /\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request)) return;

  const url = new URL(request.url);
  const isDocument = request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/" || url.pathname.endsWith("/");

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  if (!isStaticAsset(request)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
