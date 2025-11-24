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
  // Solicitamos acceso a las playlists del usuario de YouTube
  provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
  
  // Use a try-catch block for better error handling if the popup is closed
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
