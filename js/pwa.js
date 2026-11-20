// RIFF · pwa.js
// Lo que hace que RIFF se pueda instalar en el celular como una app (PWA):
// 1) registra el service worker (sw.js), que guarda la app en el celular;
// 2) guarda el aviso «Instalar app» de Android/Chrome para lanzarlo desde el botón «Instalar RIFF»;
// 3) le dice a riff.js en qué celular estamos, para mostrar las instrucciones correctas.

(function () {
  const raiz = location.pathname.includes("/pages/") ? "../" : "";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(raiz + "sw.js").catch((e) => console.warn("RIFF: no se pudo registrar el service worker", e));
    });
  }

  let avisoGuardado = null;
  const yaInstalada = () =>
    matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const esIphone = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Chrome en Android avisa que la app se puede instalar: guardamos ese aviso para usarlo en el botón
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    avisoGuardado = e;
    document.dispatchEvent(new CustomEvent("riff:instalable"));
  });
  window.addEventListener("appinstalled", () => {
    avisoGuardado = null;
    document.dispatchEvent(new CustomEvent("riff:instalada"));
  });

  window.riffApp = {
    yaInstalada,
    esIphone,
    puedeAvisar: () => !!avisoGuardado,
    // Abre el aviso nativo de instalación. Devuelve true si la persona aceptó.
    async instalar() {
      if (!avisoGuardado) return false;
      const aviso = avisoGuardado;
      avisoGuardado = null; // el navegador solo deja usar cada aviso una vez
      aviso.prompt();
      const { outcome } = await aviso.userChoice;
      return outcome === "accepted";
    },
  };
})();
