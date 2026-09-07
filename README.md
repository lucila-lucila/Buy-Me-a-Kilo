# Buy Me a Kilo

Una alcancía de viaje anónima. Una sola valija de 23 kilos, una sola persona, y
un contador que sube. Cada aporte llena un kilo y devuelve un sticker al azar de
una colección de doce.

No es una plataforma. Hay una sola valija y no es de nadie más.

## Reglas que el código tiene que sostener

1. **No se guarda ningún dato de quien aporta.** El webhook de Ko-fi manda
   nombre, mail, mensaje y dirección de envío: se descartan en el parseo y no se
   loguean nunca, ni en consola. Lo único que persiste son contadores enteros
   agregados.
2. **La colección vive en el localStorage de cada persona.** Sin cuentas, sin
   login, sin tabla de usuarios.
3. **Sin cookies de terceros ni analytics con cookies.**
4. **El contador es real.** Si KV se cae se muestra el último valor conocido, no
   un número inventado.
5. **La capa de economía no puede llegar al cliente.** Montos, comisiones y
   metas internas viven solo en `api/`. Ninguna de esas env vars lleva prefijo
   `VITE_`, y `npm run check:leak` corre en cada build para verificarlo.

## Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173  (y /open.html para la revelación)
npm run build      # tsc + vite build + check-leak
npm run typecheck
```

`npm run dev` alcanza para ver las tres pantallas sin Redis ni `vercel dev`: un
plugin de Vite (`mockApi` en `vite.config.ts`) contesta `/api/kilos` y
`/api/share`, y sirve `/open` sin extensión igual que en producción. Solo corre
en `vite dev`, así que no existe en el build.

Los estados se fuerzan desde la URL:

| URL | Qué muestra |
|---|---|
| `/` | 214 kg totales, 6 de la semana |
| `/?over` | semana en 14: la valija en OVERWEIGHT, perdiendo por abajo |
| `/?kg=12` | por debajo del umbral: sin número grande, solo la barra |
| `/?kg=1204&week=3` | cualquier combinación |
| `/open` | tira un sticker al azar y corre la coreografía |
| `/open?sticker=sticker_12` | fuerza uno: sirve para la rara, la maldita y el duplicado |

Entrando dos veces a la misma `?sticker=` sale el estado de duplicado. Para
volver a empezar con la colección vacía: `localStorage.clear()` en la consola.

`npm run dev:host` expone el server en la red local, para abrirlo desde el
teléfono y revisar el fold en un 360 de verdad.

Las funciones de `api/` corren en Vercel. `vercel dev` las levanta de verdad
contra KV cuando haga falta probar el webhook.

## Estructura

```
index.html / open.html      dos entries, sin router: /open no carga el JS del hero
api/kofi-webhook.ts         POST de Ko-fi -> contadores
api/kilos.ts                GET publico, devuelve { total, week } y nada mas
api/stats.ts                dashboard privado, 404 sin key
api/share.ts                contador de tarjetas generadas
api/_lib/economy.ts         precios, comisiones y metas. SOLO SERVIDOR.
src/config/tiers.ts         los cuatro tiers, sin precios
src/config/stickers.ts      los doce stickers y los pesos de rareza
src/config/goals.ts         WEEKLY_GOAL_KG y COUNTER_THRESHOLD_KG
src/copy.ts                 todo el texto
src/lib/shareCard.ts        la tarjeta 1080x1350, compuesta en canvas
scripts/check-leak.mjs      falla el build si la economia se filtro a dist/
public/                     las quince ilustraciones, servidas estaticas
```

## Variables de entorno

Copiá `.env.example` y cargalas en Vercel. Ninguna lleva prefijo `VITE_`.

Las mínimas para que funcione: `KOFI_VERIFICATION_TOKEN`, `KV_REST_API_URL`,
`KV_REST_API_TOKEN` y `STATS_SECRET`.

Si agregás una variable de servidor nueva, sumala a `ECONOMY_ENV` en
`scripts/check-leak.mjs`: es la lista contra la que el build verifica que nadie
le puso prefijo `VITE_`. Las `VITE_VERCEL_*` que inyecta Vercel están excluidas
a propósito, son públicas por diseño y no tienen nada nuestro adentro.

## Valijas numeradas

La página muestra siempre una valija en curso. Cuando se llena a los 23 kilos se
cierra y arranca la siguiente, así que nunca se ve ni vacía ni desbordada, y el
exceso es el chiste en vez del problema.

Todo se deriva de dos enteros de KV más el arrastre, en `api/_lib/journey.ts`.
Nada se guarda por separado, así que no se puede desincronizar:

```
totalKilos     = SEED_KILOS  + total_kilos
totalPeople    = SEED_PEOPLE + count_contrib_total
suitcaseNumber = floor(totalKilos / 23) + 1
kilosInCurrent = totalKilos % 23
```

Las personas son los aportes, que ya se contaban en `count_contrib_total`. No se
creó una clave nueva para lo mismo: dos contadores del mismo hecho se
desincronizan el día que una escritura falle y no hay forma de saber cuál miente.

**El contador es monótono.** Solo lo mueve el webhook de un aporte, y no existe
ninguna operación que lo baje. La valija es el registro histórico de lo que se
fue llenando, no el saldo disponible: retirar la plata de Ko-fi no lo toca, y un
reembolso se anota en el dashboard privado, nunca restando kilos. El número de
valija nunca retrocede.

Por eso `SEED_KILOS` y `SEED_PEOPLE` tienen el valor real como default en el
código y no cero: si las variables se borraran, con cero la valija saltaría de
la #13 a la #1.

El estado **departed** (`daysRemaining` en 0) está contemplado en el shape y en
el copy, pero todavía sin implementar en detalle.

## Conectar la base

Vercel → Storage → la base de Upstash → Connect, con el prefijo VACÍO, para que
las variables queden con los nombres canónicos `KV_REST_API_URL` y
`KV_REST_API_TOKEN`, que es lo que el código lee por acceso estático. Después,
un deploy nuevo: las env vars solo entran en deploys posteriores a su carga.

Dos trampas que ya nos costaron una tarde:

- Si el proyecto ya tiene esas dos variables, aunque estén vacías, el diálogo de
  Connect se niega a seguir y ofrece ponerles un prefijo. La salida es borrar las
  vacías primero, no aceptar el prefijo.
- Una variable cargada con valor vacío se ve igual que una cargada bien en el
  panel, y el contador queda en null sin decir por qué. `npm run check:config`
  ahora lo avisa en el log del build, y `/api/stats` lo marca como `vacía` en
  `kvEnv.staticAccess`.

Para diagnosticar: `/api/stats?key=<STATS_SECRET>` devuelve `kvEnv` incluso
cuando la conexión falla, con los nombres que ve la función y si su valor se
puede leer. Nombres y estados, nunca valores.

## Ko-fi

1. Creá los cuatro items de la tienda y anotá el `direct_link_code` de cada uno
   (la parte final de `ko-fi.com/s/<code>`).
2. Pegalos en `src/config/tiers.ts`, reemplazando los `PLACEHOLDER_*`, y cargá
   `KOFI_USERNAME` con tu usuario.

   Mientras falten, esos tiers se dibujan apagados y sin link, y bajo la escalera
   dice `The shop is not open yet.` A propósito: un usuario de Ko-fi puesto a ojo
   manda a quien quiere pagarte al perfil de un desconocido, que es peor que un
   botón que no anda. `npm run check:config` lo avisa en cada build.

   Cuando salga a la calle, poné `REQUIRE_KOFI_CONFIG=1` en Vercel: a partir de
   ahí un deploy sin los códigos cargados falla en vez de publicar cuatro botones
   muertos.
3. En Ko-fi → Settings → API: pegá la URL del webhook
   (`https://<dominio>/api/kofi-webhook`) y copiá el verification token a la env
   var.
