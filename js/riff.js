// RIFF · riff.js
// Conecta cada pantalla con la base de datos (Supabase): cuentas, gustos,
// presupuesto, eventos, búsqueda, guardados, calendario, mapa, notificaciones
// y el flujo completo de organizadores. Cada pantalla tiene su función abajo,
// buscada por el id de su <section class="pantalla">.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const enPages = location.pathname.includes("/pages/");
const raiz = enPages ? "../" : "";
const pg = enPages ? "" : "pages/"; // prefijo para ir a una pantalla
const params = new URLSearchParams(location.search);
const pantalla = document.querySelector("section.pantalla");
const $ = (sel, base = document) => base.querySelector(sel);
const $$ = (sel, base = document) => [...base.querySelectorAll(sel)];
const ir = (pagina) => (location.href = pg + pagina);
const BOGOTA = { lat: 4.6533, lng: -74.0836 };

// ---------- íconos propios (para no depender del sprite de cada página) ----------
const ICONOS = {
  bookmark: '<path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>',
  calendar: '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  locate: '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
};
const ic = (nombre, clase = "s18", relleno = false) =>
  `<svg class="ic ${clase}${relleno ? " relleno" : ""}" viewBox="0 0 24 24" fill="${relleno ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre]}</svg>`;

// ---------- formatos ----------
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const zona = { timeZone: "America/Bogota" };
const fDia = (d) => new Date(d).toLocaleDateString("es-CO", { ...zona, weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "").replace(",", "");
const fHora = (d) => new Date(d).toLocaleTimeString("es-CO", { ...zona, hour: "numeric", minute: "2-digit" }).replace(/\s/g, " ").replace("a. m.", "a. m.").replace("p. m.", "p. m.");
const anioDistinto = (d) => new Date(d).getFullYear() !== new Date().getFullYear();
function fFecha(ev) {
  const anio = anioDistinto(ev.fecha) ? " " + new Date(ev.fecha).getFullYear() : "";
  if (ev.fecha_fin) return `${fDia(ev.fecha)} – ${fDia(ev.fecha_fin)}${anioDistinto(ev.fecha_fin) ? " " + new Date(ev.fecha_fin).getFullYear() : ""}`;
  return `${fDia(ev.fecha)}${anio} · ${fHora(ev.fecha)}`;
}
const pesos = (n) => "$" + Number(n).toLocaleString("es-CO");
function fPrecio(ev) {
  if (ev.precio_desde == null) return "Precios en la página oficial";
  if (ev.precio_desde === 0 && !ev.precio_hasta) return "Gratis";
  if (ev.precio_hasta && ev.precio_hasta !== ev.precio_desde) return `${pesos(ev.precio_desde)} – ${pesos(ev.precio_hasta)}`;
  return pesos(ev.precio_desde);
}
const fDesde = (ev) => (ev.precio_desde == null ? "Ver precios" : ev.precio_desde === 0 ? "Gratis" : "desde " + pesos(ev.precio_desde));
const imagen = (ruta) => (!ruta ? raiz + "assets/mapa-bogota.jpg" : /^https?:/.test(ruta) ? ruta : raiz + ruta);
const linkEvento = (ev) => `${pg}evento.html?id=${ev.id}`;
const corto = (venue) => venue.replace("Teatro Jorge Eliécer Gaitán", "Teatro Gaitán").replace("Teatro Mayor Julio Mario Santo Domingo", "Teatro Mayor JMSD").replace(" Distrito Cultural", "");

// ---------- ubicación y distancia ----------
function miUbicacion() {
  try { const u = JSON.parse(localStorage.getItem("riff_ubicacion")); if (u) return u; } catch {}
  return null;
}
function pedirUbicacion() {
  return new Promise((ok) => {
    if (!navigator.geolocation) return ok(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { const u = { lat: p.coords.latitude, lng: p.coords.longitude }; try { localStorage.setItem("riff_ubicacion", JSON.stringify(u)); } catch {} ok(u); },
      () => ok(null), { timeout: 8000, maximumAge: 600000 });
  });
}
function km(ev) {
  if (ev.lat == null) return null;
  const a = miUbicacion() || BOGOTA, R = 6371, r = Math.PI / 180;
  const dLat = (ev.lat - a.lat) * r, dLng = (ev.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(ev.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fKm = (ev) => { if (!miUbicacion()) return ""; const d = km(ev); return d == null ? "" : `a ${d.toLocaleString("es-CO", { maximumFractionDigits: 1 })} km`; };

// ---------- sesión y datos ----------
let _perfil;
async function usuario() { const { data } = await sb.auth.getSession(); return data.session?.user || null; }
async function perfil() {
  if (_perfil !== undefined) return _perfil;
  const u = await usuario();
  if (!u) return (_perfil = null);
  const { data } = await sb.from("perfiles").select("*").eq("id", u.id).maybeSingle();
  return (_perfil = data);
}
async function guardarPerfil(cambios) {
  const u = await usuario(); if (!u) return;
  const { error } = await sb.from("perfiles").update(cambios).eq("id", u.id);
  if (error) aviso("No pudimos guardar: " + error.message);
  _perfil = undefined;
}
async function exigirSesion(destino = "selecciona-perfil.html") {
  const u = await usuario();
  if (!u) { ir(destino); throw new Error("sin sesión"); }
  return u;
}
let _eventos;
async function eventos() {
  if (_eventos) return _eventos;
  const { data, error } = await sb.from("eventos").select("*").eq("estado", "publicado").order("fecha");
  if (error) { aviso("No pudimos cargar los eventos. Revisa tu conexión."); return []; }
  const ahora = Date.now();
  return (_eventos = data.filter((e) => new Date(e.fecha_fin || e.fecha).getTime() > ahora - 3 * 3600e3));
}
async function evento(id) {
  const { data } = await sb.from("eventos").select("*").eq("id", id).maybeSingle();
  return data;
}
let _guardados;
async function guardados() {
  if (_guardados) return _guardados;
  const u = await usuario(); if (!u) return (_guardados = []);
  const { data } = await sb.from("guardados").select("*, eventos(*)").eq("usuario_id", u.id);
  return (_guardados = (data || []).filter((g) => g.eventos).sort((a, b) => new Date(a.eventos.fecha) - new Date(b.eventos.fecha)));
}
async function estaGuardado(id) { return (await guardados()).some((g) => g.evento_id == id); }
async function guardar(id) {
  const u = await usuario();
  if (!u) { ir("crear-cuenta.html"); return false; }
  const { error } = await sb.from("guardados").upsert({ usuario_id: u.id, evento_id: id }, { onConflict: "usuario_id,evento_id", ignoreDuplicates: true });
  if (error) { aviso("No pudimos guardar el evento"); return false; }
  sb.from("metricas").insert({ evento_id: id, tipo: "guardado" }).then(() => {});
  _guardados = undefined;
  return true;
}
async function quitarGuardado(id) {
  const u = await usuario(); if (!u) return;
  await sb.from("guardados").delete().eq("usuario_id", u.id).eq("evento_id", id);
  _guardados = undefined;
}
const metrica = (id, tipo) => sb.from("metricas").insert({ evento_id: id, tipo }).then(() => {});

// ---------- piezas de interfaz ----------
function aviso(texto, accion) {
  $(".aviso-flotante")?.remove();
  const div = document.createElement("div");
  div.className = "toast aviso-flotante";
  div.innerHTML = `<span class="check-redondo" style="width:28px;height:28px">${ic("check", "s16")}</span><p class="p14 flex1">${esc(texto)}</p>`;
  if (accion) {
    const b = document.createElement("span");
    b.className = "enlace"; b.textContent = accion.texto; b.onclick = () => { div.remove(); accion.hacer(); };
    div.appendChild(b);
  }
  (pantalla || document.body).appendChild(div);
  setTimeout(() => div.remove(), accion ? 6000 : 3500);
}
function alerta({ titulo, texto, cancelar = "Cancelar", aceptar = "Aceptar", clase = "rosa", top = 300 }) {
  return new Promise((ok) => {
    const velo = document.createElement("div"); velo.className = "velo";
    const al = document.createElement("div"); al.className = "alerta"; al.style.top = top + "px";
    al.innerHTML = `<div class="cuerpo-alerta"><p class="t">${esc(titulo)}</p><p class="d">${esc(texto)}</p></div>
      <div class="acciones"><button data-r="no">${esc(cancelar)}</button><button class="${clase}" data-r="si">${esc(aceptar)}</button></div>`;
    const cerrar = (r) => { velo.remove(); al.remove(); ok(r); };
    al.onclick = (e) => { const b = e.target.closest("[data-r]"); if (b) cerrar(b.dataset.r === "si"); };
    velo.onclick = () => cerrar(false);
    pantalla.append(velo, al);
  });
}
function hojaOpciones(titulo, opciones, actual) {
  return new Promise((ok) => {
    const velo = document.createElement("div"); velo.className = "velo";
    const hoja = document.createElement("div"); hoja.className = "hoja-acciones";
    hoja.innerHTML = `<div class="grupo"><div class="encabezado">${esc(titulo)}</div>${opciones
      .map((o) => `<button data-o="${esc(o)}" ${o === actual ? 'style="color:var(--primario);font-weight:600"' : ""}>${esc(o)}${o === actual ? " " + ic("check") : ""}</button>`)
      .join("")}</div><button class="cancelar">Cancelar</button>`;
    const cerrar = (r) => { velo.remove(); hoja.remove(); ok(r); };
    hoja.onclick = (e) => { const b = e.target.closest("button"); if (b) cerrar(b.dataset.o || null); };
    velo.onclick = () => cerrar(null);
    pantalla.append(velo, hoja);
  });
}
// Convierte un campo del diseño (label + caja falsa) en un campo de texto real
function campoReal(campo, { tipo = "text", nombre, placeholder = "", valor = "", area = false, autocomplete } = {}) {
  if (!campo) return null;
  if (campo.tagName === "A") {
    const div = document.createElement("div");
    div.className = campo.className; div.innerHTML = campo.innerHTML; campo.replaceWith(div); campo = div;
  }
  let caja = $(".caja", campo);
  if (!caja) { caja = document.createElement("div"); caja.className = "caja"; campo.appendChild(caja); }
  caja.classList.remove("foco", "error");
  caja.innerHTML = "";
  const input = document.createElement(area ? "textarea" : "input");
  if (!area) input.type = tipo;
  input.name = nombre || ""; input.placeholder = placeholder; input.value = valor ?? "";
  if (autocomplete) input.autocomplete = autocomplete;
  caja.appendChild(input);
  let ayuda = $(".ayuda", campo);
  if (ayuda && ayuda.querySelector(".punto")) ayuda.remove(), (ayuda = null);
  input.ayudaOriginal = ayuda?.textContent || "";
  input.campo = campo;
  return input;
}
function errorCampo(input, mensaje) {
  const caja = input.closest(".caja");
  let ayuda = $(".ayuda", input.campo);
  if (mensaje) {
    caja.classList.add("error");
    if (!ayuda) { ayuda = document.createElement("p"); ayuda.className = "ayuda"; input.campo.appendChild(ayuda); }
    ayuda.classList.add("error-texto"); ayuda.innerHTML = `<i class="punto"></i>${esc(mensaje)}`;
  } else {
    caja.classList.remove("error");
    if (ayuda) { ayuda.classList.remove("error-texto"); ayuda.textContent = input.ayudaOriginal; if (!input.ayudaOriginal) ayuda.remove(); }
  }
}
function nuevoCampo(antesDe, etiqueta) {
  const c = document.createElement("div");
  c.className = "campo";
  c.innerHTML = `<label>${esc(etiqueta)}</label><div class="caja"></div>`;
  antesDe.parentNode.insertBefore(c, antesDe);
  return c;
}
const correoValido = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.trim());
function botonReal(el) { // <a class="boton"> o <button class="boton deshabilitado"> -> botón controlable
  const b = document.createElement("button");
  b.className = el.className.replace("deshabilitado", "primario"); b.innerHTML = el.innerHTML; b.type = "button";
  if (el.getAttribute("style")) b.setAttribute("style", el.getAttribute("style"));
  el.replaceWith(b); return b;
}
const habilitar = (b, si) => { b.disabled = !si; b.classList.toggle("deshabilitado", !si); b.classList.toggle("primario", si); };
const textoChip = (chip) => chip.textContent.trim();
// Chips de selección única dentro de un contenedor
function chipsUnicos(contenedor, alCambiar) {
  contenedor.setAttribute("data-riff", "");
  contenedor.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip, .segmentado > *"); if (!chip) return;
    $$(".chip, :scope > *", contenedor).forEach((c) => c.classList.remove("sel", "peligro"));
    chip.classList.add("sel"); alCambiar?.(textoChip(chip));
  });
}
function marcarChips(contenedor, valores) {
  $$(".chip", contenedor).forEach((c) => c.classList.toggle("sel", valores.includes(textoChip(c))));
}
function chipNuevo(texto, sel = false, extraClase = "") {
  const s = document.createElement("span");
  s.className = `chip ${extraClase}${sel ? " sel" : ""}`;
  s.setAttribute("data-alternar", "");
  s.innerHTML = `<svg class="ic s16 marca" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">${ICONOS.check}</svg>${esc(texto)}`;
  return s;
}

// Tarjetas y filas de eventos (con la misma estructura del diseño)
function tarjetaEvento(ev, guardado) {
  return `<a class="card-evento" href="${linkEvento(ev)}">
    <div class="portada" style="background-image:url('${imagen(ev.portada)}')">
      <button class="guardar${guardado ? " rosa" : ""}" data-guardar="${ev.id}" aria-label="Guardar">${ic("bookmark", "s18", guardado)}</button></div>
    <div class="info"><h3 class="titulo">${esc(ev.titulo)}</h3>
      <p class="meta">${ic("calendar", "s16")}<span>${esc(fFecha(ev))}</span></p>
      <div class="fila entre g8"><p class="meta flex1">${ic("pin", "s16")}<span>${esc(corto(ev.venue))}</span></p><span class="precio">${esc(ev.precio_desde == null ? "" : fPrecio(ev))}</span></div></div></a>`;
}
function filaEvento(ev, guardado, conMarcador = true) {
  return `<a class="fila-evento" href="${linkEvento(ev)}">
    <div class="miniatura" style="background-image:url('${imagen(ev.portada)}')"></div>
    <div class="flex1" style="min-width:0"><h3 class="titulo elipsis">${esc(ev.titulo)}</h3>
      <p class="linea elipsis">${esc(corto(ev.venue))}${fKm(ev) ? " · " + fKm(ev) : ""}</p>
      <div class="fila g8"><span class="linea elipsis flex1">${esc(fFecha(ev))}</span><span class="precio" style="font-size:13px">${esc(fDesde(ev))}</span></div></div>
    ${conMarcador ? `<button class="marcador${guardado ? "" : " vacio"}" data-guardar="${ev.id}" aria-label="Guardar">${ic("bookmark", "s22", guardado)}</button>` : ""}</a>`;
}
// Botones de guardar dentro de tarjetas: guardan sin entrar al detalle
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-guardar]"); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const id = Number(b.dataset.guardar);
  const lleno = b.classList.contains("rosa") || (b.classList.contains("marcador") && !b.classList.contains("vacio"));
  if (lleno) {
    await quitarGuardado(id);
    pintarMarcador(b, false);
    aviso("Quitado de tus guardados", { texto: "Deshacer", hacer: async () => { await guardar(id); pintarMarcador(b, true); } });
  } else if (await guardar(id)) {
    pintarMarcador(b, true);
    aviso("Guardado en tu calendario", { texto: "Ver", hacer: () => ir("guardado.html?id=" + id) });
  }
  b.dispatchEvent(new CustomEvent("riff:guardado", { bubbles: true }));
}, true);
function pintarMarcador(b, lleno) {
  if (b.classList.contains("guardar")) b.classList.toggle("rosa", lleno);
  else b.classList.toggle("vacio", !lleno);
  b.innerHTML = ic("bookmark", b.classList.contains("guardar") ? "s18" : "s22", lleno);
}

