# Decisiones del design kit · RIFF

Estas decisiones salen del design system que el equipo ya definió en Figma («RIFF · Alta fidelidad»: swatches, estilos de texto y variables) y de revisar cómo se usa cada valor en las 72 pantallas de `disenos/prototipo.html`. Viven en `css/tokens.css` (valores) y `css/components.css` (componentes). El catálogo para verlos es `componentes.html`.

> Para cambiar algo: se cambia aquí y en el kit, nunca directo en una pantalla.

> **Nov 2026:** la app hoy se ve con la capa **vidrio líquido** encima de este kit. Está al final de este documento («Capa vidrio líquido») y en el catálogo.

## Colores

| Token | Valor | Por qué |
|---|---|---|
| `--color-fondo` | `#100310` | Fondo oscuro único de la app (variable `bg/base` de Figma). |
| `--color-superficie` | `#633866` al 30 % | Tarjetas, campos y botones secundarios (`surface/default`). |
| `--color-superficie-profunda` | `#633866` | Cajas de ícono y fondo de imágenes (`surface/deep`). |
| `--color-superficie-solida` | `#2a1029` | Chips y hojas inferiores, que necesitan fondo opaco (`surface/solid`). |
| `--color-primario` | `#e199d1` | Acción principal, enlaces e íconos activos (`brand/primary`). |
| `--color-primario-hover` | `#eab4de` | Nuevo: el primario un poco más claro al pasar el mouse. No existía en Figma porque Figma no tiene hover. |
| `--color-secundario` | `#765ba3` | Chips seleccionados, botón de filtros, etiqueta de género (`brand/secondary`). |
| `--color-acento` | `#cb6e74` | Avisos suaves, «Sorpréndeme», punto de notificación (`brand/accent`). |
| `--color-texto` | `#ffffff` | Texto principal (`text/primary`). |
| `--color-texto-suave` | blanco al 65 % | Texto de apoyo y etiquetas de campo (`text/secondary`). |
| `--color-texto-tenue` | blanco al 38 % | Botón deshabilitado y días pasados del calendario. |
| `--color-texto-sobre-primario` | `#100310` | Texto encima del rosa, para que tenga contraste (`text/on-primary`). |
| `--color-borde` | blanco al 12 % | Borde de tarjetas y campos (`border/subtle`). |
| `--color-exito` | `#8fd6a7` | Nuevo: «Dentro de tu presupuesto». El design system no tenía un verde y hacía falta para distinguirlo de «Fuera». |
| `--color-error` | `#933a50` | Errores, +18, rechazado y cancelar (`status/danger`). |
| `--gradiente-marca` | `#765ba3 → #e199d1 → #cb6e74` | Splash, pantallas de éxito y barras de progreso. |

## Tipografía

| Token | Valor | Por qué |
|---|---|---|
| `--fuente-titulos` | Unbounded Bold | Títulos de la marca, siempre en minúscula («tu feed», «mi perfil»). |
| `--fuente-texto` | Lunasima 400 y 700 | Todo el texto de lectura, botones y campos. |
| `--fuente-cifras` | Anton | Números grandes: métricas del organizador y días del calendario. |
| Escala | 12 · 14 · 16 · 17 · 20 · 24 · 32 · 48 px | Son exactamente los estilos de texto de Figma (Cuerpo 12/14/16, Título H4/H3/H2/H1, Cifras 48). |
| Pesos | 400 y 700 | Solo se usan esos dos. |

Las tres fuentes se cargan desde Google Fonts al inicio de `tokens.css`, así se ven igual en cualquier computador. La barra de estado del teléfono usa la fuente del sistema (SF Pro en iPhone) porque es parte del sistema operativo, no de RIFF.

## Espaciados

Múltiplos de 4 px, de `--espacio-1` (4 px) a `--espacio-8` (32 px). El margen lateral de todas las pantallas es 16 px (`--espacio-4`), igual que en Figma (`space/16`).

## Bordes y sombras

| Token | Valor | Por qué |
|---|---|---|
| `--radio-sm` | 8 px | Miniaturas de eventos. |
| `--radio-md` | 12 px | Botones y campos (`radius/control`). |
| `--radio-lg` | 16 px | Tarjetas (`radius/card`). |
| `--radio-total` | 999 px | Chips, etiquetas y botones circulares (`radius/pill`). |
| `--sombra-suave` / `--sombra-media` | — | La app casi no usa sombras: se reservan para avisos y diálogos que flotan sobre la pantalla. |
| `--alto-control` | 52 px | Botones y campos, como dice la descripción del componente Button en Figma (área táctil ≥ 44 px). |

## Componentes

