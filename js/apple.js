// RIFF · apple.js
// Vincula Apple Music de verdad con MusicKit JS:
// 1) appleToken() pide a /api/apple-token el "developer token" (firmado en el servidor).
// 2) prepararApple() carga y configura MusicKit antes de que la persona toque el botón.
// 3) vincularApple() abre el permiso de Apple y lee lo que más escucha (rotación y recientes).
// El permiso de la persona (Music User Token) no se guarda en la base de datos.

import { MAPA } from "./spotify.js";

let token = null;
let preparado = null;

export async function appleToken() {
  try {
    const r = await fetch("/api/apple-token");
    if (!r.ok) return null;
    token = (await r.json()).token || null;
    return token;
  } catch {
    return null;
  }
}

function cargarMusicKit() {
  if (window.MusicKit) return Promise.resolve();
  return new Promise((ok, mal) => {
    document.addEventListener("musickitloaded", ok, { once: true });
    const s = document.createElement("script");
    s.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    s.async = true;
    s.onerror = mal;
    document.head.appendChild(s);
  });
}

export function prepararApple() {
  preparado = cargarMusicKit().then(() => window.MusicKit.configure({ developerToken: token, app: { name: "RIFF", build: "1.0.0" } }));
  return preparado;
}

export async function vincularApple() {
  const mk = await preparado;
  const usuarioToken = await mk.authorize();
  if (!usuarioToken) throw new Error("No diste permiso en Apple Music");
  const leer = (ruta) =>
    fetch("https://api.music.apple.com" + ruta, { headers: { Authorization: "Bearer " + token, "Music-User-Token": usuarioToken } })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] }));
  const [rotacion, recientes] = await Promise.all([leer("/v1/me/history/heavy-rotation?limit=20"), leer("/v1/me/recent/played?limit=30")]);
  const items = [...(rotacion.data || []), ...(recientes.data || [])].map((x) => x.attributes || {});
  const artistas = new Map();
  const conteo = {};
  items.forEach((a) => {
    const nombre = (a.artistName || a.curatorName || "").split(/,| & /)[0].trim();
    if (nombre && !artistas.has(nombre)) artistas.set(nombre, a.artwork?.url ? a.artwork.url.replace("{w}", "300").replace("{h}", "300") : "");
    (a.genreNames || []).forEach((g) => { const m = MAPA.find(([re]) => re.test(g.toLowerCase())); if (m) conteo[m[1]] = (conteo[m[1]] || 0) + 1; });
  });
  if (!artistas.size) throw new Error("Tu Apple Music aún no tiene historial de escucha. Elige tus géneros a mano.");
  const lista = [...artistas.entries()];
  return {
    usuario: "Apple Music", premium: false,
    artistas: lista.slice(0, 5).map(([nombre, imagen]) => ({ nombre, imagen })),
    todos: lista.map(([nombre]) => nombre),
    generos: Object.entries(conteo).sort((a, b) => b[1] - a[1]).map(([g]) => g).slice(0, 6),
  };
}
