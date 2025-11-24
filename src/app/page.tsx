
'use client';

import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Playlists } from '@/components/Playlists';
import { YouTubeIcon } from '@/components/icons';
import { GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { getPlaylists } from '@/lib/youtube';
import type { Playlist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function Login() {
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const result = await initiateGoogleSignIn(auth);
      if (result) {
        const details = getAdditionalUserInfo(result);
        const accessToken = (details?.profile as any)?.access_token;
        if (!accessToken) {
          throw new Error('No se pudo obtener el token de acceso de Google.');
        }
        // You could store the access token securely if needed for future API calls
      }
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

export default function Home() {
  const { user, isUserLoading } = useUser();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (user && auth.currentUser) {
        setIsLoadingPlaylists(true);
        try {
          const idToken = await auth.currentUser.getIdToken(true);
          // This is a placeholder for where you would get the OAuth access token.
          // For this to work, you need a proper OAuth flow.
          // We are using a trick here by re-authenticating to get a fresh credential.
          const credential = GoogleAuthProvider.credential(idToken);

          // This is a simplified and potentially fragile way to get an access token.
          // In a real app, you'd manage this with a proper backend OAuth flow.
          const tempUser = await auth.currentUser.reauthenticateWithCredential(credential);
          const accessToken = (tempUser.credential as any)?.accessToken;

          if(!accessToken) {
            // Fallback for when re-auth doesn't provide the token easily
             toast({
              variant: 'destructive',
              title: 'Error de Autenticación',
              description: 'No se pudo obtener el permiso para acceder a YouTube. Intenta cerrar y abrir sesión.',
            });
            setIsLoadingPlaylists(false);
            return;
          }

          const fetchedPlaylists = await getPlaylists(accessToken);
          setPlaylists(fetchedPlaylists);
        } catch (error: any) {
          console.error('Error fetching playlists:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar Playlists',
            description:
              error.message ||
              'No se pudieron cargar tus playlists de YouTube.',
          });
        } finally {
          setIsLoadingPlaylists(false);
        }
      }
    };

    fetchPlaylists();
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
        <Playlists initialPlaylists={playlists} />
      )}
    </div>
  );
}
