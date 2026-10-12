// Offline support + installability for the Pomodoro timer.
// Bump VERSION whenever a cached file changes, otherwise clients keep the
// old copy from the cache.
const VERSION = "v1";
const SHELL_CACHE = `pomodoro-shell-${VERSION}`;
const RUNTIME_CACHE = `pomodoro-runtime-${VERSION}`;

const SHELL = "./index.html";
const PRECACHE = [
    "./",
    SHELL,
    "./index.css",
    "./index.js",
    "./worker.js",
    "./public/favicon/site.webmanifest",
    "./public/favicon/favicon.ico",
    "./public/favicon/favicon-16x16.png",
    "./public/favicon/favicon-32x32.png",
    "./public/favicon/apple-touch-icon.png",
    "./public/favicon/android-chrome-192x192.png",
    "./public/favicon/android-chrome-512x512.png",
    "./public/audio/BeepSound.wav",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(SHELL_CACHE);
            // One missing asset must not abort the whole install.
            await Promise.all(
                PRECACHE.map(async (url) => {
                    try {
                        await cache.add(new Request(url, { cache: "reload" }));
                    } catch (error) {
                        console.warn("[sw] could not precache", url, error);
                    }
                })
            );
            await self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            );
            await self.clients.claim();
        })()
    );
});

const cacheFirst = async (request) => {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
    }

    return response;
};

const staleWhileRevalidate = async (request) => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);

    const fresh = fetch(request)
        .then((response) => {
            if (response.ok || response.type === "opaque") {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fresh;
};

const networkFirst = async (request, fallbackUrl) => {
    const cache = await caches.open(SHELL_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return (await cache.match(request)) || (await cache.match(fallbackUrl));
    }
};

self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return;
    }

    const sameOrigin = url.origin === self.location.origin;

    // Navigations fall back to the cached shell so a reload works offline.
    if (request.mode === "navigate") {
        event.respondWith(networkFirst(request, SHELL));
        return;
    }

    // App code and styles stay fresh whenever the network is there.
    if (sameOrigin && /\.(?:css|js)$/.test(url.pathname)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // The beep never changes, and it has to work with no connection.
    if (url.pathname.endsWith(".wav")) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Icons, the manifest, and the CDN assets (fonts, jQuery).
    event.respondWith(staleWhileRevalidate(request));
});