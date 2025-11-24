
'use client';

import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Playlists } from '@/components/Playlists';
import { YouTubeIcon } from '@/components/icons';
import { GoogleAuthProvider, getAuth, signInWithCredential } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { getPlaylists } from '@/lib/youtube';
import type { Playlist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function Login() {
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      console.error('Error durante el inicio de sesión:', error);
      toast({
        variant: 'destructive',
        title: 'Error de inicio de sesión',
        description:
          error.message ||
          'No se pudo completar el inicio de sesión con Google.',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-2xl font-bold">Bienvenido a TuneFinder</h2>
      <p className="text-muted-foreground">
        Inicia sesión con Google para buscar en tus listas de reproducción de
        YouTube.
      </p>
      <Button onClick={handleLogin}>
        <YouTubeIcon className="mr-2 h-4 w-4" /> Iniciar Sesión con Google
      </Button>
    </div>
  );
}

// Helper function to get the access token from the credential result
const getAccessTokenFromCredential = (user: any): string | null => {
  if (user && user.credential && 'accessToken' in user.credential) {
    return (user.credential as any).accessToken;
  }
  return null;
};


export default function Home() {
  const { user, isUserLoading } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (user && accessToken) {
        setIsLoadingPlaylists(true);
        try {
          const fetchedPlaylists = await getPlaylists(accessToken);
          setPlaylists(fetchedPlaylists);
        } catch (error: any) {
          console.error('Error fetching playlists:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar Playlists',
            description:
              error.message ||
              'No se pudieron cargar tus playlists de YouTube. Asegúrate de tener la API de YouTube habilitada.',
          });
        } finally {
          setIsLoadingPlaylists(false);
        }
      }
    };

    fetchPlaylists();
  }, [user, accessToken, toast]);

   useEffect(() => {
    if (user) {
      // This is a bit of a trick to get a fresh access token.
      // Firebase doesn't expose a simple "get me the latest oauth token" method.
      // We force a re-authentication with the existing provider data.
      const getFreshToken = async () => {
        if (auth.currentUser) {
           try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
            
            const result = await auth.currentUser.linkWithRedirect(provider);
            // This won't complete here, it will redirect. The token will be available after redirect.
            // A more complex setup with getRedirectResult is needed for a seamless flow.
            // For now, let's try a simpler approach by re-authenticating on load if no token.

            const idToken = await auth.currentUser.getIdToken(true);
            const credential = GoogleAuthProvider.credential(idToken);
            
            // Re-authenticating is not ideal but can sometimes refresh the token.
            const tempUser = await signInWithCredential(auth, credential);
            const token = getAccessTokenFromCredential(tempUser);

            if (token) {
              setAccessToken(token);
            } else {
               // Fallback for when re-auth doesn't provide the token easily
               // This is a key challenge in client-side OAuth token management
               const storedToken = sessionStorage.getItem('yt-access-token');
               if (storedToken) {
                 setAccessToken(storedToken);
               } else {
                  console.warn('No se pudo obtener el token de acceso. La carga de playlists puede fallar.');
               }
            }
          } catch(error: any) {
             if (error.code === 'auth/credential-already-in-use') {
                // This is expected if the user is already linked. We can try to proceed.
                console.log('Credential already in use, trying to get token from existing user.');
                const storedToken = sessionStorage.getItem('yt-access-token');
                if (storedToken) setAccessToken(storedToken);

             } else if (error.code === 'auth/requires-recent-login') {
                toast({
                    variant: 'destructive',
                    title: 'Se requiere un nuevo inicio de sesión',
                    description: 'Por seguridad, necesitas volver a iniciar sesión para acceder a YouTube.',
                });
             } else {
                console.error("Error getting fresh token:", error);
                toast({
                  variant: 'destructive',
                  title: 'Error de Autenticación',
                  description: 'No se pudo obtener el permiso para acceder a YouTube. Intenta cerrar y abrir sesión.',
                });
             }
          }
        }
      };

      const storedToken = sessionStorage.getItem('yt-access-token');
      if (storedToken) {
        setAccessToken(storedToken);
      } else {
        getFreshToken();
      }
    }
  }, [user, auth, toast]);


  if (isUserLoading) {
    return (
      <div className="container mx-auto py-8 md:py-12 px-4 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 h-full">
      {!user ? (
        <Login />
      ) : isLoadingPlaylists ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando tus playlists...</p>
        </div>
      ) : (
        <Playlists initialPlaylists={playlists} accessToken={accessToken} />
      )}
    </div>
  );
}
