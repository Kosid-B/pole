const VERSION = "2026.08.30.pwa2";
const CACHE = `sitecost-pwa-${VERSION}`;
const STATIC = ["/manifest.webmanifest", "/app-icon.svg", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(
        STATIC.map((url) => new Request(url, { cache: "reload" })),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              (key.startsWith("pole-saas-") || key.startsWith("sitecost-pwa-")) &&
              key !== CACHE,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "PURGE_STATIC_CACHE") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("pole-saas-") || key.startsWith("sitecost-pwa-"))
            .map((key) => caches.delete(key)),
        ),
      ),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Authenticated pages, PM dashboards and API responses must always come from the network.
  // This is important for financial guardrails and prevents an installed PWA from showing stale data.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html")),
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (url.origin === self.location.origin && STATIC.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
        return response;
      })(),
    );
  }
});