function presupuestoDe(p) {
  if (!p || (p.presupuesto_min == null && p.presupuesto_max == null)) return null;
  return { min: p.presupuesto_min ?? 0, max: p.presupuesto_max };
}
function fRango(p) {
  const r = presupuestoDe(p);
  if (!r) return "Sin definir";
  if (r.max == null) return r.min ? `desde ${pesos(r.min)}` : "Sin límite";
  if (r.max === 0) return "Solo gratis";
  return `${pesos(r.min)} – ${pesos(r.max)}`;
}
function dentroDelPresupuesto(ev, p) {
  const r = presupuestoDe(p); if (!r || ev.precio_desde == null) return null;
  return ev.precio_desde >= r.min && (r.max == null || ev.precio_desde <= r.max);
}

// =====================================================================
// PANTALLAS
// =====================================================================
const pantallas = {};

// ---------- splash ----------
pantallas["splash-entrada"] = pantallas["splash"] = async () => {
  const destino = pantalla.dataset.auto?.split(",")[0];
  const [u] = await Promise.all([usuario(), new Promise((r) => setTimeout(r, 1200))]);
  if (!u) return (location.href = destino);
  const p = await perfil();
  ir(p?.rol === "organizador" ? "org-panel.html" : "feed.html");
};
pantallas["selecciona-perfil"] = async () => {
  const u = await usuario(); if (!u) return;
  const p = await perfil();
  const nota = document.createElement("p");
  nota.className = "p14 suave centro mt24";
  nota.innerHTML = `Ya iniciaste sesión como ${esc(p?.correo || u.email)}. <a class="enlace" href="${p?.rol === "organizador" ? "org-panel.html" : "feed.html"}">Continuar</a>`;
  $(".pila", pantalla).after(nota);
};

// ---------- crear cuenta e iniciar sesión (público y organizador) ----------
async function formularioCuenta({ organizador }) {
  const contenido = $(".contenido", pantalla);
  const campos = $$(".campo", contenido);
  let nombre, apellido, tipo = "venue";
  if (organizador) {
    nombre = campoReal(campos[0], { nombre: "nombre", placeholder: "Ej. Bambulé", autocomplete: "organization" });
  } else {
    nombre = campoReal(campos[0], { nombre: "nombre", placeholder: "Tu nombre", autocomplete: "given-name" });
    apellido = campoReal(campos[1], { nombre: "apellido", placeholder: "Tu apellido", autocomplete: "family-name" });
  }
  const campoCorreo = organizador ? campos[1] : campos[2];
  $("label", campoCorreo).textContent = "Correo";
  const correo = campoReal(campoCorreo, { tipo: "email", nombre: "correo", placeholder: "tu@correo.com", autocomplete: "email" });
  const botonViejo = $(".boton", contenido);
  const clave = campoReal(nuevoCampo(organizador ? $$(".campo", contenido)[2] : botonViejo, "Contraseña"), { tipo: "password", nombre: "clave", placeholder: "Mínimo 6 caracteres", autocomplete: "new-password" });
  if (organizador) {
    const seg = $(".segmentado", contenido);
    chipsUnicos(seg, (t) => (tipo = t.toLowerCase()));
  }
  const boton = botonReal(botonViejo);
  const validar = () => {
    const ok = nombre.value.trim() && (organizador || apellido.value.trim()) && correoValido(correo.value) && clave.value.length >= 6;
    habilitar(boton, !!ok); return ok;
  };
  [nombre, apellido, correo, clave].filter(Boolean).forEach((i) => i.addEventListener("input", () => { errorCampo(i, ""); validar(); }));
  correo.addEventListener("blur", () => correo.value && !correoValido(correo.value) && errorCampo(correo, "Revisa el correo. Ejemplo: laura@correo.com"));
  clave.addEventListener("blur", () => clave.value && clave.value.length < 6 && errorCampo(clave, "La contraseña necesita al menos 6 caracteres"));
  validar();
  boton.onclick = async () => {
    if (!validar()) return;
    boton.classList.add("cargando");
    const { data, error } = await sb.auth.signUp({
      email: correo.value.trim(), password: clave.value,
      options: { data: { nombre: nombre.value.trim(), apellido: apellido?.value.trim() || "", rol: organizador ? "organizador" : "publico", tipo } },
    });
    boton.classList.remove("cargando");
    if (error) return errorCampo(/registered|already/i.test(error.message) ? correo : clave, /registered|already/i.test(error.message) ? "Ya existe una cuenta con este correo. Inicia sesión." : error.message);
    if (!data.session) { // por si la confirmación por correo sigue activa
      aviso("Revisa tu correo para confirmar la cuenta"); return setTimeout(() => ir((organizador ? "org-" : "") + "iniciar-sesion.html?nuevo=1"), 2000);
    }
    ir(organizador ? "org-verificacion.html" : "vincular-gustos.html");
  };
}
pantallas["crear-cuenta"] = () => formularioCuenta({ organizador: false });
pantallas["org-crear-cuenta"] = () => formularioCuenta({ organizador: true });
pantallas["crear-cuenta-valido"] = () => ir("crear-cuenta.html");
pantallas["org-crear-cuenta-valido"] = () => ir("org-crear-cuenta.html");

async function formularioIngreso({ organizador }) {
  const contenido = $(".contenido", pantalla);
  const aviso1 = $(".tarjeta.borde-rosa", contenido);
  if (aviso1 && !params.has("nuevo")) aviso1.remove();
  const sub = $("p.cuerpo", contenido);
  if (sub && !organizador) sub.textContent = "Entra con tu correo y tu contraseña.";
  const campo = $(".campo", contenido);
  $("label", campo).textContent = "Correo";
  const correo = campoReal(campo, { tipo: "email", nombre: "correo", placeholder: "tu@correo.com", autocomplete: "email" });
  $(".ayuda", campo)?.remove(); correo.ayudaOriginal = "";
  const boton = botonReal($(".boton", contenido));
  const clave = campoReal(nuevoCampo(boton, "Contraseña"), { tipo: "password", nombre: "clave", placeholder: "Tu contraseña", autocomplete: "current-password" });
  const validar = () => { const ok = correoValido(correo.value) && clave.value.length >= 6; habilitar(boton, ok); return ok; };
  [correo, clave].forEach((i) => i.addEventListener("input", () => { errorCampo(i, ""); validar(); }));
  clave.addEventListener("keydown", (e) => e.key === "Enter" && boton.click());
  validar();
  boton.onclick = async () => {
    if (!validar()) return;
    boton.classList.add("cargando");
    const { error } = await sb.auth.signInWithPassword({ email: correo.value.trim(), password: clave.value });
    boton.classList.remove("cargando");
    if (error) return errorCampo(clave, "Correo o contraseña incorrectos");
    _perfil = undefined;
    const p = await perfil();
    if (p?.rol === "organizador") return ir("org-panel.html");
    if (organizador) aviso("Esta cuenta es de público, te llevamos a tu feed");
    ir(p?.generos?.length ? "feed.html" : "vincular-gustos.html");
  };
}
pantallas["iniciar-sesion"] = () => formularioIngreso({ organizador: false });
pantallas["org-iniciar-sesion"] = () => formularioIngreso({ organizador: true });

