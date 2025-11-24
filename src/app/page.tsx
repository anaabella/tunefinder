"use client";

import { useUser, useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { SearchSongs } from "@/components/SearchSongs";

function Login() {
  const auth = useAuth();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <h2 className="text-2xl font-bold">Bienvenido a TuneFinder</h2>
      <p className="text-muted-foreground">
        Inicia sesión para buscar en tus listas de reproducción.
      </p>
      <Button onClick={() => initiateAnonymousSignIn(auth)}>
        <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión Anónimamente
      </Button>
    </div>
  )
}

export default function Home() {
  const { user, isUserLoading } = useUser();

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
      {!user ? <Login /> : <SearchSongs />}
    </div>
  );
}
