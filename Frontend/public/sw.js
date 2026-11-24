// Lightweight PWA Service Worker for Apply Student Panel
// Caches only the offline fallback page and static assets.
// NEVER caches API responses, documents, or sensitive data.
// Scope-isolated from mockServiceWorker.js.

const CACHE_NAME = "apply-panel-static-v1";
const OFFLINE_URL = "/offline";

const STATIC_PRECACHE = [
  OFFLINE_URL,
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  // 2. CRITICAL: Never intercept MSW mockServiceWorker.js or any API/file endpoints
  if (
    url.pathname.includes("mockServiceWorker.js") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/mock-files/") ||
    url.pathname.startsWith("/files/") ||
    url.pathname.includes("/mock-gateway/")
  ) {
    // Explicit bypass: let browser/MSW handle completely
    return;
  }

  // 3. Navigation requests: Network-first, fallback to /offline when offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const offline = await cache.match(OFFLINE_URL);
        return offline || new Response("اتصال اینترنت شما قطع است", {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      })
    );
    return;
  }

  // 4. Panel static assets (Next.js scripts, styles, icons, fonts)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});