// ---------- gustos ----------
const GENEROS = ["Trap latino", "Reggaetón", "Urbano", "Trap argentino", "Rap", "Hip hop", "Pop latino", "Electrónica", "House", "Salsa", "Rock", "Metal", "Cumbia", "Indie", "Jazz", "Clásica"];
pantallas["gustos-manual"] = async () => {
  await exigirSesion();
  const p = await perfil();
  const chips = $(".chips", pantalla);
  chips.innerHTML = "";
  GENEROS.forEach((g) => chips.appendChild(chipNuevo(g, p?.generos?.includes(g))));
  const [continuar, omitir] = $$(".pie .boton", pantalla);
  const desdePerfil = params.get("desde") === "perfil";
  if (desdePerfil) { continuar.textContent = "Guardar cambios"; omitir.textContent = "Cancelar"; omitir.href = "perfil.html"; }
  continuar.onclick = async (e) => {
    e.preventDefault();
    const sel = $$(".chip.sel", chips).map(textoChip);
    if (!sel.length) return aviso("Elige al menos un género");
    await guardarPerfil({ generos: sel });
    ir(desdePerfil ? "perfil.html" : "presupuesto.html");
  };
};
async function vinculado(servicio) {
  await exigirSesion();
  const artistas = $$(".avatar + .p12", pantalla).map((s) => s.textContent.trim());
  const chips = $(".chips", pantalla);
  const p = await perfil();
  const nombre = $(".p12.suave", $(".tarjeta", pantalla));
  if (nombre && p) nombre.textContent = (p.nombre || p.correo) + " · cuenta vinculada";
  await guardarPerfil({ cuenta_musica: servicio, artistas });
  $(".pie .boton", pantalla).onclick = async (e) => {
    e.preventDefault();
    const sel = $$(".chip.sel", chips).map(textoChip);
    if (!sel.length) return aviso("Deja al menos un género");
    await guardarPerfil({ generos: sel });
    ir(params.get("desde") === "perfil" ? "perfil.html" : "presupuesto.html");
  };
}
pantallas["vinculado-spotify"] = () => vinculado("spotify");
pantallas["vinculado-apple-music"] = () => vinculado("apple music");
pantallas["vincular-gustos"] = () => exigirSesion();

// ---------- presupuesto ----------
const RANGOS = { "Gratis": [0, 0], "Hasta 50 mil": [0, 50000], "50 – 150 mil": [50000, 150000], "150 – 300 mil": [150000, 300000], "Sin límite": [0, null] };
async function pantallaPresupuesto({ alGuardar }) {
  await exigirSesion();
  const p = await perfil();
  const chips = $(".chips", pantalla);
  const etiqueta = $(".cuerpo-b", pantalla);
  const lleno = $(".rango .lleno", pantalla), perillas = $$(".rango .perilla", pantalla);
  let elegido = p?.presupuesto_etiqueta || null;
  const pintar = (t) => {
    const [min, max] = RANGOS[t] || [0, null];
    etiqueta.textContent = t === "Gratis" ? "Solo eventos gratis" : max == null ? "Sin límite de presupuesto" : `${pesos(min)} – ${pesos(max)}`;
    const a = (min / 300000) * 100, b = max == null ? 100 : (max / 300000) * 100;
    lleno.style.left = a + "%"; lleno.style.width = Math.max(b - a, 2) + "%";
    perillas[0].style.left = a + "%"; perillas[1].style.left = b + "%";
  };
  chipsUnicos(chips, (t) => { elegido = t; pintar(t); });
  $$(".chip", chips).forEach((c) => c.classList.toggle("sel", textoChip(c) === elegido));
  if (elegido) pintar(elegido);
  const [principal, secundario] = $$(".pie .boton", pantalla);
  principal.setAttribute("data-riff", "");
  principal.onclick = async (e) => {
    e.preventDefault();
    if (elegido) { const [min, max] = RANGOS[elegido]; await guardarPerfil({ presupuesto_min: min, presupuesto_max: max, presupuesto_etiqueta: elegido }); }
    alGuardar();
  };
  return secundario;
}
pantallas["presupuesto"] = () => pantallaPresupuesto({ alGuardar: () => ir("tutorial-1.html") });
pantallas["perfil-presupuesto"] = async () => {
  const cancelar = await pantallaPresupuesto({ alGuardar: () => ir("perfil.html") });
  cancelar.setAttribute("data-riff", ""); cancelar.onclick = () => ir("perfil.html");
};
pantallas["tutorial-3"] = async () => { if (await usuario()) guardarPerfil({ tutorial_visto: true }); };

// ---------- feed ----------
pantallas["feed"] = async () => {
  const [p, evs, gs] = await Promise.all([perfil(), eventos(), guardados()]);
  const saludo = $(".contenido .p14.suave", pantalla);
  if (saludo) saludo.textContent = p ? `hola, ${(p.nombre || "").toLowerCase() || "de nuevo"}` : "hola";
  const guardadosIds = new Set(gs.map((g) => g.evento_id));
  const carruseles = $$(".carrusel", pantalla), titulos = $$("h2.h3", pantalla);
  const gustos = p?.generos || [];
  const puntaje = (e) => e.generos.filter((g) => gustos.includes(g)).length;
  let recomendados = gustos.length ? evs.filter((e) => puntaje(e) > 0).sort((a, b) => puntaje(b) - puntaje(a) || new Date(a.fecha) - new Date(b.fecha)) : [];
  if (!recomendados.length) recomendados = evs.slice(0, 6);
  const cerca = [...evs].sort((a, b) => (km(a) ?? 99) - (km(b) ?? 99)).slice(0, 8);
  const semana = evs.filter((e) => new Date(e.fecha) - Date.now() < 7 * 864e5);
  const pintar = (i, lista) => (carruseles[i].innerHTML = lista.map((e) => tarjetaEvento(e, guardadosIds.has(e.id))).join("") || `<p class="p14 suave">No hay eventos por ahora.</p>`);
  pintar(0, recomendados); pintar(1, cerca);
  if (semana.length) pintar(2, semana); else { titulos[2].textContent = "próximamente"; pintar(2, evs.slice(-6)); }
  // campana: punto solo si hay notificaciones sin leer
  const punto = $('a[href="notificaciones.html"] i', pantalla);
  if (punto) {
    punto.style.display = "none";
    const u = await usuario();
    if (u) { const { count } = await sb.from("notificaciones").select("id", { count: "exact", head: true }).eq("usuario_id", u.id).eq("leida", false); if (count) punto.style.display = ""; }
  }
  // tutorial la primera vez
  if (p && !p.tutorial_visto && !sessionStorage.getItem("riff_tutorial")) { sessionStorage.setItem("riff_tutorial", "1"); }
};
pantallas["feed-cargando"] = () => ir("feed.html");
pantallas["feed-sin-conexion"] = () => { if (navigator.onLine) ir("feed.html"); };
window.addEventListener("offline", () => aviso("Sin conexión. Mostramos lo último que cargó."));

// ---------- búsqueda ----------
function filtrar(evs, { q = "", generos = [], formatos = [], venues = [] }) {
  const t = q.trim().toLowerCase();
  return evs.filter((e) =>
    (!t || [e.titulo, e.venue, e.descripcion, ...e.generos].join(" ").toLowerCase().includes(t)) &&
    (!generos.length || e.generos.some((g) => generos.includes(g))) &&
    (!formatos.length || formatos.includes(e.formato)) &&
    (!venues.length || venues.includes(e.tipo_venue) || (venues.includes("Estadio") && e.tipo_venue === "Arena")));
}
const leerFiltros = (ps = params) => ({ q: ps.get("q") || "", generos: ps.getAll("g"), formatos: ps.getAll("f"), venues: ps.getAll("v") });
function urlResultados(f) {
  const u = new URLSearchParams();
  if (f.q) u.set("q", f.q);
  f.generos.forEach((g) => u.append("g", g)); f.formatos.forEach((x) => u.append("f", x)); f.venues.forEach((x) => u.append("v", x));
  return "resultados.html?" + u.toString();
}
async function recordarBusqueda(texto) {
  if (!texto.trim()) return;
  try { const r = JSON.parse(localStorage.getItem("riff_busquedas") || "[]").filter((x) => x !== texto); localStorage.setItem("riff_busquedas", JSON.stringify([texto, ...r].slice(0, 6))); } catch {}
  const u = await usuario(); if (u) sb.from("busquedas").insert({ usuario_id: u.id, texto }).then(() => {});
}
pantallas["busqueda-escribir"] = async () => {
  const caja = $(".busqueda", pantalla);
  caja.innerHTML = `${ic("pin", "s18").replace(ICONOS.pin, '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}<input type="search" enterkeyhint="search" placeholder="Busca un evento, artista o venue" autofocus><a class="enlace p14b" href="busqueda-filtros.html">Filtros</a>`;
  const input = $("input", caja);
  pantalla.querySelector('div[style*="height:270px"]')?.remove(); // teclado de mentira
  $(".contenido", pantalla).style.bottom = "0";
  const lista = $(".lista", pantalla), titulo = $(".contenido > p.p12", pantalla);
  const [evs, gs] = await Promise.all([eventos(), guardados()]);
  const ids = new Set(gs.map((g) => g.evento_id));
  const pintar = () => {
    const r = filtrar(evs, { q: input.value });
    titulo.textContent = input.value ? `${r.length} resultado${r.length === 1 ? "" : "s"}` : "eventos en RIFF";
    lista.innerHTML = r.map((e) => filaEvento(e, ids.has(e.id))).join("") || `<p class="p14 suave mensaje-vacio">No encontramos “${esc(input.value)}”. Prueba con un género o un venue.</p>`;
  };
  input.value = params.get("q") || "";
  input.addEventListener("input", pintar);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { recordarBusqueda(input.value); ir(urlResultados({ ...leerFiltros(new URLSearchParams()), q: input.value })); } });
  pintar(); input.focus();
};
pantallas["busqueda-filtros"] = async () => {
  const contenido = $(".contenido", pantalla);
  const busqueda = $(".busqueda", contenido);
  const ultima = (() => { try { return JSON.parse(localStorage.getItem("riff_busquedas") || "[]"); } catch { return []; } })();
  const q = params.get("q") || "";
  $("span", busqueda).textContent = q || "Busca un evento, artista o venue";
  busqueda.href = "busqueda-escribir.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  const recientes = $(".chips.carril", contenido);
  recientes.innerHTML = ultima.map((t) => `<a class="chip pequeno" style="height:40px;font-size:14px" href="${urlResultados({ q: t, generos: [], formatos: [], venues: [] })}">${esc(t)}</a>`).join("") || '<span class="p12 suave">Aún no has buscado nada</span>';
  const [gChips, fChips, vChips] = $$(".chips:not(.carril)", contenido);
  const evs = await eventos();
  const generosEnUso = [...new Set(evs.flatMap((e) => e.generos))].sort();
  gChips.innerHTML = ""; generosEnUso.forEach((g) => gChips.appendChild(chipNuevo(g)));
  fChips.innerHTML = ""; ["DJ set", "En vivo", "Acústico", "Festival", "Orquesta"].forEach((g) => fChips.appendChild(chipNuevo(g)));
  vChips.innerHTML = ""; ["Club", "Bar", "Teatro", "Al aire libre", "Estadio", "Arena"].forEach((g) => vChips.appendChild(chipNuevo(g)));
  const previos = leerFiltros();
  marcarChips(gChips, previos.generos); marcarChips(fChips, previos.formatos); marcarChips(vChips, previos.venues);
  const [limpiar, aplicar] = $$(".pie .boton", pantalla);
  const estado = () => ({ q, generos: $$(".sel", gChips).map(textoChip), formatos: $$(".sel", fChips).map(textoChip), venues: $$(".sel", vChips).map(textoChip) });
  const contar = () => { const f = estado(); const n = f.generos.length + f.formatos.length + f.venues.length; aplicar.textContent = `Aplicar filtros (${n}) · ${filtrar(evs, f).length}`; };
  contenido.addEventListener("riff:alternado", contar);
  limpiar.onclick = () => { $$(".chip.sel", contenido).forEach((c) => c.classList.remove("sel")); contar(); };
  aplicar.onclick = (e) => { e.preventDefault(); ir(urlResultados(estado())); };
  contar();
};
async function pantallaResultados() {
  const contenido = $(".contenido", pantalla);
  const f = leerFiltros();
  const [evs, gs] = await Promise.all([eventos(), guardados()]);
  const ids = new Set(gs.map((g) => g.evento_id));
  const r = filtrar(evs, f).sort((a, b) => (km(a) ?? 99) - (km(b) ?? 99));
  const activos = [...f.generos.map((x) => ["g", x]), ...f.formatos.map((x) => ["f", x]), ...f.venues.map((x) => ["v", x])];
  const sinUno = (k, v) => { const u = new URLSearchParams(location.search); const resto = u.getAll(k).filter((x) => x !== v); u.delete(k); resto.forEach((x) => u.append(k, x)); return "resultados.html?" + u; };
  const chipsHtml = activos.map(([k, v]) => `<a class="chip removible" href="${sinUno(k, v)}">${esc(v)}${ic("x", "s16")}</a>`).join("") + (f.q ? `<a class="chip removible" href="${urlResultados({ ...f, q: "" })}">“${esc(f.q)}”${ic("x", "s16")}</a>` : "");
  contenido.innerHTML = `
    <a class="busqueda" href="busqueda-escribir.html${f.q ? "?q=" + encodeURIComponent(f.q) : ""}">${ic("pin").replace(ICONOS.pin, '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>')}<span style="color:#fff" class="flex1">${esc(f.q || "Buscar eventos, artistas, venues")}</span></a>
    <div class="fila g8 mt12"><div class="chips carril flex1" style="margin:0">${chipsHtml}</div><a class="enlace p14b" href="${location.search ? "busqueda-filtros.html" + location.search : "busqueda-filtros.html"}">Filtros</a></div>
    ${r.length ? `<div class="fila entre mt24"><p class="p14b">${r.length} evento${r.length === 1 ? "" : "s"} encontrado${r.length === 1 ? "" : "s"}</p><p class="p12 suave">Más cercanos primero</p></div>
      <div class="lista mt16">${r.map((e) => filaEvento(e, ids.has(e.id))).join("")}</div>`
    : `<div class="circulo-vacio mt32">${ic("music", "s32")}</div><h2 class="h2 centro mt24">no encontramos eventos</h2>
      <p class="cuerpo suave centro mt12">Ningún evento coincide con todos tus filtros. Prueba quitar alguno.</p>
      <a class="boton primario mt24" href="resultados.html">Quitar todos los filtros</a>`}`;
  contenido.style.paddingBottom = "100px";
}
pantallas["resultados"] = pantallaResultados;
pantallas["resultados-vacio"] = pantallaResultados;
pantallas["resultados-cargando"] = () => ir("resultados.html" + location.search);

