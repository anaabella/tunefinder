
'use client';

import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Playlists } from '@/components/Playlists';
import { YouTubeIcon } from '@/components/icons';
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
      // Only show a toast if it's not a user-cancelled popup
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: 'destructive',
          title: 'Error de inicio de sesión',
          description:
            error.message ||
            'No se pudo completar el inicio de sesión con Google.',
        });
      }
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const storedToken = sessionStorage.getItem('yt-access-token');
      if (storedToken) {
        setAccessToken(storedToken);
      }
    } else {
      // Clear token if user logs out
      setAccessToken(null);
      sessionStorage.removeItem('yt-access-token');
    }
  }, [user]);

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
              'No se pudieron cargar tus playlists de YouTube. Intenta cerrar y abrir sesión de nuevo.',
          });
          // Possible token expiration, clear it to force re-login flow if needed
          sessionStorage.removeItem('yt-access-token');
          setAccessToken(null);
        } finally {
          setIsLoadingPlaylists(false);
        }
      }
    };

    fetchPlaylists();
  }, [user, accessToken, toast]);


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
