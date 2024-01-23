const CACHE_NAME = "v1";

self.addEventListener("install", (event) => {
  // Skip waiting to activate this version of the service worker immediately
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        // Try to fetch the resource from the network
        const fresh = await fetch(event.request);
        // If fetch is successful, copy the response into the cache
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (e) {
        // If network fetch fails, try to get it from the cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the resource is not in cache, you can handle the fallback as you want
        // Maybe return a default offline page or image
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