| Componente | Variantes | Por qué |
|---|---|---|
| `.boton` | primario · `--secundario` · `--fantasma` · `--peligro` · deshabilitado · `--circulo` · `--pequeno` | Son los tipos del componente Button de Figma (Primario, Secundario, Ghost, Deshabilitado) más el de «Cerrar sesión» y los botones redondos de volver/compartir. |
| `.enlace` | — | «Inicia sesión», «Ver todos →», «Deshacer». |
| `.campo` | normal · `--error` · foco | Componente Input de Figma (Normal, Foco, Válido, Error). |
| `.busqueda` | normal · con foco | Componente Search bar. |
| `.chip` | normal · `--seleccionado` · `--removible` | Componente Chip (Default, Seleccionado, Removible). |
| `.etiqueta` | venue (base) · `--genero` · `--edad` · `--publicado` · `--revision` · `--rechazado` · `--dentro` · `--fuera` | Componente Badge con sus 8 tipos. |
| `.tarjeta` | base · `--destacada` · `--alerta` | Contenedor general de bloques. |
| `.tarjeta-evento` | — | Event card del feed. |
| `.fila-evento` | — | Event row de resultados, guardados y mapa. |
| `.encabezado` | — | Nav bar (volver + título). |
| `.navegacion` | ítem activo | Tab bar con Feed, Mapa, Calendario y Perfil. |
| `.segmentado` | opción activa | Tipo de cuenta del organizador y clasificación de edad. |
| `.metrica` | — | Metric tile del panel del organizador. |
| `.aviso` | — | Toast «Guardado en tu calendario». |
| `.dialogo` | acción principal · acción de peligro | Confirmaciones (salir de RIFF, cerrar sesión, cancelar evento). |
| `.progreso`, `.esqueleto`, `.caja-icono` | `.caja-icono--primario` · `--secundario` | Progreso de subida, estados de carga y cajas de ícono. |

## Capa vidrio líquido (nov 2026)

Es la capa visual que usa la app hoy. Vive en `css/glass.css` (app) y en `css/kit-glass.css` (la misma capa con las clases del kit, solo la carga `componentes.html`). Se carga después de los estilos base y solo sobrescribe: si se quita, todo vuelve a verse como el Figma original. Los colores de la marca no cambian.

| Token | Valor | Por qué |
|---|---|---|
| `--fondo-profundo` | manchas lila, rosa y vino sobre `#100310` | Sobre un fondo plano el vidrio no se nota; con profundidad sí. |
| `--vidrio` | degradado blanco del 12 % al 2,5 % | Superficie base de tarjetas, filas, métricas, campos, chips y botón secundario. |
| `--vidrio-luz` | línea blanca suave en el borde inferior | Da la sensación de grosor del vidrio. |
| `--vidrio-brillo` | línea blanca al 22 % arriba, por dentro | Reflejo del borde superior. |
| `--vidrio-borde` | blanco al 14 % | Borde fino de todas las superficies de vidrio. |
| `--vidrio-flotante` + `--desenfoque` | vidrio oscuro + `blur(24px) saturate(160%)` | Pestañas, hojas inferiores y diálogos: desenfocan lo que hay detrás y se leen sobre cualquier fondo. |
| `--rosa-vidrio` / `--rosa-borde` | rosa translúcido + borde rosa al 55 % | Único estado de selección (chips, pestaña activa, guardado). |
| `--primario-vidrio` | `#efbde4 → #e199d1 → #d68bc5` | Botón principal con volumen y un leve resplandor rosa. |
| Radios | controles 16 · filas y métricas 18 · tarjetas 20 · capas flotantes 26 · chips 999 px | Más redondos que en Figma, para que el vidrio se vea suave. |

| Cambio frente al Figma | Por qué |
|---|---|
| Chip seleccionado en **rosa** (antes lila) | Un solo color de selección en toda la app; lila queda para la etiqueta de género. |
| Etiquetas de edad (+18) y venue **neutras** (antes rojas) | El rojo se reserva para errores, rechazos y peligro. |
| Barra de pestañas **flotante** (12 px de los bordes) con una **gota de vidrio** que se desliza a la pestaña activa | Es el gesto principal de la capa y deja ver el contenido detrás. |
| Botones redondos sobre fotos en **vidrio oscuro con desenfoque** (`.boton--sobre-foto`) | El ícono se lee sobre cualquier portada. |
| Hojas inferiores (mapa, compartir) en vidrio con asa (`.hoja-vidrio`) | Mismo lenguaje que las pestañas. |
| Avisos de color: tiñen el **borde** y un poco el fondo | Una tarjeta entera de color pesaba demasiado. |
| Íconos de línea con trazo **1,5** (antes 2) | Más livianos, a juego con el vidrio. |
| «Hoy» del calendario en **rosa**; si ese día hay un evento guardado, el número va en negro | El rojo parecía un error y el número no se veía sobre el círculo. |

