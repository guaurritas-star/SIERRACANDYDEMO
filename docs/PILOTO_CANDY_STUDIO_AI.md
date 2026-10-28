# Candy Studio AI — Checklist para piloto privado

> Código preparado para evaluación, **no producción pública ni suscripciones**.
> Este documento describe requisitos aún manuales. Crear archivos de reglas no los despliega.

## Lo que ya hace esta rama

- Pantalla de inicio dual: Digitalizar catálogo o Crear mi marca con IA.
- Brand Discovery: brief, autenticación Google, una solicitud a Gemini, edición de diagnóstico, elección de 3 estilos prediseñados y guardado en un perfil compartido.
- Los requests a `/api/gemini/*` y `/api/uploads` incluyen Firebase ID token desde la sesión del usuario.
- Express verifica tokens mediante el endpoint oficial Firebase Authentication `accounts:lookup`, restringe usuarios sin correo verificado y aplica cuotas iniciales por UID y por proceso.
- Solamente un modelo Gemini configurable `GEMINI_MODEL`, por defecto `gemini-3.1-flash-lite`. No hay sustitución automática por un modelo más costoso.
- El servidor registra conteos de tokens que devuelve el proveedor (no montos cobrados).
- `firestore.rules` contiene nuevas validaciones para `brandProfile`.
- Las imágenes en producción solo se aceptan si hay almacenamiento persistente configurado en Cloud Storage. No se hace respaldo silencioso en base64.
- Smoke test automatizado asegura que seis endpoints privilegiados rechazan requests anónimos con HTTP 401.

## Configuración necesaria ANTES de probar el flujo completo

1. Crear un **ambiente de pruebas independiente** en Google Cloud / Cloud Run, usando el mismo código del proyecto. No publicar todavía a clientes.
2. Registrar `GEMINI_API_KEY` como secreto del backend. Nunca incluirlo en Vite ni exponerlo mediante GitHub Pages.
3. Configurar Firebase Authentication (proveedor Google) y agregar el dominio de pruebas a **Authorized domains**.
4. Publicar los cambios de `firestore.rules` en la **base de datos Firestore correcta** (ver `firebase-applet-config.json`), previa revisión de permisos; un archivo en GitHub por sí solo no actualiza las reglas en Firebase.
5. Crear un bucket privado de Google Cloud Storage dedicado a pruebas, configurar `CANDY_UPLOAD_BUCKET` y conceder a la identidad de servicio Cloud Run permisos mínimos de objeto `storage.objects.create` y `storage.objects.get`. Requiere revisar cuotas y facturación. No usar `allUsers` para abrir el bucket.
6. Definir `GEMINI_MODEL`, `AI_DAILY_REQUESTS_PER_USER`, `AI_DAILY_REQUESTS_GLOBAL` y `UPLOAD_DAILY_REQUESTS_PER_USER`. Para piloto: 20 / 200 / 80, respectivamente, son defaults de referencia.
7. Utilizar `PORT` ofrecido por Cloud Run. Express ya lo lee; GitHub Pages no ejecuta este backend.

## Prueba manual de punta a punta (requiere servicios reales)

- [ ] Entrar a Candy Studio AI y elegir **Crear mi marca**.
- [ ] Confirmar que no es posible generar antes de iniciar sesión.
- [ ] Iniciar sesión con Google y solicitar una propuesta para una marca de prueba.
- [ ] Comprobar una respuesta genuina de Gemini (no es un resultado simulado).
- [ ] Editar giro, público y descripción, elegir un estilo y **guardar ADN de marca**.
- [ ] Recargar, iniciar sesión nuevamente y verificar que conserva el ADN de marca en Firestore.
- [ ] Continuar hacia **Digitalizar catálogo** y verificar que recupera nombre, giro y público desde el perfil.
- [ ] Subir un PDF de 5–10 productos, revisar extracciones y guardar fotografías.
- [ ] Volver a cargar la página, confirmar persistencia de imágenes y productos.
- [ ] Comprobar que una cuenta diferente no puede escribir en el tenant del primer usuario.
- [ ] Comprobar que 21 solicitudes a Gemini en el mismo día activan una respuesta 429 cuando el límite por usuario es 20 (en una sola instancia).
- [ ] Comprobar que Google Cloud Storage responde con las imágenes desde URLs públicas sin habilitar acceso anónimo directo al bucket.

## Límites pendientes

**Cuotas:** las cuotas en memoria sirven para un piloto controlado de una sola instancia. NO constituyen protección financiera fuerte ni cuotas contractuales en multi-instancia, porque se reinician al escalar o desplegar. Antes de vender, implementar contadores transaccionales distribuidos por tenant, alertas y límites de facturación en el proveedor.

**Persistencia:** la autenticación y el guardado remoto no se pueden validar desde GitHub Actions sin un ambiente de Firebase de pruebas y credenciales. Ningún resultado de CI demuestra que las reglas fueron publicadas o que Gemini generó un resultado real.

**Imagen:** Google Cloud Storage debe configurarse. Sin `CANDY_UPLOAD_BUCKET` el backend rechaza cargas en producción (503) por seguridad. La gestión completa de borrado, ciclos de vida, costos de lectura y almacenamiento sigue pendiente.

**Brand Studio:** esta entrega no genera logotipos finales ni hace una auditoría de originalidad de marca. Los tres estilos visuales son ejemplos editables, NO diseños de logo creados por IA. El Logo Lab y estudio de contenido llegarán en iteraciones separadas.

**Privacidad:** antes de clientes de pago, revisar el aviso de privacidad, conservación de archivos, eliminación, permisos de usuarios y contratos de tratamiento de datos.

## CI

`.github/workflows/deploy-pages.yml` ejecuta en cada PR:

- `bun install --frozen-lockfile`
- `bun run lint` (TypeScript)
- `bun run build` (Vite)
- `node scripts/security-smoke.mjs` (servidor Express y rechazo de acceso anónimo)

Un PR no se publica. GitHub Pages solo aloja la SPA estática. Para probar Gemini o carga de archivos, desplegar un backend propio en Cloud Run y utilizar su URL full-stack.
