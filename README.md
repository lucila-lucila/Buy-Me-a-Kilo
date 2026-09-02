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

## Dashboard privado

`GET /api/stats?key=<STATS_SECRET>` devuelve JSON con bruto, neto estimado,
ticket promedio, distribución por tier contra la mezcla esperada, en qué piso
cayó la semana y la proyección al ritmo de las últimas tres.

Sin key válida devuelve 404, no 401: no tiene que notarse que existe. Nada de
esto se muestra nunca en la página pública.

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
