// RIFF · Edge Function «importar-eventos» (desplegada en Supabase → Edge Functions)
// Lee las carteleras oficiales y guarda en la tabla «eventos» los conciertos de Bogotá:
//  - Tuboleta (tuboleta.com/es/categorias/conciertos): venta oficial de muchos venues
//    (Movistar Arena, Teatro Mayor, Teatro Gaitán, Teatro Cafam, Royal Center…).
//  - Movistar Arena / El Corazón de Bogotá (elcorazondebogota.com/eventos).
// Por cada concierto guarda: nombre, fecha y hora, imagen oficial, venue, precios y link de compra.
// Corre sola todos los días (pg_cron, ver supabase/importar-eventos.sql) y se puede correr a mano
// desde Supabase con el botón «Test». No duplica: usa «fuente_url».
import { createClient } from "jsr:@supabase/supabase-js@2";

const llaveServicio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || (() => { try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); return k.default || Object.values(k)[0]; } catch { return ""; } })();
const sb = createClient(Deno.env.get("SUPABASE_URL")!, llaveServicio as string);
const UA = { "User-Agent": "RIFF-app-estudiantil/1.0 (riff-bogota.vercel.app)" };
const MESES: Record<string, number> = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

// Venues conocidos de Bogotá: coordenadas y tipo
const VENUES: [RegExp, { lat: number; lng: number; tipo: string; nombre?: string }][] = [
  [/coraz[oó]n de bogot[aá].*arena|movistar arena/i, { lat: 4.6496, lng: -74.0772, tipo: "Arena", nombre: "Movistar Arena" }],
  [/teatro mayor|julio mario santo domingo/i, { lat: 4.7543, lng: -74.0647, tipo: "Teatro" }],
  [/centro nacional de las artes.*sala teatro/i, { lat: 4.5975, lng: -74.0752, tipo: "Teatro" }],
  [/jorge eli[eé]cer gait[aá]n/i, { lat: 4.6083, lng: -74.0700, tipo: "Teatro" }],
  [/teatro cafam/i, { lat: 4.6763, lng: -74.0901, tipo: "Teatro" }],
  [/colsubsidio/i, { lat: 4.6205, lng: -74.0767, tipo: "Teatro" }],
  [/royal center/i, { lat: 4.6532, lng: -74.0613, tipo: "Teatro" }],
  [/fabio lozano/i, { lat: 4.6040, lng: -74.0680, tipo: "Teatro" }],
  [/luis [aá]ngel arango/i, { lat: 4.5973, lng: -74.0729, tipo: "Teatro" }],
  [/teatro col[oó]n/i, { lat: 4.5966, lng: -74.0749, tipo: "Teatro" }],
  [/le[oó]n de greiff/i, { lat: 4.6360, lng: -74.0832, tipo: "Teatro" }],
  [/fanny mikey/i, { lat: 4.6681, lng: -74.0547, tipo: "Teatro" }],
  [/la castellana/i, { lat: 4.6886, lng: -74.0563, tipo: "Teatro" }],
  [/astor plaza/i, { lat: 4.6517, lng: -74.0619, tipo: "Teatro" }],
  [/vive claro/i, { lat: 4.6449, lng: -74.0921, tipo: "Estadio" }],
  [/camp[ií]n/i, { lat: 4.6459, lng: -74.0778, tipo: "Estadio" }],
  [/[aá]gora/i, { lat: 4.6301, lng: -74.0911, tipo: "Arena" }],
  [/corferias/i, { lat: 4.6297, lng: -74.0905, tipo: "Al aire libre" }],
  [/sim[oó]n bol[ií]var/i, { lat: 4.6580, lng: -74.0935, tipo: "Al aire libre" }],
  [/coliseo/i, { lat: 4.7176, lng: -74.0716, tipo: "Arena" }],
];
const BOGOTA = { lat: 4.6533, lng: -74.0836 };

