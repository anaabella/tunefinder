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
  
  // signInWithPopup devuelve una promesa que podemos retornar
  return signInWithPopup(authInstance, provider);
}
