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
  // Solicitamos acceso de lectura y escritura a YouTube.
  provider.addScope('https://www.googleapis.com/auth/youtube');
  provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
  
  // Usar prompt: 'consent' fuerza que la pantalla de consentimiento aparezca siempre.
  // Esto es crucial para asegurar que el usuario aprueba los nuevos permisos.
  provider.setCustomParameters({
    prompt: 'consent'
  });

  return signInWithPopup(authInstance, provider).then(result => {
    // This is a good place to store the access token if needed globally
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (accessToken) {
      // Using localStorage to persist the token across sessions.
      localStorage.setItem('yt-access-token', accessToken);
    }
    return result;
  }).catch(error => {
    // The user closed the popup. This is not a "failure" state, so we just re-throw
    // to let the caller decide how to handle it.
    throw error;
  });
}