// Géneros por palabras clave del nombre y la descripción
const GENEROS: [RegExp, string][] = [
  [/sinf[oó]nic|filarm|philharm|orquesta|orchest|camerata|[oó]pera|piano|cuarteto|quartet|quatuor|ensamble|m[uú]sica antigua|viol[ií]n|chelo|clavec|[oó]rgano|recital|lied|soprano|tenor|barroc|tchaikovsky|beethoven|mozart|bach|bruckner|mahler|savall|kavakos|cavalleria|tristana|voz humana|pasi[oó]n seg[uú]n|sainz-villegas|coro\b/i, "Clásica"],
  [/reggaet|regueton|perreo|urbano|j balvin|feid|karol g|maluma|ozuna|bad bunny|ryan castro|blessd|piso 21|kris r|rauw|anuel|omar courtz|jay wheeler|reykon|nicky jam|justin quiles|lenny tav/i, "Reggaetón"],
  [/trap/i, "Trap latino"], [/\brap\b|hip ?hop|freestyle|kase\.?o|alcolyrikoz|canserbero|akapellah/i, "Rap"],
  [/electr[oó]nic|techno|tech house|\bdj\b|garrix|guetta|tiesto|rave|baum|jungle|tricky|bogotrakes/i, "Electrónica"], [/\bhouse\b/i, "House"],
  [/salsa|son cubano|timba|grupo niche|niche sinf|guayac[aá]n|tropical|hispanos|fruko|charanga/i, "Salsa"],
  [/cumbia|vallenat|champeta|carranga|porro|papayera|zabaleta|adriana luc[ií]a|diomedes|silvestre/i, "Cumbia"],
  [/metal|slipknot|metallica|iron maiden|lindemann|rammstein|mago de oz|m[aä]go de oz/i, "Metal"],
  [/rock|soda stereo|punk|new order|grunge|aterciopelados|enanitos|pixies|placebo|queen|beatles|tributo|tribute|experience|kraken|hamilton/i, "Rock"],
  [/indie|alternativ/i, "Indie"], [/jazz|blues|bossa|swing/i, "Jazz"],
  [/fado|folk|folclor|andin|pac[ií]fico|bah[ií]a|mijas|timbiqu|joropo|llaner|bambuco|tango|trova|flamenco|m[uú]sica colombiana/i, "Folclor"],
  [/andariego|despecho|carrilera|ranchera|mariachi|guaro|popular|jhon alex|jessi uribe|pipe bueno|yeison|luis alfonso|el charrito/i, "Popular"],
  [/juanes|camilo|chayanne|sebasti[aá]n yatra|morat|carlos vives|shakira|fonseca|pop|balada|bolero|camila|reik|mau y ricky|montaner|carlos rivera|cepeda|pedro cap[oó]|el kanka|dimash|vdevinilo|onofre|alejandro sanz|fiesta/i, "Pop latino"],
];

