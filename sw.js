// RIFF · sw.js (service worker)
// Es lo que convierte la página en una app instalable: guarda una copia de los
// archivos de la app en el celular para que abra rápido y aguante una mala conexión.
// Los datos (Supabase, Spotify, mapas) NO se guardan aquí: siempre se piden en vivo.
//
// Cuando cambien muchos archivos, sube el número de VERSION para limpiar la copia vieja.

const VERSION = "riff-v1";

// Lo mínimo para que la app abra sin conexión
const BASICOS = [
  "/",
  "/index.html",
  "/pages/feed-sin-conexion.html",
  "/css/prototipo.css",
  "/css/app.css",
  "/css/glass.css",
  "/js/app.js",
  "/js/pwa.js",
  "/js/riff.js",
  "/js/iconos.js",
  "/js/config.js",
  "/js/spotify.js",
  "/assets/app/icono-192.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const pedido = e.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== location.origin) return; // Supabase, fuentes, mapas: directo a internet

  // Pantallas (HTML): primero internet, para ver siempre la versión más nueva.
  // Sin conexión: la copia guardada o, si no hay, la pantalla «sin conexión».
  if (pedido.mode === "navigate") {
    e.respondWith(
      fetch(pedido)
        .then((r) => { guardar(pedido, r.clone()); return r; })
        .catch(async () =>
          (await caches.match(pedido, { ignoreSearch: true })) ||
          (await caches.match("/pages/feed-sin-conexion.html")) ||
          Response.error()
        )
    );
    return;
  }

  // Imágenes: si ya están guardadas, salen al instante.
  if (pedido.destination === "image") {
    e.respondWith(caches.match(pedido).then((g) => g || fetch(pedido).then((r) => { guardar(pedido, r.clone()); return r; })));
    return;
  }

  // CSS y JS: primero internet (así cada cambio que suban a Vercel se ve de una vez);
  // sin conexión, la copia guardada.
  e.respondWith(
    fetch(pedido)
      .then((r) => { guardar(pedido, r.clone()); return r; })
      .catch(async () => (await caches.match(pedido, { ignoreSearch: true })) || Response.error())
  );
});

function guardar(pedido, respuesta) {
  if (!respuesta || !respuesta.ok || respuesta.type !== "basic") return;
  caches.open(VERSION).then((c) => c.put(pedido, respuesta));
}