// ---------- detalle del evento ----------
const DETALLES = { "detalle-omar-courtz": "Omar Courtz", "detalle-penyair": "Penyair", "detalle-berliner": "Berliner", "detalle-el-kalvo": "El Kalvo", "detalle-slipknot": "Slipknot", "detalle-baum": "BAUM",
  "salida-omar-courtz": "Omar Courtz", "salida-penyair": "Penyair", "salida-berliner": "Berliner", "salida-el-kalvo": "El Kalvo", "salida-slipknot": "Slipknot", "salida-baum": "BAUM" };
Object.keys(DETALLES).forEach((id) => (pantallas[id] = async () => {
  const { data } = await sb.from("eventos").select("id").ilike("titulo", DETALLES[id] + "%").limit(1);
  if (data?.[0]) location.replace(pg + "evento.html?id=" + data[0].id);
}));
pantallas["detalle-compartir"] = () => ir("feed.html");
pantallas["evento"] = async () => {
  const id = Number(params.get("id"));
  const ev = id && (await evento(id));
  const contenido = $(".contenido", pantalla);
  if (!ev) { contenido.innerHTML = `<div class="mensaje-vacio" style="margin-top:140px"><h1 class="h2">evento no encontrado</h1><p class="cuerpo suave mt12">Puede que ya haya pasado o que lo hayan cancelado.</p><a class="boton primario mt24" href="feed.html">Ir al feed</a></div>`; $(".pie", pantalla)?.remove(); return; }
  document.title = "RIFF · " + ev.titulo;
  metrica(ev.id, "vista");
  const p = await perfil();
  $("div[style*='height:220px']", contenido).style.backgroundImage = `url('${imagen(ev.portada)}')`;
  $("h1", contenido).textContent = ev.titulo;
  $(".fila.g6.mt12", contenido).innerHTML = [...ev.generos.slice(0, 2).map((g) => `<span class="badge genero">${esc(g)}</span>`), `<span class="badge venue">${esc(ev.tipo_venue)}</span>`, `<span class="badge edad">${esc(ev.edad)}</span>`].join("");
  const filas = $$(".tarjeta .fila.g16", contenido);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.venue + ", " + ev.direccion + ", Bogotá")}`;
  $(".cuerpo-b", filas[0]).textContent = fFecha(ev);
  $(".p12", filas[0]).textContent = [ev.nota_fecha, ev.edad === "Todo público" ? "Todo público" : ev.edad + " años"].filter(Boolean).join(" · ");
  $(".cuerpo-b", filas[1]).textContent = ev.venue;
  $(".p12", filas[1]).innerHTML = `${esc(ev.direccion)}${fKm(ev) ? " · " + fKm(ev) : ""} · <a href="${mapsUrl}" target="_blank" rel="noopener">Ver en Google Maps</a>`;
  $(".cuerpo-b", filas[2]).textContent = fPrecio(ev);
  $(".p12", filas[2]).textContent = ev.precio_desde == null ? "Consulta localidades en la página oficial" : "Precios en COP · pueden incluir servicio";
  const filaPresupuesto = $(".fila.g8.mt16", contenido);
  const dentro = dentroDelPresupuesto(ev, p);
  if (dentro == null) filaPresupuesto.innerHTML = p ? `<a class="enlace p14b" href="perfil-presupuesto.html">Define tu presupuesto</a><span class="p12 suave">y te decimos si encaja</span>` : "";
  else filaPresupuesto.innerHTML = `<span class="badge ${dentro ? "dentro" : "fuera"}">${dentro ? "Dentro" : "Fuera"} de tu presupuesto</span><span class="p12 suave">Tu rango: ${esc(fRango(p))}</span>`;
  $("p.cuerpo", contenido).textContent = ev.descripcion;
  const [bGuardar, bCompartir, bMapa] = $$(".fila.g8.mt16 > a.boton, .fila.g8.mt16 > button.boton", contenido).length ? $$(".fila.g8.mt16 .boton", contenido) : [];
  const yaGuardado = await estaGuardado(ev.id);
  if (bGuardar) {
    bGuardar.href = "guardado.html?id=" + ev.id;
    if (yaGuardado) bGuardar.innerHTML = bGuardar.innerHTML.replace("Guardar", "Guardado"), (bGuardar.style.color = "var(--primario)");
  }
  const compartir = async (e) => {
    e.preventDefault();
    const datos = { title: ev.titulo, text: `${ev.titulo} · ${fFecha(ev)} · ${ev.venue}`, url: location.href };
    if (navigator.share) { try { await navigator.share(datos); } catch {} }
    else { try { await navigator.clipboard.writeText(location.href); aviso("Link copiado. Pégalo donde quieras."); } catch { aviso(location.href); } }
  };
  if (bCompartir) bCompartir.onclick = compartir;
  $$(".nav .der a", pantalla).forEach((a) => (a.onclick = compartir));
  if (bMapa) bMapa.href = "mapa.html?id=" + ev.id;
  const comprar = $(".pie .boton", pantalla);
  const dominio = (() => { try { return new URL(ev.venta_url).hostname.replace("www.", ""); } catch { return ""; } })();
  $(".pie p", pantalla).lastChild.textContent = ev.venta_url ? `Saldrás de RIFF hacia ${dominio} (venta oficial)` : "Este evento no tiene venta en línea";
  comprar.href = ev.venta_url || "#";
  comprar.onclick = async (e) => {
    e.preventDefault(); if (!ev.venta_url) return;
    const si = await alerta({ titulo: "¿Salir de RIFF?", texto: `Vas a abrir la página oficial de venta en ${ev.venta_nombre || dominio} (${dominio}). RIFF no procesa pagos ni guarda tus datos de compra.`, aceptar: "Abrir página" });
    if (si) { metrica(ev.id, "clic_venta"); window.open(ev.venta_url, "_blank", "noopener"); }
  };
};

// ---------- guardado y recordatorio ----------
const RECORDATORIOS = { "1 hora antes": 1, "3 horas antes": 3, "1 día antes": 24, "2 días antes": 48, "Sin recordatorio": null };
pantallas["guardado"] = async () => {
  await exigirSesion("crear-cuenta.html");
  const id = Number(params.get("id"));
  if (!id) return ir("mis-guardados.html");
  const ev = await evento(id);
  if (!ev) return ir("mis-guardados.html");
  if (!(await estaGuardado(id))) await guardar(id);
  const g = (await guardados()).find((x) => x.evento_id === id);
  const fila = $(".fila-evento", pantalla);
  fila.outerHTML = filaEvento(ev, true);
  const tarjeta = $("a.tarjeta.borde-rosa", pantalla);
  tarjeta.removeAttribute("href");
  const pintar = (rec) => {
    const horas = RECORDATORIOS[rec];
    $(".p14b", tarjeta).textContent = horas == null ? "Sin recordatorio" : "Recordatorio: " + rec;
    $(".p12", tarjeta).textContent = horas == null ? "Toca para elegir cuándo" : `${fDia(new Date(ev.fecha) - horas * 3600e3)} · ${fHora(new Date(ev.fecha) - horas * 3600e3)}`;
  };
  let actual = g?.recordatorio || "1 día antes"; pintar(actual);
  tarjeta.onclick = async () => {
    const r = await hojaOpciones("¿Cuándo te recordamos?", Object.keys(RECORDATORIOS), actual);
    if (!r) return;
    actual = r; pintar(r);
    const u = await usuario();
    await sb.from("guardados").update({ recordatorio: r }).eq("usuario_id", u.id).eq("evento_id", id);
    aviso("Recordatorio actualizado");
  };
  const deshacer = $(".toast .enlace", pantalla);
  if (deshacer) { deshacer.setAttribute("data-riff", ""); deshacer.onclick = async () => { await quitarGuardado(id); location.href = "evento.html?id=" + id; }; }
  setTimeout(() => $(".toast", pantalla)?.classList.add("oculto"), 6000);
};
pantallas["guardado-recordatorio"] = () => ir("mis-guardados.html");

// ---------- calendario y mis guardados ----------
async function pantallaCalendario() {
  await exigirSesion();
  const gs = await guardados();
  const tarjeta = $(".tarjeta.pad", pantalla) || null;
  let mes = new Date(); mes.setDate(1);
  if (params.get("mes")) { const [a, m] = params.get("mes").split("-"); mes = new Date(+a, +m - 1, 1); }
  const contenido = $(".contenido", pantalla);
  const dibujar = () => {
    const año = mes.getFullYear(), m = mes.getMonth();
    const nombreMes = mes.toLocaleDateString("es-CO", { month: "long", year: "numeric" }).replace(" de ", " ");
    const inicio = (new Date(año, m, 1).getDay() + 6) % 7, dias = new Date(año, m + 1, 0).getDate();
    const hoy = new Date();
    const porDia = {};
    gs.forEach((g) => { const d = new Date(new Date(g.eventos.fecha).toLocaleString("en-US", zona)); if (d.getFullYear() === año && d.getMonth() === m) (porDia[d.getDate()] ||= []).push(g.eventos); });
    let celdas = ["L", "M", "M", "J", "V", "S", "D"].map((x) => `<span class="cab">${x}</span>`).join("") + "<span></span>".repeat(inicio);
    for (let d = 1; d <= dias; d++) {
      const fecha = new Date(año, m, d);
      const clases = ["d", fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) ? "pasado" : "", fecha.toDateString() === hoy.toDateString() ? "hoy" : "", porDia[d] ? "marcado" : ""].join(" ");
      celdas += porDia[d] ? `<a class="${clases}" href="evento.html?id=${porDia[d][0].id}">${d}</a>` : `<span class="${clases}">${d}</span>`;
    }
    const proximos = gs.filter((g) => new Date(g.eventos.fecha_fin || g.eventos.fecha) > hoy - 3 * 3600e3);
    contenido.innerHTML = `<h1 class="h1" style="margin-top:20px">mi calendario</h1>
      <div class="tarjeta pad mt16" style="background:linear-gradient(160deg,rgba(118,91,163,.35),rgba(99,56,102,.2))">
        <div class="fila entre" style="padding:0 16px 16px"><button class="boton-circulo" data-mes="-1" aria-label="Mes anterior" style="width:36px;height:36px">‹</button><span class="h4">${esc(nombreMes)}</span><button class="boton-circulo" data-mes="1" aria-label="Mes siguiente" style="width:36px;height:36px">›</button></div>
        <div class="cal">${celdas}</div>
        <p class="p12 suave fila g6 mt12"><i style="width:10px;height:10px;border-radius:50%;background:var(--primario)"></i>Día con evento guardado · tócalo para verlo</p></div>
      ${proximos.length ? `<div class="fila entre mt24"><h2 class="h3">tus guardados</h2><a class="enlace" href="mis-guardados.html">Ver todos →</a></div>
      <div class="lista mt12" style="padding-bottom:100px">${proximos.map((g) => { const e = g.eventos, d = new Date(e.fecha);
        return `<a class="fila-evento" href="evento.html?id=${e.id}"><div class="fecha-caja"><span class="cifra32" style="font-size:28px">${d.toLocaleDateString("es-CO", { ...zona, day: "numeric" })}</span><span class="p12b">${d.toLocaleDateString("es-CO", { ...zona, month: "short" }).replace(".", "")}</span></div><div class="flex1" style="min-width:0"><p class="titulo elipsis">${esc(e.titulo)}</p><p class="linea elipsis">${esc(corto(e.venue))} · ${esc(fHora(e.fecha))}</p><p class="p12b rosa fila g4">${ic("bell", "s16")}${g.recordatorio === "Sin recordatorio" ? "Sin recordatorio" : "Recordatorio: " + esc(g.recordatorio)}</p></div></a>`; }).join("")}</div>`
      : `<div class="mensaje-vacio"><div class="circulo-vacio">${ic("calendar", "s32")}</div><h2 class="h3 mt16">aún no tienes planes</h2><p class="cuerpo suave mt8">Guarda eventos y aparecerán aquí con su recordatorio.</p><a class="boton primario mt24" href="feed.html">Explorar eventos</a></div>`}`;
    $$("[data-mes]", contenido).forEach((b) => (b.onclick = () => { mes = new Date(año, m + Number(b.dataset.mes), 1); dibujar(); }));
  };
  dibujar();
}
pantallas["calendario"] = pantallaCalendario;
pantallas["calendario-vacio"] = () => ir("calendario.html");
pantallas["mis-guardados"] = async () => {
  await exigirSesion();
  const contenido = $(".contenido", pantalla);
  const pintar = async () => {
    _guardados = undefined;
    const gs = (await guardados()).filter((g) => new Date(g.eventos.fecha_fin || g.eventos.fecha) > Date.now() - 3 * 3600e3);
    const semana = gs.filter((g) => new Date(g.eventos.fecha) - Date.now() < 7 * 864e5), luego = gs.filter((g) => !semana.includes(g));
    contenido.innerHTML = gs.length ? `<p class="p12 suave">${gs.length} evento${gs.length === 1 ? "" : "s"} guardado${gs.length === 1 ? "" : "s"} · ${semana.length} esta semana</p>
      ${semana.length ? `<h2 class="h3 mt16">esta semana</h2><div class="lista mt12">${semana.map((g) => filaEvento(g.eventos, true)).join("")}</div>` : ""}
      ${luego.length ? `<h2 class="h3 mt24">próximamente</h2><div class="lista mt12" style="padding-bottom:100px">${luego.map((g) => filaEvento(g.eventos, true)).join("")}</div>` : ""}`
      : `<div class="mensaje-vacio" style="margin-top:60px"><div class="circulo-vacio">${ic("bookmark", "s32")}</div><h2 class="h3 mt16">no tienes eventos guardados</h2><p class="cuerpo suave mt8">Toca el marcador de cualquier evento para guardarlo.</p><a class="boton primario mt24" href="feed.html">Explorar eventos</a></div>`;
  };
  contenido.addEventListener("riff:guardado", () => setTimeout(pintar, 400));
  pintar();
};

// ---------- mapa ----------
function cargarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
  return new Promise((ok, mal) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.onload = () => ok(window.L); s.onerror = mal; document.head.appendChild(s); });
}
function mapaBase(L, contenedor, centro, zoom = 12) {
  const mapa = L.map(contenedor, { zoomControl: false, attributionControl: true }).setView([centro.lat, centro.lng], zoom);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, attribution: "© OpenStreetMap · © CARTO" }).addTo(mapa);
  return mapa;
}
async function pantallaMapa() {
  $$(".mapa, .cluster, .pin, .yo, .zona, .credito-mapa, .tarjeta, .velo, .hoja, .hoja-acciones, .alerta", pantalla).forEach((el) => el.remove());
  const div = document.createElement("div"); div.className = "mapa-real"; pantalla.prepend(div);
  const hoja = document.createElement("div"); hoja.className = "hoja"; hoja.style.paddingBottom = "90px";
  pantalla.insertBefore(hoja, $(".tabs", pantalla));
  const botonYo = document.createElement("button"); botonYo.className = "boton-circulo boton-ubicacion"; botonYo.innerHTML = ic("locate", "s22"); botonYo.setAttribute("aria-label", "Mi ubicación");
  pantalla.appendChild(botonYo);
  const [L, evs, gs] = await Promise.all([cargarLeaflet(), eventos(), guardados()]);
  const ids = new Set(gs.map((g) => g.evento_id));
  const mapa = mapaBase(L, div, miUbicacion() || BOGOTA, 12);
  const marcadores = {};
  const colores = ["", "indie", "cumbia"];
  evs.filter((e) => e.lat != null).forEach((e, i) => {
    const icono = L.divIcon({ className: "pin-riff", html: `<span class="pin ${colores[i % 3]}" style="background-image:url('${imagen(e.portada)}')"></span>`, iconSize: [46, 46], iconAnchor: [23, 55] });
    marcadores[e.id] = L.marker([e.lat, e.lng], { icon: icono }).addTo(mapa).on("click", () => abrir(e));
  });
  let yo;
  const ponerYo = (u) => { if (!u) return; if (yo) yo.remove(); yo = L.marker([u.lat, u.lng], { icon: L.divIcon({ className: "yo-riff", html: '<span class="yo"></span>', iconSize: [0, 0] }), interactive: false }).addTo(mapa); };
  ponerYo(miUbicacion());
  const lista = () => {
    const ordenados = [...evs].sort((a, b) => (km(a) ?? 99) - (km(b) ?? 99));
    hoja.classList.remove("abierta");
    hoja.innerHTML = `<div class="asa"></div><h2 class="h3">${evs.length} eventos ${miUbicacion() ? "cerca de ti" : "en Bogotá"}</h2><p class="p12 suave">${miUbicacion() ? "Ordenados por distancia" : "Activa tu ubicación para ver la distancia"} · toca para ${"ver la lista"}</p><div class="lista lista-mapa oculto">${ordenados.map((e) => filaEvento(e, ids.has(e.id))).join("")}</div>`;
    hoja.onclick = (ev) => { if (ev.target.closest("a, button")) return; hoja.classList.toggle("abierta"); $(".lista-mapa", hoja).classList.toggle("oculto"); };
  };
  const abrir = (e) => {
    mapa.setView([e.lat, e.lng], Math.max(mapa.getZoom(), 14));
    hoja.onclick = null; hoja.classList.remove("abierta");
    const ruta = `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`;
    hoja.innerHTML = `<div class="asa"></div><div class="fila entre"><p class="p12 suave">${esc(fKm(e) || "Bogotá")}</p><button class="enlace p14b" data-cerrar>Ver todos</button></div>
      <div class="mt8">${filaEvento(e, ids.has(e.id))}</div>
      <div class="fila g8 mt12"><a class="boton secundario" href="${ruta}" target="_blank" rel="noopener" style="height:44px">Cómo llegar</a><a class="boton primario" href="evento.html?id=${e.id}" style="height:44px">Ver evento</a></div>`;
    $("[data-cerrar]", hoja).onclick = lista;
  };
  lista();
  botonYo.onclick = async () => { const u = await pedirUbicacion(); if (!u) return aviso("Activa la ubicación en tu navegador para verte en el mapa"); ponerYo(u); mapa.setView([u.lat, u.lng], 14); lista(); };
  const id = Number(params.get("id"));
  if (id && evs.find((e) => e.id === id)) abrir(evs.find((e) => e.id === id));
  else if (!miUbicacion()) pedirUbicacion().then((u) => { if (u) { ponerYo(u); lista(); } });
  setTimeout(() => mapa.invalidateSize(), 300);
}
["mapa", "mapa-lista", "mapa-pin", "mapa-hoja-completa", "mapa-cluster", "mapa-sin-ubicacion", "mapa-zona-vacia", "mapa-como-llegar"].forEach((id) => (pantallas[id] = id === "mapa" ? pantallaMapa : () => ir("mapa.html")));

// ---------- perfil ----------
async function pantallaPerfil() {
  await exigirSesion();
  const [p, gs] = await Promise.all([perfil(), guardados()]);
  if (!p) return;
  const nombre = [p.nombre, p.apellido].filter(Boolean).join(" ") || "Sin nombre";
  const avatar = $(".avatar", pantalla);
  avatar.textContent = ((p.nombre?.[0] || "") + (p.apellido?.[0] || p.correo?.[0] || "")).toUpperCase();
  const [pNombre, pCorreo] = $$(".fila.g16.mt24 .flex1 p", pantalla);
  pNombre.textContent = nombre; pCorreo.textContent = p.correo;
  const lapiz = $(".fila.g16.mt24 .boton-circulo", pantalla);
  lapiz.onclick = () => {
    const caja = $(".fila.g16.mt24 .flex1", pantalla);
    caja.innerHTML = `<div class="caja" style="min-height:44px;padding:6px 12px"><input value="${esc(p.nombre)}" placeholder="Nombre"></div><div class="caja mt8" style="min-height:44px;padding:6px 12px"><input value="${esc(p.apellido)}" placeholder="Apellido"></div>`;
    lapiz.innerHTML = ic("check", "s22");
    lapiz.onclick = async () => { const [a, b] = $$("input", caja); await guardarPerfil({ nombre: a.value.trim(), apellido: b.value.trim() }); location.reload(); };
  };
  const proximos = gs.filter((g) => new Date(g.eventos.fecha) > Date.now());
  const semana = proximos.filter((g) => new Date(g.eventos.fecha) - Date.now() < 7 * 864e5).length;
  const filas = $$(".menu-fila", pantalla);
  $(".p12", filas[0]).textContent = `${proximos.length} evento${proximos.length === 1 ? "" : "s"} · ${semana} esta semana`;
  filas[1].href = "gustos-manual.html?desde=perfil";
  $(".p12", filas[1]).textContent = p.generos.length ? p.generos.slice(0, 3).join(", ") + (p.generos.length > 3 ? ` +${p.generos.length - 3}` : "") : "Aún no los defines";
  $(".p12", filas[2]).textContent = p.presupuesto_etiqueta ? fRango(p) + " por evento" : "Sin definir";
  filas[3].href = p.cuenta_musica === "spotify" ? "vinculado-spotify.html?desde=perfil" : p.cuenta_musica === "apple music" ? "vinculado-apple-music.html?desde=perfil" : "vincular-gustos.html";
  $(".p12", filas[3]).textContent = p.cuenta_musica === "ninguna" ? "Ninguna cuenta vinculada" : (p.cuenta_musica === "spotify" ? "Spotify" : "Apple Music") + " vinculado";
  if (p.cuenta_musica !== "ninguna") {
    const quitar = document.createElement("button");
    quitar.className = "enlace p12b"; quitar.style.marginRight = "8px"; quitar.textContent = "Desvincular";
    quitar.onclick = async (e) => { e.preventDefault(); e.stopPropagation(); if (await alerta({ titulo: "¿Desvincular tu cuenta?", texto: "Tus gustos se quedan; solo dejamos de leer tu música.", aceptar: "Desvincular", clase: "coral" })) { await guardarPerfil({ cuenta_musica: "ninguna", artistas: [] }); location.reload(); } };
    filas[3].insertBefore(quitar, filas[3].lastElementChild);
  }
  $$(".velo, .alerta", pantalla).forEach((x) => x.remove());
  const salir = $(".boton.peligro", pantalla);
  salir.onclick = async (e) => {
    e.preventDefault();
    if (await alerta({ titulo: "¿Cerrar sesión?", texto: "Tus eventos guardados y recordatorios seguirán aquí cuando vuelvas a entrar.", aceptar: "Cerrar sesión", clase: "coral", top: 329 })) {
      await sb.auth.signOut(); localStorage.removeItem("riff_busquedas"); ir("selecciona-perfil.html");
    }
  };
}
pantallas["perfil"] = pantallaPerfil;
pantallas["perfil-cerrar-sesion"] = pantallaPerfil;

// ---------- notificaciones ----------
function hace(fecha) {
  const min = Math.round((Date.now() - new Date(fecha)) / 60000);
  if (min < 60) return min <= 1 ? "ahora" : `hace ${min} min`;
  if (min < 1440) return `hace ${Math.round(min / 60)} h`;
  if (min < 2880) return "ayer";
  return fDia(fecha);
}
const ESTILO_NOTI = { "según tus gustos": ["lila", "suave", ""], "sorpréndeme": ["coral-f", "coral", "borde-coral"], "recordatorio": ["rosa-f", "rosa", ""], "evento aprobado": ["rosa-f", "rosa", ""], "hito alcanzado": ["lila", "suave", ""], "actualiza tu evento": ["coral-f", "coral", "borde-coral"], "bienvenida": ["lila", "suave", ""] };
async function pantallaNotificaciones({ organizador }) {
  const u = await exigirSesion();
  const contenido = $(".contenido", pantalla);
  const [p, evs, gs] = await Promise.all([perfil(), organizador ? [] : eventos(), organizador ? [] : guardados()]);
  let { data: notis } = await sb.from("notificaciones").select("*").eq("usuario_id", u.id).order("created_at", { ascending: false }).limit(50);
  if (!notis?.length && !organizador && evs.length) { // primeras notificaciones de bienvenida
    const otros = evs.filter((e) => !e.generos.some((g) => p?.generos?.includes(g)));
    const sorpresa = otros[Math.floor(Math.random() * otros.length)] || evs[0];
    const nuevas = [{ usuario_id: u.id, tipo: "bienvenida", titulo: "¡Bienvenida a RIFF!", texto: "Aquí te avisaremos de eventos nuevos que encajan con tus gustos y de tus recordatorios." },
      { usuario_id: u.id, tipo: "sorpréndeme", titulo: "Sorpréndeme: algo distinto", texto: `¿Y si pruebas ${sorpresa.generos[0].toLowerCase()}? ${sorpresa.titulo}, ${corto(sorpresa.venue)} · ${fDesde(sorpresa)}`, evento_id: sorpresa.id }];
    await sb.from("notificaciones").insert(nuevas);
    ({ data: notis } = await sb.from("notificaciones").select("*").eq("usuario_id", u.id).order("created_at", { ascending: false }));
  }
  // recordatorios calculados de los guardados que ya están cerca
  const recordatorios = gs.filter((g) => { const h = RECORDATORIOS[g.recordatorio]; const t = new Date(g.eventos.fecha) - Date.now(); return h != null && t > 0 && t <= Math.max(h, 24) * 3600e3; })
    .map((g) => ({ tipo: "recordatorio", titulo: "Tu evento es pronto", texto: `${g.eventos.titulo} · ${fFecha(g.eventos)} · ${corto(g.eventos.venue)}`, evento_id: g.eventos.id, created_at: new Date().toISOString() }));
  const todas = [...recordatorios, ...(notis || [])];
  const destino = (n) => (n.evento_id ? (organizador ? `org-metricas.html?id=${n.evento_id}` : `evento.html?id=${n.evento_id}`) : organizador ? "org-panel.html" : "feed.html");
  const tarjeta = (n) => { const [caja, color, borde] = ESTILO_NOTI[n.tipo] || ESTILO_NOTI["según tus gustos"];
    return `<a class="tarjeta pad fila g12 ${borde}" href="${destino(n)}" style="align-items:flex-start${n.leida ? ";opacity:.75" : ""}"><span class="icono-caja ${caja}">${ic(n.tipo === "recordatorio" ? "bell" : n.tipo === "sorpréndeme" ? "sparkles" : "music", "s22")}</span>
      <div class="flex1"><div class="fila entre"><span class="p12b ${color}">${esc(n.tipo[0].toUpperCase() + n.tipo.slice(1))}</span><span class="p12 suave">${hace(n.created_at)}</span></div>
      <p class="p14b" style="font-size:15px">${esc(n.titulo)}</p><p class="p14 suave" style="margin-top:2px">${esc(n.texto)}</p></div></a>`; };
  const hoy = todas.filter((n) => Date.now() - new Date(n.created_at) < 864e5), antes = todas.filter((n) => !hoy.includes(n));
  contenido.innerHTML = todas.length ? `${hoy.length ? `<h2 class="h3">hoy</h2><div class="lista mt12">${hoy.map(tarjeta).join("")}</div>` : ""}
    ${antes.length ? `<h2 class="h3 mt24 suave">antes</h2><div class="lista mt12">${antes.map(tarjeta).join("")}</div>` : ""}`
    : `<div class="mensaje-vacio" style="margin-top:60px"><div class="circulo-vacio">${ic("bell", "s32")}</div><h2 class="h3 mt16">sin notificaciones</h2><p class="cuerpo suave mt8">Te avisaremos cuando ${organizador ? "aprueben tus eventos" : "haya eventos para ti"}.</p></div>`;
  contenido.style.paddingBottom = "40px";
  sb.from("notificaciones").update({ leida: true }).eq("usuario_id", u.id).eq("leida", false).then(() => {});
}
pantallas["notificaciones"] = () => pantallaNotificaciones({ organizador: false });
pantallas["org-notificaciones"] = () => pantallaNotificaciones({ organizador: true });

// =====================================================================
// ORGANIZADORES
// =====================================================================
async function miOrganizador() {
  const u = await exigirSesion("org-iniciar-sesion.html");
  const { data } = await sb.from("organizadores").select("*").eq("id", u.id).maybeSingle();
  if (!data) { aviso("Esta cuenta no es de organizador"); setTimeout(() => ir("feed.html"), 1500); throw new Error("no es organizador"); }
  return data;
}
async function subirArchivo(bucket, archivo, carpeta) {
  const nombre = `${carpeta}/${Date.now()}-${archivo.name.normalize("NFD").replace(/[^\w.-]+/g, "-")}`;
  const { error } = await sb.storage.from(bucket).upload(nombre, archivo, { upsert: false });
  if (error) throw error;
  return bucket === "portadas" ? sb.storage.from(bucket).getPublicUrl(nombre).data.publicUrl : nombre;
}
function elegirArchivo(accept) {
  return new Promise((ok) => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.onchange = () => ok(i.files[0] || null); i.click(); });
}
const tamano = (b) => (b > 1e6 ? (b / 1e6).toLocaleString("es-CO", { maximumFractionDigits: 1 }) + " MB" : Math.round(b / 1e3) + " KB");

pantallas["org-verificacion"] = async () => {
  const org = await miOrganizador();
  const docs = { ...org.documentos };
  const tarjetas = $$(".tarjeta.pad.fila", pantalla);
  const claves = ["permiso", "camara", "rut"];
  const nombres = ["Permiso de funcionamiento", "Cámara de comercio", "RUT"];
  tarjetas.forEach((t, i) => {
    t.style.cursor = "pointer"; t.classList.remove("subida");
    $(".p14b", t).textContent = nombres[i];
    const linea = $(".p12", t);
    $(".progreso", t)?.remove();
    linea.textContent = docs[claves[i]] ? `${docs[claves[i]].nombre} · Subido` : "Toca para subir PDF o foto (máx. 10 MB)";
    t.onclick = async () => {
      const f = await elegirArchivo("application/pdf,image/*"); if (!f) return;
      if (f.size > 10e6) return aviso("El archivo pesa más de 10 MB");
      linea.textContent = `${f.name} · subiendo…`;
      try { const ruta = await subirArchivo("documentos", f, org.id); docs[claves[i]] = { nombre: f.name, ruta, tamano: f.size }; linea.textContent = `${f.name} · ${tamano(f.size)} · Subido`; }
      catch (e) { linea.textContent = "No se pudo subir. Toca para intentar de nuevo."; }
    };
  });
  const enviar = $("a.boton.primario", pantalla);
  enviar.onclick = async (e) => {
    e.preventDefault();
    if (!Object.keys(docs).length) return aviso("Sube al menos un documento");
    // MVP: la verificación se aprueba al enviar. La revisión humana queda para después (spec.md).
    await sb.from("organizadores").update({ documentos: docs, estado_verificacion: "verificado" }).eq("id", org.id);
    ir("org-perfil-publico.html");
  };
  const rechazo = $("a.tarjeta.borde-peligro", pantalla);
  if (rechazo) { if (org.estado_verificacion === "rechazado") { rechazo.removeAttribute("href"); $("p", rechazo).textContent = "Motivo del rechazo: " + (org.motivo_rechazo || "revisa tus documentos"); } else rechazo.remove(); }
};
pantallas["org-verificacion-rechazada"] = () => ir("org-verificacion.html");
pantallas["org-perfil-publico"] = async () => {
  const org = await miOrganizador();
  $("h1", pantalla).textContent = org.nombre.toLowerCase();
  $("p.p14.suave", pantalla).textContent = `${org.tipo[0].toUpperCase() + org.tipo.slice(1)} · ${org.ubicacion || "Bogotá"}`;
  const badge = $(".badge.publicado", pantalla);
  if (badge && org.estado_verificacion !== "verificado") badge.outerHTML = '<span class="badge revision" style="margin-bottom:8px">Verificación pendiente</span>';
  const campos = $$(".campo", pantalla);
  const desc = campoReal(campos[0], { area: true, placeholder: "Cuéntale al público qué música suena y tus horarios", valor: org.descripcion });
  const ubic = campoReal(campos[1], { placeholder: "Dirección y barrio", valor: org.ubicacion });
  const redes = campoReal(campos[3], { placeholder: "@tuusuario", valor: org.redes });
  const boton = $(".pie .boton", pantalla);
  boton.onclick = async (e) => {
    e.preventDefault();
    await sb.from("organizadores").update({ descripcion: desc.value.trim(), ubicacion: ubic.value.trim(), redes: redes.value.trim() }).eq("id", org.id);
    ir("org-panel.html");
  };
};

const ESTADOS = { publicado: ["publicado", "Publicado"], "en revision": ["revision", "En revisión"], rechazado: ["rechazado", "Rechazado"], cancelado: ["revision", "Cancelado"] };
pantallas["org-panel"] = async () => {
  const org = await miOrganizador();
  $(".contenido .p14.suave", pantalla).textContent = "hola, " + org.nombre.toLowerCase();
  const u = await usuario();
  const [{ data: evs }, { data: res }, { count }] = await Promise.all([
    sb.from("eventos").select("*").eq("organizador_id", u.id).order("created_at", { ascending: false }),
    sb.rpc("resumen_metricas", { dias: 7 }),
    sb.from("notificaciones").select("id", { count: "exact", head: true }).eq("usuario_id", u.id).eq("leida", false),
  ]);
  const punto = $('a[href="org-notificaciones.html"] i', pantalla); if (punto && !count) punto.style.display = "none";
  const porEvento = Object.fromEntries((res || []).map((r) => [r.evento_id, r]));
  const total = (k) => (res || []).reduce((s, r) => s + Number(r[k]), 0);
  const cifras = $$(".metrica .cifra", pantalla);
  [total("vistas"), total("guardados"), total("clics")].forEach((n, i) => cifras[i] && (cifras[i].textContent = n));
  const lista = $(".lista", pantalla);
  if (!evs?.length) { lista.innerHTML = `<div class="tarjeta pad mensaje-vacio"><p class="p14b">Aún no has publicado eventos</p><p class="p12 suave mt8">Toca «+ Publicar nuevo evento» para empezar.</p></div>`; return; }
  lista.innerHTML = evs.map((e) => { const [clase, texto] = ESTADOS[e.estado]; const m = porEvento[e.id] || { vistas: 0, guardados: 0 };
    const b = (txt, href, extra = "") => `<a class="boton secundario p12b ${extra}" href="${href}" style="height:42px;font-size:12px">${txt}</a>`;
    return `<div class="tarjeta pad ${e.estado === "rechazado" ? "borde-peligro" : ""}" ${e.estado === "cancelado" ? 'style="opacity:.6"' : ""}>
      <div class="fila g12"><span class="miniatura" style="width:64px;height:64px;border-radius:8px;background:url('${imagen(e.portada)}') center/cover;flex-shrink:0"></span>
      <div class="flex1" style="min-width:0"><span class="badge ${clase}">${texto}</span><p class="p14b mt8 elipsis" style="font-size:15px">${esc(e.titulo)}</p><p class="p12 suave">${esc(fFecha(e))}</p></div></div>
      ${e.estado === "rechazado" ? `<p class="p12 coral mt12">Motivo: ${esc(e.motivo_rechazo || "revisa los datos")}</p>` : `<p class="p12 suave mt12">${e.estado === "en revision" ? "Enviado " + hace(e.created_at) + " · respuesta en 48 h" : `${m.vistas} vistas · ${m.guardados} guardados (7 días)`}</p>`}
      <div class="fila g6 mt12">${e.estado === "publicado" ? b("Métricas", "org-metricas.html?id=" + e.id) : ""}${e.estado === "en revision" ? b("Ver estado", "org-en-revision.html?id=" + e.id) : ""}
        ${e.estado !== "cancelado" ? b(e.estado === "rechazado" ? "Corregir" : "Editar", "org-evento-paso-1.html?editar=" + e.id, e.estado === "rechazado" ? "primario" : "") : ""}
        ${b("Duplicar", "org-evento-paso-1.html?duplicar=" + e.id)}
        ${e.estado !== "cancelado" ? `<button class="boton secundario p12b coral" data-cancelar="${e.id}" style="height:42px;font-size:12px">Cancelar</button>` : ""}</div></div>`; }).join("");
  lista.onclick = async (ev) => {
    const b = ev.target.closest("[data-cancelar]"); if (!b) return;
    if (await alerta({ titulo: "¿Cancelar este evento?", texto: "Dejará de verse en el feed, el mapa y los filtros. Esta acción no se puede deshacer.", cancelar: "Volver", aceptar: "Cancelar evento", clase: "coral" })) {
      await sb.from("eventos").update({ estado: "cancelado" }).eq("id", b.dataset.cancelar); location.reload();
    }
  };
};
pantallas["org-panel-cancelar"] = () => ir("org-panel.html");

// ---------- publicar evento (4 pasos, con borrador en el navegador) ----------
const BORRADOR = "riff_borrador_evento";
const leerBorrador = () => { try { return JSON.parse(sessionStorage.getItem(BORRADOR)) || {}; } catch { return {}; } };
const escribirBorrador = (b) => sessionStorage.setItem(BORRADOR, JSON.stringify(b));
function pasoNav(atras, siguiente, validar) {
  const [bAtras, bSig] = $$(".pie .boton", pantalla);
  bAtras.href = atras;
  bSig.onclick = async (e) => { e.preventDefault(); const ok = await validar(); if (ok) ir(siguiente); };
}
pantallas["org-evento-paso-1"] = async () => {
  const org = await miOrganizador();
  const u = await usuario();
  if (params.get("editar") || params.get("duplicar")) {
    const base = await evento(params.get("editar") || params.get("duplicar"));
    if (base) {
      const { id, created_at, estado, motivo_rechazo, organizador_id, ...datos } = base;
      if (params.get("duplicar")) { datos.titulo = datos.titulo + " (copia)"; datos.fecha = null; datos.fecha_fin = null; }
      escribirBorrador({ ...datos, editar: params.get("editar") ? id : null });
    }
  } else if (!params.has("seguir")) escribirBorrador({});
  const b = leerBorrador();
  const contenido = $(".contenido", pantalla);
  $(".tooltip", pantalla)?.remove();
  if (b.editar) $(".nav .titulo", pantalla).textContent = "editar evento";
  const { data: anteriores } = await sb.from("eventos").select("id,titulo").eq("organizador_id", u.id).order("created_at", { ascending: false }).limit(1);
  const duplicar = $(".tarjeta.borde-rosa", contenido);
  if (anteriores?.length && !b.editar) { duplicar.style.cursor = "pointer"; $(".p12", duplicar).textContent = `Reutiliza los datos de “${anteriores[0].titulo}”`; duplicar.onclick = () => ir("org-evento-paso-1.html?duplicar=" + anteriores[0].id); }
  else duplicar.remove();
  const campos = $$(".campo", contenido);
  const titulo = campoReal(campos[0], { placeholder: "Ej. Viernes de Reggaetón", valor: b.titulo || "" });
  campos[1].querySelector("label").textContent = "Artistas u organizadores (opcional)";
  const artistas = campoReal(campos[1], { placeholder: "Ej. @bambulebta, DJ invitado", valor: b.artistas || "" });
  const portadaDiv = $("div[style*='height:140px']", campos[2]);
  let portada = b.portada || "assets/foto-bambule.jpg";
  portadaDiv.style.backgroundImage = `url('${imagen(portada)}')`; portadaDiv.style.cursor = "pointer";
  const etiqueta = $(".badge", portadaDiv);
  portadaDiv.onclick = async () => {
    const f = await elegirArchivo("image/*"); if (!f) return;
    etiqueta.lastChild.textContent = "Subiendo…";
    try { portada = await subirArchivo("portadas", f, org.id); portadaDiv.style.backgroundImage = `url('${portada}')`; etiqueta.lastChild.textContent = "Cambiar portada"; }
    catch { etiqueta.lastChild.textContent = "No se pudo subir, toca para intentar"; }
  };
  pasoNav("org-panel.html", "org-evento-paso-2.html?seguir=1", () => {
    if (!titulo.value.trim()) { errorCampo(titulo, "Escribe el nombre del evento"); return false; }
    escribirBorrador({ ...leerBorrador(), titulo: titulo.value.trim(), artistas: artistas.value.trim(), portada });
    return true;
  });
};
pantallas["org-evento-paso-2"] = async () => {
  await miOrganizador();
  const b = leerBorrador();
  if (!b.titulo) return ir("org-evento-paso-1.html");
  const contenido = $(".contenido", pantalla);
  $(".selector-ios", contenido)?.remove();
  const campoDir = $(".campo", contenido);
  const venueCampo = nuevoCampo(campoDir, "Nombre del lugar");
  const venue = campoReal(venueCampo, { placeholder: "Ej. Bambulé, Teatro Gaitán", valor: b.venue || "" });
  const dir = campoReal(campoDir, { placeholder: "Ej. Cra. 13 # 83-47, Chapinero", valor: b.direccion || "" });
  const mini = $("div[style*='height:120px']", contenido);
  mini.removeAttribute("style"); mini.className = "mapa-mini mt12"; mini.innerHTML = "";
  const ayuda = document.createElement("p"); ayuda.className = "ayuda mt8"; ayuda.textContent = "Escribe la dirección y ajusta el pin si hace falta.";
  mini.after(ayuda);
  const [cFecha, cHora] = $$(".fila.g16 .campo", contenido);
  const fechaLocal = b.fecha ? new Date(new Date(b.fecha).toLocaleString("en-US", zona)) : null;
  const dos = (n) => String(n).padStart(2, "0");
  const fecha = campoReal(cFecha, { tipo: "date", valor: fechaLocal ? `${fechaLocal.getFullYear()}-${dos(fechaLocal.getMonth() + 1)}-${dos(fechaLocal.getDate())}` : "" });
  const hora = campoReal(cHora, { tipo: "time", valor: fechaLocal ? `${dos(fechaLocal.getHours())}:${dos(fechaLocal.getMinutes())}` : "20:00" });
  fecha.min = new Date().toISOString().slice(0, 10);
  let pos = b.lat ? { lat: b.lat, lng: b.lng } : null;
  const L = await cargarLeaflet();
  const mapa = mapaBase(L, mini, pos || BOGOTA, pos ? 15 : 11);
  const marca = L.marker([(pos || BOGOTA).lat, (pos || BOGOTA).lng], { draggable: true }).addTo(mapa);
  marca.on("dragend", () => (pos = marca.getLatLng()));
  mapa.on("click", (e) => { pos = e.latlng; marca.setLatLng(e.latlng); });
  const buscar = async () => {
    if (dir.value.trim().length < 5) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(dir.value + ", Bogotá")}`).then((x) => x.json());
      if (r[0]) { pos = { lat: +r[0].lat, lng: +r[0].lon }; marca.setLatLng(pos); mapa.setView(pos, 16); ayuda.textContent = "Encontramos la dirección. Arrastra el pin si no es exacto."; }
      else ayuda.textContent = "No encontramos la dirección: toca el mapa para ubicar el lugar.";
    } catch { ayuda.textContent = "Toca el mapa para ubicar el lugar."; }
  };
  dir.addEventListener("change", buscar);
  setTimeout(() => mapa.invalidateSize(), 200);
  pasoNav("org-evento-paso-1.html?seguir=1", "org-evento-paso-3.html", () => {
    let ok = true;
    if (!venue.value.trim()) errorCampo(venue, "Escribe el nombre del lugar"), (ok = false);
    if (!dir.value.trim()) errorCampo(dir, "Escribe la dirección"), (ok = false);
    if (!fecha.value) errorCampo(fecha, "Elige la fecha"), (ok = false);
    if (!ok) return false;
    const iso = new Date(`${fecha.value}T${hora.value || "20:00"}:00-05:00`).toISOString();
    if (new Date(iso) < Date.now()) { errorCampo(fecha, "La fecha ya pasó"); return false; }
    escribirBorrador({ ...leerBorrador(), venue: venue.value.trim(), direccion: dir.value.trim(), fecha: iso, fecha_fin: null, lat: pos?.lat ?? BOGOTA.lat, lng: pos?.lng ?? BOGOTA.lng });
    return true;
  });
};
pantallas["org-evento-paso-3"] = async () => {
  await miOrganizador();
  const b = leerBorrador();
  if (!b.fecha) return ir("org-evento-paso-2.html");
  const contenido = $(".contenido", pantalla);
  const [gChips, fChips, vChips] = $$(".chips", contenido);
  gChips.innerHTML = ""; GENEROS.forEach((g) => gChips.appendChild(chipNuevo(g, b.generos?.includes(g))));
  fChips.innerHTML = ""; ["DJ set", "En vivo", "Acústico", "Festival", "Orquesta"].forEach((g) => fChips.appendChild(chipNuevo(g, b.formato === g)));
  vChips.innerHTML = ""; ["Club", "Bar", "Teatro", "Al aire libre", "Estadio", "Arena"].forEach((g) => vChips.appendChild(chipNuevo(g, b.tipo_venue === g)));
  let formato = b.formato || null, tipoVenue = b.tipo_venue || null, edad = b.edad || "Todo público";
  chipsUnicos(fChips, (t) => (formato = t)); chipsUnicos(vChips, (t) => (tipoVenue = t));
  const seg = $(".segmentado", contenido);
  seg.innerHTML = ["Todo público", "+14", "+18"].map((x) => `<span class="${x === edad ? "sel" + (x === "+18" ? " peligro" : "") : ""}">${x}</span>`).join("");
  chipsUnicos(seg, (t) => { edad = t; if (t === "+18") $(".sel", seg).classList.add("peligro"); });
  const [cDesde, cHasta] = $$(".campo", contenido);
  const desde = campoReal(cDesde, { tipo: "number", placeholder: "0 = gratis", valor: b.precio_desde ?? "" });
  const hasta = campoReal(cHasta, { tipo: "number", placeholder: "Opcional", valor: b.precio_hasta ?? "" });
  [desde, hasta].forEach((i) => { i.min = 0; i.step = 1000; i.inputMode = "numeric"; });
  pasoNav("org-evento-paso-2.html", "org-evento-paso-4.html", () => {
    const generos = $$(".chip.sel", gChips).map(textoChip);
    if (!generos.length) { aviso("Elige al menos un género"); return false; }
    if (!formato || !tipoVenue) { aviso("Elige el formato de acto y el tipo de venue"); return false; }
    const d = desde.value === "" ? null : Number(desde.value), h = hasta.value === "" ? null : Number(hasta.value);
    if (h != null && d != null && h < d) { errorCampo(hasta, "Debe ser mayor que «desde»"); return false; }
    escribirBorrador({ ...leerBorrador(), generos, formato, tipo_venue: tipoVenue, edad, precio_desde: d, precio_hasta: h });
    return true;
  });
};
pantallas["org-evento-paso-4"] = async () => {
  const org = await miOrganizador();
  const b = leerBorrador();
  if (!b.generos) return ir("org-evento-paso-3.html");
  const contenido = $(".contenido", pantalla);
  $(".tooltip", pantalla)?.remove();
  const [cLink, cRestr] = $$(".campo", contenido);
  const link = campoReal(cLink, { tipo: "url", placeholder: "https://…", valor: b.venta_url || "" });
  link.ayudaOriginal = "Debe empezar por https://";
  const restr = campoReal(cRestr, { area: true, placeholder: "Ej. Solo mayores de 18. Ingreso con cédula.", valor: b.descripcion || "" });
  $("label", cRestr).textContent = "Descripción y restricciones";
  restr.maxLength = 400;
  const pmu = $(".tarjeta.pad.fila", contenido);
  let permiso = b.permiso || null;
  $(".p12", pmu).textContent = permiso ? `${permiso.nombre} · Subido` : "Opcional · toca para subir el PDF";
  pmu.style.cursor = "pointer";
  pmu.onclick = async () => { const f = await elegirArchivo("application/pdf,image/*"); if (!f) return; $(".p12", pmu).textContent = "Subiendo…"; try { const ruta = await subirArchivo("documentos", f, org.id); permiso = { nombre: f.name, ruta }; $(".p12", pmu).textContent = `${f.name} · ${tamano(f.size)} · Subido`; } catch { $(".p12", pmu).textContent = "No se pudo subir"; } };
  const [bAtras, bEnviar] = $$(".pie .boton", pantalla);
  bAtras.href = "org-evento-paso-3.html";
  if (b.editar) bEnviar.textContent = "Guardar y enviar a revisión";
  bEnviar.onclick = async (e) => {
    e.preventDefault();
    let url = link.value.trim();
    if (url && !/^https?:\/\//.test(url)) url = "https://" + url;
    try { if (url) new URL(url); } catch { return errorCampo(link, "Ese link no parece válido"); }
    bEnviar.classList.add("cargando");
    const dominio = url ? new URL(url).hostname.replace("www.", "") : "";
    const fila = { titulo: b.titulo, portada: b.portada, generos: b.generos, formato: b.formato, tipo_venue: b.tipo_venue, edad: b.edad, fecha: b.fecha, fecha_fin: b.fecha_fin, nota_fecha: b.artistas ? "Con " + b.artistas : "",
      venue: b.venue, direccion: b.direccion, lat: b.lat, lng: b.lng, precio_desde: b.precio_desde, precio_hasta: b.precio_hasta, descripcion: restr.value.trim(), venta_nombre: dominio, venta_url: url, organizador_id: org.id, estado: "en revision", motivo_rechazo: null };
    const r = b.editar ? await sb.from("eventos").update(fila).eq("id", b.editar).select().single() : await sb.from("eventos").insert(fila).select().single();
    bEnviar.classList.remove("cargando");
    if (r.error) return aviso("No pudimos enviar el evento: " + r.error.message);
    sessionStorage.removeItem(BORRADOR);
    ir("org-en-revision.html?id=" + r.data.id);
  };
};
pantallas["org-en-revision"] = async () => {
  await miOrganizador();
  const ev = await evento(params.get("id"));
  if (!ev) return ir("org-panel.html");
  if (ev.estado === "publicado") return ir("org-publicado.html?id=" + ev.id);
  const lineas = $$(".tarjeta.pad .p12.suave", pantalla);
  const enviado = new Date(ev.created_at);
  lineas[0].textContent = `${fDia(enviado)} · ${fHora(enviado)}`;
  lineas[1].textContent = `Respuesta antes del ${fDia(+enviado + 48 * 3600e3)} · ${fHora(+enviado + 48 * 3600e3)}`;
  const demo = $$("a.boton.ghost", pantalla).pop();
  demo.textContent = "Aprobar ahora (demo de la revisión) →";
  demo.onclick = async (e) => { e.preventDefault(); await sb.from("eventos").update({ estado: "publicado" }).eq("id", ev.id); ir("org-publicado.html?id=" + ev.id); };
};
pantallas["org-publicado"] = async () => {
  await miOrganizador();
  const ev = await evento(params.get("id"));
  if (!ev) return;
  const card = $(".card-evento", pantalla);
  if (card) card.outerHTML = tarjetaEvento(ev, false).replace('class="card-evento"', 'class="card-evento mt16" style="width:100%"').replace(/<button class="guardar[^]*?<\/button>/, "");
  $$("a[href^='org-metricas']", pantalla).forEach((a) => (a.href = "org-metricas.html?id=" + ev.id));
  $$("a[href^='detalle-'], a[href^='feed']", pantalla).forEach((a) => (a.href = "evento.html?id=" + ev.id));
};
pantallas["org-metricas"] = async () => {
  await miOrganizador();
  const ev = await evento(params.get("id"));
  if (!ev) return ir("org-panel.html");
  const cab = $(".fila.g12", pantalla);
  $(".miniatura", cab).style.backgroundImage = `url('${imagen(ev.portada)}')`;
  $(".p14b", cab).textContent = ev.titulo;
  const [clase, texto] = ESTADOS[ev.estado]; $(".badge", cab).className = "badge mt8 " + clase; $(".badge", cab).textContent = texto;
  const desde = new Date(Date.now() - 6 * 864e5); desde.setHours(0, 0, 0, 0);
  const { data } = await sb.from("metricas").select("tipo,created_at").eq("evento_id", ev.id).gte("created_at", desde.toISOString());
  const dias = [...Array(7)].map((_, i) => { const d = new Date(+desde + i * 864e5); return { d, vistas: 0, guardados: 0, clics: 0 }; });
  (data || []).forEach((m) => { const i = Math.floor((new Date(m.created_at) - desde) / 864e5); if (dias[i]) dias[i][m.tipo === "vista" ? "vistas" : m.tipo === "guardado" ? "guardados" : "clics"]++; });
  const tot = (k) => dias.reduce((s, x) => s + x[k], 0);
  const cifras = $$(".metrica .cifra", pantalla);
  [tot("vistas"), tot("guardados"), tot("clics")].forEach((n, i) => (cifras[i].textContent = n));
  const max = Math.max(1, ...dias.map((x) => Math.max(x.vistas, x.guardados)));
  const linea = (k) => dias.map((x, i) => `${(i * 300) / 6 + 10},${140 - (x[k] / max) * 120}`).join(" ");
  const tarjeta = $(".tarjeta.pad.mt16", pantalla);
  const viejo = $(":scope > svg", tarjeta);
  const svg = `<svg class="grafica" viewBox="0 0 320 150" preserveAspectRatio="none"><polyline fill="none" stroke="var(--primario)" stroke-width="3" points="${linea("vistas")}"/><polyline fill="none" stroke="var(--acento)" stroke-width="3" points="${linea("guardados")}"/></svg>`;
  if (viejo) viejo.outerHTML = svg; else $(".fila.entre.p14", tarjeta).insertAdjacentHTML("beforebegin", svg);
  $(".fila.entre.p14", tarjeta).innerHTML = dias.map((x) => `<span>${x.d.getDate()}</span>`).join("");
  $("p.p12.suave.mt8", tarjeta).textContent = "Últimos 7 días";
  const mejor = [...dias].sort((a, b) => b.vistas - a.vistas)[0];
  $(".p12b", tarjeta).textContent = mejor.vistas ? `Mejor día: ${fDia(mejor.d)} · ${mejor.vistas} vistas y ${mejor.guardados} guardados` : "Aún no hay vistas: comparte tu evento";
  const tasa = tot("vistas") ? Math.round((tot("guardados") / tot("vistas")) * 100) : 0;
  $(".cifra.rosa", pantalla).textContent = tasa + " %";
  $$(".tarjeta.pad.fila.entre .p12", pantalla).forEach((p) => (p.textContent = `De cada 100 vistas, ${tasa} guardan el evento`));
};

// ---------- arranque ----------
const fn = pantalla && pantallas[pantalla.id];
if (fn) fn().catch((e) => { if (!/sin sesión|no es organizador/.test(e.message)) { console.error(e); aviso("Algo falló. Recarga la página."); } });
sb.auth.onAuthStateChange((evento) => { if (evento === "SIGNED_OUT") { _perfil = undefined; _guardados = undefined; } });