const texto = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&#8211;|&ndash;/g, "–").replace(/\s+/g, " ").trim();
const limpiarTitulo = (t: string) => t.replace(/\s+/g, " ").replace(/\s*[-–]\s*BOGOT[AÁ]\s*$/i, "").trim();
const tituloBonito = (t: string) => t === t.toUpperCase() ? t.toLowerCase().replace(/(^|[\s|(–-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : t;
const get = async (url: string) => { const r = await fetch(url, { headers: UA }); if (!r.ok) throw new Error(r.status + " " + url); return r.text(); };
async function enLotes<T, R>(lista: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < lista.length; i += n) out.push(...(await Promise.all(lista.slice(i, i + n).map((x) => fn(x).catch(() => null as R)))));
  return out;
}
function fechaBogota(anio: number, mes: number, dia: number, hora = 20, min = 0) {
  return new Date(`${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-05:00`).toISOString();
}
function hora24(h: string, m: string, ampm: string) { let x = Number(h) % 12; if (/p/i.test(ampm)) x += 12; return [x, Number(m)]; }
function precios(txt: string) {
  const v = [...txt.matchAll(/(?<!\+\s?)\$\s?(\d{1,3}(?:\.\d{3})+)/g)].map((m) => Number(m[1].replace(/\./g, ""))).filter((n) => n >= 5000 && n <= 5000000);
  return v.length ? { desde: Math.min(...v), hasta: Math.max(...v) } : { desde: null, hasta: null };
}
const venueInfo = (nombre: string) => VENUES.find(([re]) => re.test(nombre))?.[1];
const cacheGeo: Record<string, { lat: number; lng: number }> = {};
async function geocodificar(venue: string) {
  if (cacheGeo[venue]) return cacheGeo[venue];
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(venue + ", Bogotá")}`, { headers: UA }).then((x) => x.json());
    cacheGeo[venue] = r[0] ? { lat: +r[0].lat, lng: +r[0].lon } : BOGOTA;
  } catch { cacheGeo[venue] = BOGOTA; }
  await new Promise((r) => setTimeout(r, 1100)); // política de uso de Nominatim: 1 consulta por segundo
  return cacheGeo[venue];
}
function clasificar(titulo: string, descripcion: string) {
  const base = titulo + " " + descripcion.slice(0, 600);
  const generos = [...new Set(GENEROS.filter(([re]) => re.test(base)).map(([, g]) => g))].slice(0, 3);
  const formato = /festival/i.test(base) ? "Festival" : generos.includes("Clásica") ? "Orquesta" : /\bdj\b|dj set/i.test(base) ? "DJ set" : /ac[uú]stic|unplugged/i.test(base) ? "Acústico" : "En vivo";
  return { generos: generos.length ? generos : ["Otros"], formato };
}

// ---------- Tuboleta ----------
async function tuboleta() {
  const html = await get("https://tuboleta.com/es/categorias/conciertos");
  const tarjetas = html.split("<article").slice(1).map((a) => {
    const href = a.match(/href="(\/es\/eventos\/[^"]+)"/)?.[1];
    const img = a.match(/<img[^>]+src="([^"]+)"/)?.[1];
    const spans = [...a.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => texto(m[1])).filter(Boolean);
    return href ? { url: "https://tuboleta.com" + href, img: img ? "https://tuboleta.com" + img.replace(/&amp;/g, "&") : "", titulo: spans[0], venue: spans[1], ciudad: spans[2] } : null;
  }).filter((t) => t && /bogot/i.test(t.ciudad || "")) as { url: string; img: string; titulo: string; venue: string; ciudad: string }[];
  const unicas = [...new Map(tarjetas.map((t) => [t.url, t])).values()];
  return enLotes(unicas, 6, async (t) => {
    const h = await get(t.url);
    const txt = texto(h);
    let ld: any = {};
    try { ld = JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])["@graph"].find((x: any) => /Event/.test(x["@type"])) || {}; } catch { /* sin datos estructurados */ }
    const m = txt.match(/(\d{1,2}) ([A-Za-zé]{3,10}) \/ (\d{4}) [A-Za-zéá]{2,4} \/ (\d{1,2}):(\d{2}) ?([AaPp])\.? ?[Mm]/);
    let fecha: string | null = null;
    if (m && MESES[m[2].toLowerCase()]) { const [hh, mm] = hora24(m[4], m[5], m[6]); fecha = fechaBogota(+m[3], MESES[m[2].toLowerCase()], +m[1], hh, mm); }
    else if (ld.startDate) { const d = ld.startDate.slice(0, 10).split("-").map(Number); fecha = fechaBogota(d[0], d[1], d[2]); }
    if (!fecha) return null;
    const descripcion = (h.match(/<meta name="description" content="([^"]*)"/)?.[1] || "").replace(/&[a-z#0-9]+;/g, " ");
    const edad = txt.match(/Edad m[ií]nima:? ?(\d+)/i)?.[1];
    const imagen = (ld.image?.url || "").replace(/^http:/, "https:") || t.img;
    const titulo = tituloBonito(limpiarTitulo(t.titulo || ld.name || ""));
    return { titulo, venue: t.venue, fecha, imagen, url: t.url, descripcion: descripcion || txt.slice(0, 300), edad, precios: precios(txt), fuente: "tuboleta", venta: "Tuboleta" };
  });
}

// ---------- Movistar Arena (El Corazón de Bogotá) ----------
// Su sitio es WordPress: la lista de eventos sale de su API pública (wp-json) y la fecha de cada página.
const NO_CONCIERTO = /show de|unipersonal|stand ?up|comedia|news|educaci[oó]n|conferencia|juanpis|charla|foro\b/i;
async function movistarArena() {
  const lista = await fetch("https://elcorazondebogota.com/wp-json/wp/v2/evento?per_page=80&_fields=link,title", { headers: UA }).then((r) => r.json());
  const es = (lista as { link: string; title: { rendered: string } }[]).filter((e) => e.link.includes("/eventos/"))
    .map((e) => ({ url: e.link, titulo: texto(e.title.rendered) })).filter((e) => !NO_CONCIERTO.test(e.titulo));
  return enLotes(es, 6, async (e) => {
    const h = await get(e.url);
    const txt = texto(h);
    const m = txt.match(/(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo),? (\d{1,2}) (?:de )?([a-zé]+) (?:de )?(\d{4})/i);
    if (!m || !MESES[m[2].toLowerCase()]) return null;
    const hm = txt.match(/Inicio del Show ?: ?(\d{1,2}):(\d{2}) ?([ap])/i) || txt.match(/(\d{1,2}):(\d{2}) ?([ap])\.? ?m/i);
    const [hh, mm] = hm ? hora24(hm[1], hm[2], hm[3]) : [20, 0];
    const compra = [...h.matchAll(/href="(https?:\/\/[^"]*(?:tuboleta|ticketmaster|eticket|ticketshop|taquillalive|primerafila|passline)[^"]*)"/gi)].map((x) => x[1].replace(/&amp;/g, "&"))[0];
    const og = h.match(/property="og:image" content="([^"]+)"/)?.[1];
    const descripcion = texto(h.match(/<meta name="description" content="([^"]*)"/)?.[1] || "");
    return { titulo: tituloBonito(limpiarTitulo(e.titulo)), venue: "Movistar Arena", fecha: fechaBogota(+m[3], MESES[m[2].toLowerCase()], +m[1], hh, mm), imagen: og || "",
      url: e.url, compra: compra || e.url, descripcion, edad: txt.match(/Edad m[ií]nima:? ?(\d+)/i)?.[1], precios: { desde: null, hasta: null }, fuente: "movistar arena",
      venta: compra ? new URL(compra).hostname.replace("www.", "").split(".")[0].replace(/^\w/, (c) => c.toUpperCase()) : "Movistar Arena" };
  });
}

Deno.serve(async () => {
  const resumen: Record<string, number | string> = {};
  const [tb, ma] = await Promise.all([tuboleta().catch((e) => { resumen.error_tuboleta = String(e); return []; }), movistarArena().catch((e) => { resumen.error_movistar = String(e); return []; })]);
  const ahora = Date.now();
  const tuboletaValidos = tb.filter(Boolean).filter((e: any) => new Date(e.fecha).getTime() > ahora - 6 * 3600e3) as any[];
  // Si el Movistar Arena ya está en Tuboleta ese mismo día, no se repite
  const diasArena = new Set(tuboletaValidos.filter((e) => /coraz[oó]n de bogot|movistar/i.test(e.venue)).map((e) => e.fecha.slice(0, 10)));
  const arenaValidos = (ma.filter(Boolean) as any[]).filter((e) => new Date(e.fecha).getTime() > ahora - 6 * 3600e3 && !diasArena.has(e.fecha.slice(0, 10)));
  const todos = [...tuboletaValidos, ...arenaValidos];
  const filas = [];
  for (const e of todos) {
    const info = venueInfo(e.venue);
    const pos = info || (await geocodificar(e.venue));
    const { generos, formato } = clasificar(e.titulo, e.descripcion || "");
    const fecha = new Date(e.fecha);
    filas.push({
      titulo: e.titulo, portada: e.imagen || "assets/mapa-bogota.jpg", generos, formato,
      tipo_venue: info?.tipo || (/teatro|auditorio|sala/i.test(e.venue) ? "Teatro" : /parque|aire libre/i.test(e.venue) ? "Al aire libre" : "Club"),
      edad: e.edad ? `+${e.edad}` : "Todo público", fecha: e.fecha, nota_fecha: "Información de la cartelera oficial",
      venue: info?.nombre || e.venue, direccion: "Bogotá", lat: pos.lat, lng: pos.lng,
      precio_desde: e.precios.desde, precio_hasta: e.precios.hasta,
      descripcion: (e.descripcion || "").slice(0, 600) || `${e.titulo} en ${e.venue}, ${fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long" })}.`,
      venta_nombre: e.venta, venta_url: e.compra || e.url, estado: "publicado", fuente: e.fuente, fuente_url: e.url,
    });
  }
  const { error } = filas.length ? await sb.from("eventos").upsert(filas, { onConflict: "fuente_url" }) : { error: null };
  resumen.tuboleta = tuboletaValidos.length;
  resumen.movistar_arena = arenaValidos.length;
  resumen.guardados = error ? 0 : filas.length;
  if (error) resumen.error_guardar = error.message;
  return new Response(JSON.stringify(resumen), { headers: { "Content-Type": "application/json" } });
});
