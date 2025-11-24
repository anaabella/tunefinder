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
  
  return signInWithPopup(authInstance, provider).then(result => {
    // This is a good place to store the access token if needed globally
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (accessToken) {
      // Using sessionStorage to persist the token across page reloads but not across tabs/windows.
      sessionStorage.setItem('yt-access-token', accessToken);
    }
    return result;
  });
}
