// RIFF · app.js
// Puerta de entrada del comportamiento. Todas las pantallas cargan este archivo.
// 1) Navegación básica del prototipo (volver, links dentro de tarjetas, chips).
// 2) Carga riff.js, que conecta cada pantalla con la base de datos (Supabase).

const enPages = location.pathname.includes("/pages/");
const raiz = enPages ? "../" : "";

// Estilos de la app funcional
const estilos = document.createElement("link");
estilos.rel = "stylesheet";
estilos.href = raiz + "css/app.css";
document.head.appendChild(estilos);
// Capa visual «Glass Liquid» (se suma encima; si se borra, la app vuelve al estilo anterior)
const vidrio = document.createElement("link");
vidrio.rel = "stylesheet";
vidrio.href = raiz + "css/glass.css";
document.head.appendChild(vidrio);

document.addEventListener("click", (evento) => {
  const el = evento.target.closest("[data-href], [data-volver], [data-url], [data-alternar]");
  if (!el || el.closest("[data-riff]")) return; // riff.js se encarga de esos elementos

  if (el.dataset.alternar !== undefined) {
    evento.preventDefault();
    el.classList.toggle("sel");
    el.dispatchEvent(new CustomEvent("riff:alternado", { bubbles: true }));
    return;
  }
  if (el.dataset.url) {
    evento.preventDefault();
    evento.stopPropagation();
    window.open(el.dataset.url, "_blank", "noopener");
    return;
  }
  if (el.dataset.volver !== undefined) {
    evento.preventDefault();
    if (history.length > 1 && document.referrer) history.back();
    else location.href = raiz + "index.html";
    return;
  }
  if (el.dataset.href) {
    evento.preventDefault();
    evento.stopPropagation();
    location.href = el.dataset.href;
  }
});

// Pantallas que avanzan solas (cargando, importando gustos).
// El splash lo decide riff.js, porque depende de si hay sesión abierta.
const automatica = document.querySelector("[data-auto]");
if (automatica && !/splash/.test(automatica.id) && !/[?&](code|error)=/.test(location.search)) {
  const [destino, espera] = automatica.dataset.auto.split(",");
  setTimeout(() => (location.href = destino + location.search), Number(espera));
}

// En celular: el diseño (375 px de ancho) se escala para llenar toda la pantalla
function ajustarPantalla() {
  const telefono = document.querySelector(".telefono");
  if (!telefono) return;
  if (window.innerWidth <= 720) {
    const escala = window.innerWidth / 375;
    telefono.style.width = "375px";
    telefono.style.height = window.innerHeight / escala + "px";
    telefono.style.transform = "scale(" + escala + ")";
    telefono.style.transformOrigin = "top left";
  } else {
    telefono.style.width = telefono.style.height = telefono.style.transform = "";
  }
}
ajustarPantalla();
window.addEventListener("resize", ajustarPantalla);
window.addEventListener("orientationchange", () => setTimeout(ajustarPantalla, 300));

// Barra de pestañas (Feed · Mapa · Calendario · Perfil): una gota de vidrio líquido
// se desliza de una pestaña a otra antes de cambiar de sección.
(function pestanasLiquidas() {
  const tabs = document.querySelector(".tabs");
  if (!tabs) return;
  const botones = [...tabs.querySelectorAll(":scope > a, :scope > button")];
  const gota = document.createElement("span");
  gota.className = "tab-liquido";
  gota.setAttribute("aria-hidden", "true");
  tabs.prepend(gota);
  tabs.classList.add("con-liquido");
  const caja = (b) => ({ x: b.offsetLeft + (b.offsetWidth - 64) / 2, w: 64 });
  const colocar = (b) => { if (!b) { gota.style.opacity = "0"; return; } const c = caja(b); gota.style.transform = `translateX(${c.x}px)`; gota.style.width = c.w + "px"; gota.style.opacity = "1"; };
  let activa = botones.find((b) => b.classList.contains("activa"));
  colocar(activa);
  window.addEventListener("resize", () => colocar(activa));
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("a[href]");
    if (!b || !botones.includes(b) || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (b === activa) return;
    const destino = b.href;
    activa?.classList.remove("activa"); b.classList.add("activa");
    if (quieto || !activa) { location.href = destino; return; }
    // La gota se estira hasta cubrir ambas pestañas y luego se recoge en la nueva (como un líquido)
    const de = caja(activa), a = caja(b);
    const izq = Math.min(de.x, a.x), ancho = Math.abs(a.x - de.x) + 64;
    const anim = gota.animate([
      { transform: `translateX(${de.x}px)`, width: "64px", borderRadius: "20px" },
      { transform: `translateX(${izq}px)`, width: ancho + "px", borderRadius: "26px", offset: 0.5 },
      { transform: `translateX(${a.x}px)`, width: "64px", borderRadius: "20px" },
    ], { duration: 320, easing: "cubic-bezier(.45,.05,.25,1)", fill: "forwards" });
    activa = b;
    let ido = false;
    const navegar = () => { if (!ido) { ido = true; location.href = destino; } };
    anim.onfinish = navegar;
    setTimeout(navegar, 380); // por si el navegador no termina la animación
  });
  // Precarga la sección al apuntar o tocar, para que abra al instante
  botones.forEach((b) => ["pointerenter", "touchstart"].forEach((ev) => b.addEventListener(ev, () => {
    if (!b.href || b.dataset.precargado) return; b.dataset.precargado = "1";
    const l = document.createElement("link"); l.rel = "prefetch"; l.href = b.href; document.head.appendChild(l);
  }, { passive: true, once: true })));
})();

import(new URL(raiz + "js/riff.js", location.href).href).catch((error) => console.error("RIFF no pudo cargar", error));
