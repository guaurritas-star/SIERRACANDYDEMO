import { auth } from '../firebase';

/**
 * Every paid/privileged backend operation requires an authenticated Firebase
 * user. Keep Firebase ID tokens in the Authorization header, never in query
 * strings or permanent storage.
 */
export async function authenticatedApiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Inicia sesión con Google para utilizar las funciones de IA y subir archivos.');
  }
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers, credentials: 'same-origin' });
  if (response.status === 401) {
    throw new Error('Tu sesión venció. Vuelve a iniciar sesión.');
  }
  if (response.status === 403) {
    throw new Error('Tu cuenta no tiene permiso para usar esta función.');
  }
  if (response.status === 429) {
    throw new Error('Alcanzaste el límite de uso de IA por hoy. Para proteger los costos, no se harán más llamadas.');
  }
  return response;
}
