'use client';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

function isMobileDevice() {
  // A simple check for mobile devices.
  // This is not foolproof but covers most cases.
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}


/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential | null> {
  const provider = new GoogleAuthProvider();
  // Solicitamos acceso de lectura y escritura a YouTube.
  provider.addScope('https://www.googleapis.com/auth/youtube');
  provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
  
  // Usar prompt: 'consent' fuerza que la pantalla de consentimiento aparezca siempre.
  // Esto es crucial para asegurar que el usuario aprueba los nuevos permisos.
  provider.setCustomParameters({
    prompt: 'consent'
  });

  if (isMobileDevice()) {
    // For mobile, redirect is more reliable than popup.
    return signInWithRedirect(authInstance, provider).then(() => null);
  }

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

/**
 * Handles the redirect result from Google sign-in on mobile devices.
 * This should be called when the app loads to complete the sign-in process.
 */
export async function handleRedirectSignIn(authInstance: Auth): Promise<UserCredential | null> {
    try {
        const result = await getRedirectResult(authInstance);

        if (result) {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const accessToken = credential?.accessToken;
            if (accessToken) {
                localStorage.setItem('yt-access-token', accessToken);
            }
            return result;
        }
        return null;
    } catch (error) {
        console.error("Error handling redirect sign in:", error);
        throw error;
    }
}
