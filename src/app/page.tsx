'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { YouTubeIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { SearchSongs } from '@/components/SearchSongs';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LocalPlaylistSearch } from '@/components/LocalPlaylistSearch';


function Login() {
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Set persistence to local to keep user signed in across sessions
    if (auth) {
      setPersistence(auth, browserLocalPersistence);
    }
  }, [auth]);

  const handleLogin = async () => {
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('Login popup closed by user.');
        return;
      }
      
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

function RefreshSession() {
    const auth = useAuth();
    const { toast } = useToast();

    const handleLogin = async () => {
      try {
        await initiateGoogleSignIn(auth);
        // On successful login, the page will reload automatically due to state change,
        // or we can force it if necessary.
        window.location.reload();
      } catch (error: any) {
         if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          console.log('Login popup closed by user.');
          return;
        }
        console.error('Error durante el inicio de sesión:', error);
        toast({
          variant: 'destructive',
          title: 'Error de inicio de sesión',
          description: error.message || 'No se pudo completar el inicio de sesión con Google.',
        });
      }
    };
  
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <h2 className="text-2xl font-bold">Tu sesión de YouTube ha caducado</h2>
        <p className="text-muted-foreground">
          Para continuar, por favor haz clic para refrescar tu permiso.
        </p>
        <Button onClick={handleLogin}>
          <YouTubeIcon className="mr-2 h-4 w-4" /> Refrescar Sesión con Google
        </Button>
      </div>
    );
}


export default function Home() {
  const { user, isUserLoading } = useUser();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Client-side effect to get the token from localStorage
    const token = localStorage.getItem('yt-access-token');
    setAccessToken(token);
  }, []);


  if (isUserLoading) {
    return (
      <div className="container mx-auto py-8 md:py-12 px-4 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  // The main page is now a tabbed interface.
  // The local playlist search is always available, even for logged-out users.
  return (
    <div className="container mx-auto py-8 md:py-12 px-4 h-full">
      <Tabs defaultValue="youtube" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="local">Archivo Local</TabsTrigger>
        </TabsList>
        <TabsContent value="youtube" className="mt-6">
          {!user ? (
            <Login />
          ) : accessToken ? (
            <SearchSongs accessToken={accessToken} />
          ) : (
            <RefreshSession />
          )}
        </TabsContent>
        <TabsContent value="local" className="mt-6">
          <LocalPlaylistSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
