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
if (automatica && !/splash/.test(automatica.id)) {
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

import(new URL(raiz + "js/riff.js", location.href).href).catch((error) => console.error("RIFF no pudo cargar", error));
