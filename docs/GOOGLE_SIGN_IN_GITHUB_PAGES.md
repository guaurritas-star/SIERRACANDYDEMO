# Habilitar Google Sign-In en GitHub Pages

## Diagnóstico

La web se publica en `https://guaurritas-star.github.io/SIERRACANDYDEMO/`, pero usa Firebase Authentication del proyecto `gen-lang-client-0885029473`. Firebase necesita que **el hostname** de la web esté en la lista Authorized domains. El código de React o GitHub Actions no puede cambiar esta configuración administrativa del proyecto.

La aplicación ya utiliza `signInWithPopup` y ahora muestra el error real de Firebase, en lugar de esconderlo con un mensaje genérico.

## Acción imprescindible en Firebase Console (por alguien con permisos de administrador)

1. Entrar a https://console.firebase.google.com/project/gen-lang-client-0885029473/authentication/settings
2. Elegir **Authentication → Settings → Authorized domains**.
3. Pulsar **Add domain** e introducir exactamente **`guaurritas-star.github.io`**.
   - No incluir `https://`.
   - No añadir `/SIERRACANDYDEMO/`.
   - Evitar autorizar todo `github.io`: habilitar solo el hostname exacto.
4. En **Authentication → Sign-in method → Google**, comprobar que el proveedor **Google** esté habilitado.
5. Guardar y abrir https://guaurritas-star.github.io/SIERRACANDYDEMO/ directamente desde Safari o Chrome (no desde una vista previa embebida).
6. Elegir **Crear mi marca con IA** → **Iniciar sesión con Google**. Al completar el acceso debería desaparecer el botón de login y aparecer el estado de sesión activa.

## Si persiste el error

- `auth/unauthorized-domain`: el dominio todavía no figura en Authorized domains del mismo proyecto Firebase.
- `auth/operation-not-allowed`: el proveedor de Google no está habilitado.
- `auth/popup-blocked`: abrir el sitio fuera de WhatsApp, Instagram o ChatGPT, y permitir ventanas emergentes.
- `auth/network-request-failed`: revisar conectividad o bloqueadores.
- `auth/invalid-api-key`: revisar configuración del proyecto.

**Importante:** GitHub Pages es alojamiento estático. Aunque Google Auth comience a funcionar, Gemini y las subidas de imágenes dependen del backend Express `/api/gemini/*` y `/api/uploads` y NO se ejecutan ahí. Para completar ambas experiencias se requiere desplegar el backend en Cloud Run o equivalente.

Documentación oficial: https://firebase.google.com/docs/auth/web/google-signin

Si no tienes acceso a ese proyecto Firebase generado en AI Studio, necesitarás permisos de administración o crear un proyecto Firebase bajo tu cuenta y migrar con cuidado los datos y reglas existentes. No publiques secretos de Gemini en GitHub.
