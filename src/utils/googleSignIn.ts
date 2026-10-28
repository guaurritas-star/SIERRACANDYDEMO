import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

/**
 * Google sign-in must be triggered directly by a user click.
 * Do not catch and swallow Firebase error codes: they tell merchants how to fix login.
 */
export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function googleSignInErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/unauthorized-domain': {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'el dominio de la aplicación';
      return `Este sitio todavía no está autorizado en Firebase. Candy Studio debe agregar ${hostname} en Authentication → Settings → Authorized domains (sin https:// ni la ruta).`;
    }
    case 'auth/operation-not-allowed':
      return 'El acceso con Google no está habilitado en el proyecto Firebase. Candy Studio debe activarlo en Authentication → Sign-in method → Google.';
    case 'auth/popup-blocked':
    case 'auth/operation-not-supported-in-this-environment':
      return 'El navegador bloqueó la ventana de Google. Abre la página directamente en Safari o Chrome (fuera de ChatGPT, Instagram o WhatsApp) y vuelve a intentarlo.';
    case 'auth/popup-closed-by-user':
      return 'La ventana de Google se cerró antes de completar el acceso. Vuelve a pulsar «Iniciar sesión con Google».';
    case 'auth/cancelled-popup-request':
      return 'Se abrió más de una solicitud de acceso. Pulsa una sola vez e intenta de nuevo.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar a Google. Comprueba tu conexión e inténtalo de nuevo.';
    case 'auth/invalid-api-key':
    case 'auth/invalid-app-credential':
      return 'La configuración de Firebase no es válida. Candy Studio debe revisar las credenciales públicas del proyecto.';
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo vinculada a otro método de acceso.';
    case 'auth/too-many-requests':
      return 'Google ha limitado temporalmente los intentos. Espera un momento antes de volver a intentarlo.';
    default:
      return 'No se pudo iniciar sesión con Google. Intenta abrir el sitio directamente en Safari o Chrome. Si continúa el problema, comparte este código con Candy Studio: ' + (code || 'sin código');
  }
}
