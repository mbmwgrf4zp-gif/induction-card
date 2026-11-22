// Offline cache. Bump CACHE when any file changes so phones pick up the new version.
const PREFIX = "induction-card-";
const CACHE = PREFIX + "v2.72.1";
const FILES = ["./", "index.html", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png", "fonts/DSEG7Classic-Italic.woff2",
  "fonts/plex-sans-118b75.woff2", "fonts/plex-mono-db14f4.woff2", "fonts/plex-mono-ed96d0.woff2"];
// Install: store fresh copies of every file (bypass the browser's HTTP cache).
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))));
  self.skipWaiting();
});
// Activate: remove only Induction Card's own older caches (other apps on this address keep theirs).
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Same-origin GETs: answer from the stored copy straight away (fast on poor hospital Wi-Fi, works offline),
// and refresh that copy in the background. A new version arrives as a new sw.js and shows the "tap to update" bar.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, {ignoreSearch: true}).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match("index.html"));
  })));
});
