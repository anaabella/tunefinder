'use client';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // Solicitamos acceso a las playlists del usuario de YouTube de forma explícita.
  // Esto es crucial para que el usuario pueda dar su consentimiento.
  provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
  
  // Usar prompt: 'consent' puede ser útil durante el desarrollo para forzar
  // que la pantalla de consentimiento aparezca siempre y verificar los permisos.
  // En producción, esto se puede quitar para una mejor experiencia de usuario.
  provider.setCustomParameters({
    prompt: 'consent'
  });

  return signInWithPopup(authInstance, provider).then(result => {
    // This is a good place to store the access token if needed globally
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (accessToken) {
      // Using sessionStorage to persist the token across page reloads but not across tabs/windows.
      sessionStorage.setItem('yt-access-token', accessToken);
    }
    return result;
  }).catch(error => {
    // The user closed the popup. This is not a "failure" state, so we just re-throw
    // to let the caller decide how to handle it.
    throw error;
  });
}
