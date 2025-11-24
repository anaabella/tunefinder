'use client';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
} from 'firebase/auth';

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}


/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth, scopes?: string[]): Promise<UserCredential | null> {
  const provider = new GoogleAuthProvider();
  
  // Si se proporcionan scopes (ámbitos), los añadimos.
  if (scopes && scopes.length > 0) {
    scopes.forEach(scope => provider.addScope(scope));
    // Forzar la pantalla de consentimiento si estamos pidiendo nuevos permisos.
    provider.setCustomParameters({
      prompt: 'consent'
    });
  }


  if (isMobileDevice()) {
    // Para móviles, la redirección es más fiable.
    return signInWithRedirect(authInstance, provider).then(() => null);
  }

  // Para escritorio, usamos el popup.
  return signInWithPopup(authInstance, provider).then(result => {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (accessToken) {
      // Usar localStorage para persistir el token entre sesiones.
      localStorage.setItem('yt-access-token', accessToken);
    }
    return result;
  }).catch(error => {
    // El usuario cerró el popup. No es un estado de "fallo", 
    // así que simplemente relanzamos el error para que el llamador decida cómo manejarlo.
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
            const additionalInfo = getAdditionalUserInfo(result);
            // Si el inicio de sesión otorgó los scopes de YouTube, guardamos el token.
            if (accessToken && additionalInfo?.profile?.['granted_scopes']?.includes('https://www.googleapis.com/auth/youtube.readonly')) {
                localStorage.setItem('yt-access-token', accessToken);
            }
        }
        return result;
    } catch (error) {
        console.error("Error handling redirect sign in:", error);
        throw error;
    }
}
