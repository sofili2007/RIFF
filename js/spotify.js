// RIFF · spotify.js
// Vincula la cuenta de Spotify de verdad (OAuth con PKCE, sin servidor):
// 1) iniciarSpotify() lleva a la persona a accounts.spotify.com para dar permiso.
// 2) Spotify la devuelve a pages/spotify-importando.html?code=...
// 3) importarSpotify(code) cambia el código por un token y lee sus artistas más escuchados.
// Solo se pide permiso de lectura (user-top-read). El token no se guarda en la base de datos.

import { SPOTIFY_CLIENT_ID } from "./config.js";

const REDIRECCION = location.origin + "/pages/spotify-importando.html";
export const spotifyListo = () => Boolean(SPOTIFY_CLIENT_ID);

const base64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function iniciarSpotify(desde = "") {
  const verificador = base64url(crypto.getRandomValues(new Uint8Array(48)));
  const reto = base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificador)));
  sessionStorage.setItem("riff_spotify_verificador", verificador);
  sessionStorage.setItem("riff_spotify_desde", desde);
  const p = new URLSearchParams({
    response_type: "code", client_id: SPOTIFY_CLIENT_ID, scope: "user-top-read",
    redirect_uri: REDIRECCION, code_challenge_method: "S256", code_challenge: reto, show_dialog: "true",
  });
  location.href = "https://accounts.spotify.com/authorize?" + p;
}

// Géneros de Spotify (en inglés y muy específicos) -> géneros de RIFF
export const MAPA = [
  [/reggaeton|reggaetón|urbano latino|perreo|música urbana/, "Reggaetón"], [/trap latino|latin trap/, "Trap latino"],
  [/trap argentino|argentine trap|rkt/, "Trap argentino"], [/hip hop|hip-hop/, "Hip hop"], [/rap/, "Rap"],
  [/latin pop|pop latino|latin/, "Pop latino"], [/house/, "House"], [/techno|edm|electro|electronic|electrónica|dance/, "Electrónica"],
  [/salsa|son cubano|timba|tropical/, "Salsa"], [/cumbia|champeta|vallenato/, "Cumbia"], [/metal/, "Metal"], [/rock|punk|grunge/, "Rock"],
  [/indie|alternative|alternativ/, "Indie"], [/jazz|bossa/, "Jazz"], [/classical|orchestra|cl[aá]sica|opera|ópera/, "Clásica"], [/urban|urbano/, "Urbano"],
];

export async function importarSpotify(code) {
  const token = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECCION, client_id: SPOTIFY_CLIENT_ID,
      code_verifier: sessionStorage.getItem("riff_spotify_verificador") || "" }),
  }).then((r) => r.json());
  if (!token.access_token) throw new Error(token.error_description || "Spotify no dio permiso");
  const leer = (url) => fetch("https://api.spotify.com/v1/" + url, { headers: { Authorization: "Bearer " + token.access_token } }).then((r) => {
    if (!r.ok) throw new Error(r.status === 403 ? "Tu cuenta de Spotify aún no está autorizada en la app de RIFF" : "Spotify respondió " + r.status);
    return r.json();
  });
  const [yo, top] = await Promise.all([leer("me"), leer("me/top/artists?limit=30&time_range=medium_term")]);
  let artistas = top.items || [];
  if (!artistas.length) artistas = (await leer("me/top/artists?limit=30&time_range=long_term")).items || [];
  const conteo = {};
  artistas.forEach((a) => (a.genres || []).forEach((g) => { const m = MAPA.find(([re]) => re.test(g.toLowerCase())); if (m) conteo[m[1]] = (conteo[m[1]] || 0) + 1; }));
  const generos = Object.entries(conteo).sort((a, b) => b[1] - a[1]).map(([g]) => g).slice(0, 6);
  return {
    usuario: yo.display_name || yo.id, premium: yo.product === "premium",
    artistas: artistas.slice(0, 5).map((a) => ({ nombre: a.name, imagen: a.images?.[a.images.length > 1 ? 1 : 0]?.url || "" })),
    todos: artistas.map((a) => a.name), generos,
  };
}

// Pinta en "vinculado con Spotify" los artistas y géneros reales
export function pintarVinculado(pantalla, datos, chipNuevo) {
  const tarjeta = pantalla.querySelector(".tarjeta");
  const linea = tarjeta?.querySelector(".p12");
  if (linea) linea.textContent = datos.usuario + (datos.premium ? " · Premium" : "");
  const fila = pantalla.querySelector(".fila.entre.mt12");
  if (fila) fila.innerHTML = datos.artistas.map((a) => {
    const iniciales = a.nombre.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
    const foto = a.imagen ? `background:url('${a.imagen}') center/cover` : "background:linear-gradient(135deg,#cb6e74,#2a1029)";
    return `<div class="pila g6" style="align-items:center;width:62px"><span class="avatar" style="${foto}">${a.imagen ? "" : iniciales}</span><span class="p12 suave elipsis" style="max-width:62px">${a.nombre.replace(/</g, "&lt;")}</span></div>`;
  }).join("");
  const chips = pantalla.querySelector(".chips");
  if (chips) {
    chips.innerHTML = "";
    const lista = datos.generos.length ? datos.generos : ["Pop latino"];
    lista.forEach((g) => chips.appendChild(chipNuevo(g, true)));
  }
}