4. En cada item, poné `https://<dominio>/open` como URL de redirección.

El webhook mapea los kilos por `direct_link_code`, no por monto: un descuento o
un cambio de precio no puede desalinear el contador. La escalera por monto queda
solo como respaldo para las donations sueltas.

El dominio del pie de la tarjeta para compartir sale del host desde el que se
abrió la página (`src/lib/domain.ts`), no de una constante: funciona igual en un
preview, en el dominio final, y el día que cambie no hay que acordarse de tocar
nada. `copy.domain` es solo el respaldo para localhost.

El tier de overweight es el único que necesita una dirección, y la nota del botón
lo dice. La dirección la recibe y la guarda Ko-fi: la despachás desde su panel, y
el campo `shipping` del webhook se descarta como todo el resto.

Los pagos en una moneda distinta de USD no suman kilos (no inventamos tipo de
cambio) y quedan contados aparte, marcados en el dashboard: si aparecen seguido
es que hay algo mal configurado en Ko-fi.

El neto promedio esperado por aporte no se carga: sale de `EXPECTED_MIX` y de las
comisiones. Es la referencia contra la que el dashboard mide la desviación de
cada semana, y cargado a mano queda viejo apenas cambia una comisión.

Ni ese valor ni `KOFI_USERNAME` son env vars. Si quedaron cargadas en Vercel de
una versión anterior no rompen nada, y `npm run check:config` las lista en el log
del build para poder borrarlas cuando haya tiempo.

