// RIFF · iconos.js
// Íconos de línea minimalistas (trazo 1.5, puntas redondeadas, retícula de 24 px),
// en el estilo del kit «Music and Podcasts – Mobile App» de Figma.
// Reemplaza el contenido del sprite que trae cada página (<symbol id="i-…">)
// y los íconos que dibuja riff.js, sin tocar el HTML de las pantallas.

export const ICONOS_MIN = {
  house: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
  map: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  user: '<circle cx="12" cy="8" r="3.75"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  users: '<circle cx="9" cy="8.5" r="3.25"/><path d="M3.5 19.5c.6-3 2.7-4.75 5.5-4.75s4.9 1.75 5.5 4.75"/><path d="M15.5 5.5a3 3 0 0 1 0 6M17.5 14.9c1.6.5 2.7 2 3 4.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  bookmark: '<path d="M6.5 4.5h11v16L12 16.5l-5.5 4z"/>',
  "map-pin": '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.25"/>',
  ticket: '<path d="M3.5 7.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5z"/><path d="M14.5 6v1.5M14.5 11.25v1.5M14.5 16.5V18"/>',
  share: '<path d="M12 15V4M8 7.5 12 3.5l4 4"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16"/>',
  "external-link": '<path d="M13.5 4.5h6v6M19.5 4.5 11 13"/><path d="M18 14v4a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7.5A1.5 1.5 0 0 1 6 6h4"/>',
  wallet: '<rect x="3.5" y="6.5" width="17" height="13" rx="3"/><path d="M17 6.5V5.2a1.2 1.2 0 0 0-1.5-1.15L6 6.5"/><path d="M20.5 11h-3.5a2 2 0 0 0 0 4h3.5"/>',
  x: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  "chevron-left": '<path d="m14.5 6-6 6 6 6"/>',
  "chevron-right": '<path d="m9.5 6 6 6-6 6"/>',
  "chevron-down": '<path d="m6 9.5 6 6 6-6"/>',
  "sliders-horizontal": '<path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9"/><circle cx="15" cy="7.5" r="2"/><circle cx="9" cy="16.5" r="2"/>',
  music: '<path d="M9 17.5V6l10-2.5V15"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
  pencil: '<path d="M14.5 5.5l4 4L9 19H5v-4z"/><path d="m12.5 7.5 4 4"/>',
  "triangle-alert": '<path d="M10.3 4.9 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 16.8v.2"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
  "refresh-cw": '<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  "trending-up": '<path d="m3.5 17 6-6 4 4 7-7.5"/><path d="M15.5 7.5h5v5"/>',
  store: '<path d="M4.5 10v8.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V10"/><path d="M3.5 6.5 5 4h14l1.5 2.5a3 3 0 0 1-5.6 1.5 3 3 0 0 1-5.8 0 3 3 0 0 1-5.6-1.5z"/><path d="M10 20v-4.5h4V20"/>',
  route: '<circle cx="6.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="M9 6h7.5a3 3 0 0 1 0 6h-9a3 3 0 0 0 0 6H15"/>',
  paperclip: '<path d="m19 11.5-7.2 7.2a4.5 4.5 0 0 1-6.4-6.4l7.6-7.6a3 3 0 0 1 4.2 4.2l-7.4 7.4a1.5 1.5 0 0 1-2.1-2.1l6.6-6.6"/>',
  "log-out": '<path d="M10 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3"/><path d="m14.5 8 4 4-4 4M18.5 12h-9"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
  link: '<path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.75"/>',
  "circle-help": '<circle cx="12" cy="12" r="8.5"/><path d="M9.75 9.5a2.3 2.3 0 0 1 4.5.6c0 1.6-2.25 2-2.25 3.4M12 16.5v.2"/>',
  "chart-column": '<path d="M4 20h16M7 16.5v-4M12 16.5v-9M17 16.5v-6"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
  "wifi-off": '<path d="m3.5 3.5 17 17"/><path d="M8.6 15.4a5 5 0 0 1 5.2-1M5.5 12.3a9.6 9.6 0 0 1 3.4-2.1M18.5 12.3a9.6 9.6 0 0 0-4.6-2.6M2.5 9a14 14 0 0 1 3.3-2.3M21.5 9A14 14 0 0 0 11 5.6M12 19v.2"/>',
  shuffle: '<path d="M3.5 7h2.8a4 4 0 0 1 3.3 1.7l4.8 6.6a4 4 0 0 0 3.3 1.7h2.8M3.5 17h2.8a4 4 0 0 0 3.3-1.7M14.4 8.7A4 4 0 0 1 17.7 7h2.8"/><path d="m18 4.5 2.5 2.5-2.5 2.5M18 14.5l2.5 2.5-2.5 2.5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  navigation: '<path d="M20 4 4 10.5l7 2.5 2.5 7z"/>',
  "message-circle": '<path d="M12 20.5a8.5 8.5 0 1 0-7.4-4.3l-1.1 4.3 4.3-1.1a8.5 8.5 0 0 0 4.2 1.1z"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="9.5" r="1.5"/><path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 19"/>',
  hourglass: '<path d="M7 3.5h10M7 20.5h10"/><path d="M8 3.5v3a4 4 0 0 0 2 3.5l2 2 2-2a4 4 0 0 0 2-3.5v-3M8 20.5v-3a4 4 0 0 1 2-3.5l2-2 2 2a4 4 0 0 1 2 3.5v3"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  "cloud-upload": '<path d="M7 18a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 8.5a4.25 4.25 0 0 1 .5 9.5"/><path d="M12 20v-7M9.25 15.5 12 12.75l2.75 2.75"/>',
  camera: '<rect x="3.5" y="6.5" width="17" height="13" rx="3"/><path d="M8.5 6.5 10 4h4l1.5 2.5"/><circle cx="12" cy="13" r="3.25"/>',
  "badge-check": '<path d="m12 3.5 2.2 1.5 2.6-.1.8 2.5 2.1 1.6-.9 2.5.9 2.5-2.1 1.6-.8 2.5-2.6-.1L12 20.5 9.8 19l-2.6.1-.8-2.5-2.1-1.6.9-2.5-.9-2.5 2.1-1.6.8-2.5 2.6.1z"/><path d="m9 12 2 2 4-4"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7.5 7.5 5.5 7.5-5.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2"/>',
  locate: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
  sparkles: '<path d="M12 4c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6z"/><path d="M18.5 15.5c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5z"/>',
  upload: '<path d="M12 15V4.5M8 8.5l4-4 4 4"/><path d="M4.5 14.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5"/>',
};
ICONOS_MIN.pin = ICONOS_MIN["map-pin"];

// Cambia el sprite de la página por los íconos minimalistas
export function aplicarIconos(raiz = document) {
  raiz.querySelectorAll('symbol[id^="i-"]').forEach((s) => {
    const nuevo = ICONOS_MIN[s.id.slice(2)];
    if (!nuevo) return;
    s.setAttribute("viewBox", "0 0 24 24");
    s.innerHTML = nuevo;
  });
}
