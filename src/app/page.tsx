'use client';

import { useEffect } from 'react';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { YouTubeIcon } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { SearchSongs } from '@/components/SearchSongs';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

function Login() {
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Set persistence to local to keep user signed in across sessions
    setPersistence(auth, browserLocalPersistence);
  }, [auth]);

  const handleLogin = async () => {
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
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


export default function Home() {
  const { user, isUserLoading } = useUser();
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('yt-access-token') : null;

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
      ) : (
         <SearchSongs accessToken={accessToken} />
      )}
    </div>
  );
}