## Dashboard privado

`GET /api/stats?key=<STATS_SECRET>` devuelve JSON con bruto, neto estimado,
ticket promedio, distribución por tier contra la mezcla esperada, en qué piso
cayó la semana y la proyección al ritmo de las últimas tres.

Sin key válida devuelve 404, no 401: no tiene que notarse que existe. Nada de
esto se muestra nunca en la página pública.

## El número de serie

Cada revelación pide un número a `/api/serial`, que es un `INCR` sobre un entero
y no guarda nada sobre quién lo pidió. Va bajo el sticker y en el pie de la
tarjeta para compartir, que es lo que hace que la de cada persona sea distinta.

No es un certificado: como nadie registra a quién le tocó cuál, después no se
puede verificar. Es una marca. Y como `/open` es abierta a propósito, el número
sube también con quien entra sin pagar; en el dashboard eso se ve como
`stickersHandedOut` contra `contributions`.

Si KV no responde, la tarjeta sale sin la línea. Nunca con un número inventado.

## Responsive

Escala tipográfica fluida en `src/styles/tokens.css`: siete curvas `clamp()`
interpoladas sobre el mismo rango, de 360px a 1440px. Ningún componente escribe
su propio `clamp` ni su propio tamaño fijo, así que no hay saltos.

Tres breakpoints, declarados juntos y comentados en `global.css`: uno de ancho
(620px, los tiers pasan a dos columnas), uno de altura (700px, el hero se
comprime para que los cuatro tiers entren antes del fold) y uno de horizontal.
Los valores del de altura van atados a `svh`, así que la compresión es continua
y no hace falta un escalón aparte para pantallas muy bajas.

`npm run audit:responsive` recorre diez viewports por las dos páginas y verifica
que no haya scroll horizontal, que los cuatro tiers entren antes del fold donde
la altura alcanza, que ningún texto se desborde y que el carrusel mantenga la
velocidad. Necesita Playwright, que a propósito no es dependencia del proyecto:
`npm i --no-save playwright` antes de correrlo.

## Assets

Las quince ilustraciones están en `public/`, servidas estáticas. Los `masters/`
a 2048 se guardan aparte y no van al repo.

Todas tienen fondo negro real y se montan con `mix-blend-mode: screen`, así que
el negro desaparece contra el fondo de la página. Dos cosas que hay que respetar
si se reexportan:

- El contenedor de cualquier imagen con `screen` necesita un fondo **opaco**
  (`.suitcase`, `.grid__cell`, `.stage`). Sobre un backdrop transparente el
  blend no se aplica y aparece un cuadrado negro.
- Nada de `perspective` ni `transform-style: preserve-3d` en un ancestro:
  Chromium desactiva `mix-blend-mode` dentro de un contexto 3D. El tilt del
  sticker usa `transformPerspective` dentro del propio transform por eso.

La valija se monta con la onda SVG abajo y `hero_suitcase.webp` encima. Las
medidas de la cavidad están en `CAVITY`, dentro de `src/components/Suitcase.tsx`,
y salen de medir la imagen: si se reexporta la valija, hay que volver a medirlas.
`hero_suitcase_interior_claro.webp` es la alternativa con el interior más suave.
