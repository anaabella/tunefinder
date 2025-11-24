
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Song } from "@/lib/types";
import { Search, Music, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { searchAllPlaylists, deletePlaylistItem } from "@/lib/youtube";
import { useUser } from "@/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  query: z.string().min(2, { message: "Por favor, introduce al menos 2 caracteres." }),
});

interface SearchSongsProps {
  accessToken: string | null;
}

export function SearchSongs({ accessToken }: SearchSongsProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
       toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Debes iniciar sesión para buscar.",
      });
      return;
    }
    
    if (!accessToken) {
        toast({
            variant: "destructive",
            title: "Error de autenticación",
            description: "No se pudo obtener el permiso para buscar. Intenta iniciar sesión de nuevo.",
        });
        return;
    }

    setSubmittedQuery(values.query);
    setIsLoading(true);
    setSongs([]);

    try {
      const results = await searchAllPlaylists(accessToken, values.query);
      setSongs(results);

    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error al buscar canciones",
        description: error.message || "No se pudieron obtener las canciones de la playlist.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteSong = async (songIdToDelete: string) => {
    setIsDeleting(songIdToDelete);
    if (!accessToken) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Se perdió la sesión. Por favor, inicia sesión de nuevo.",
      });
      setIsDeleting(null);
      return false;
    }
    
    try {
      const success = await deletePlaylistItem(accessToken, songIdToDelete);

      if (success) {
        toast({
          title: "Canción eliminada",
          description: "La canción ha sido eliminada de tu playlist de YouTube.",
        });
        setSongs((prevSongs) => prevSongs.filter((song) => song.id !== songIdToDelete));
        setIsDeleting(null);
        return true;
      } else {
        throw new Error("No se pudo eliminar la canción. Revisa los permisos o inténtalo de nuevo.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la canción. Revisa los permisos o inténtalo de nuevo.",
      });
      setIsDeleting(null);
      return false;
    }
  };


  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Busca en tu Música</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Escribe el nombre de una canción o artista para encontrarlo en todas tus playlists de YouTube.
            </p>
        </div>

      <Card className="shadow-lg sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Canción o Artista</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="p. ej. Bohemian Rhapsody, Queen..." {...field} className="pl-10 h-12 text-base" autoComplete="off" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto flex-shrink-0 h-12">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                    Buscando...
                  </>
                ) : <><Search className="h-5 w-5 mr-2" /> Buscar</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {submittedQuery && isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {submittedQuery && !isLoading && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-headline">Resultados <span className="text-base font-normal text-muted-foreground">({songs.length} encontrados para "{submittedQuery}")</span></h3>
          {songs.length > 0 ? (
             <div className="flex flex-col gap-3">
             {songs.map((song) => (
                <div key={song.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card text-card-foreground">
                    {song.thumbnailUrl && (
                        <div className="aspect-video relative h-16 w-28 rounded-md overflow-hidden flex-shrink-0">
                            <Image 
                                src={song.thumbnailUrl} 
                                alt={`Miniatura de ${song.title}`} 
                                layout="fill" 
                                objectFit="cover"
                            />
                        </div>
                    )}
                  <div className="flex-grow min-w-0">
                    <p className="truncate font-semibold">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                    <p className="text-xs text-muted-foreground">En: <span className="font-medium">{song.playlistName}</span></p>
                   </div>
                  <div className="flex-shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting === song.id} aria-label="Eliminar canción">
                          {isDeleting === song.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la canción <span className="font-semibold">"{song.title}"</span> de tu playlist <span className="font-semibold">"{song.playlistName}"</span> en YouTube.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={async (e) => {
                            e.preventDefault();
                            await handleDeleteSong(song.id);
                          }}>
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No se encontraron canciones que coincidan.</p>
              <p className="text-sm text-muted-foreground/80">Intenta con otro término de búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
