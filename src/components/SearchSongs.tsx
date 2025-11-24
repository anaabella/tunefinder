
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Song, Playlist } from "@/lib/types";
import { YouTubeIcon } from "@/components/icons";
import { Search, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPlaylistItems } from "@/lib/youtube";
import { useAuth } from "@/firebase";

const formSchema = z.object({
  songName: z.string().min(2, { message: "Por favor, introduce al menos 2 caracteres." }),
});

interface SearchSongsProps {
  playlist: Playlist;
  accessToken: string;
}

export function SearchSongs({ playlist, accessToken }: SearchSongsProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { songName: "" },
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

    setSubmittedQuery(values.songName);
    setIsLoading(true);
    setSongs([]);

    try {
      const allItems = await getPlaylistItems(accessToken, playlist.id);
      const filteredSongs = allItems.filter(song => 
        song.title.toLowerCase().includes(values.songName.toLowerCase()) || 
        (song.artist && song.artist.toLowerCase().includes(values.songName.toLowerCase()))
      );
      
      setSongs(filteredSongs);

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

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Buscar en: {playlist.name}</CardTitle>
          <CardDescription>Busca una canción por su nombre o artista en esta playlist.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="songName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Nombre de la canción</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="p. ej. Bohemian Rhapsody" {...field} className="pl-10" autoComplete="off" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto flex-shrink-0">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Buscando...
                  </>
                ) : <><Search className="h-4 w-4 mr-2" /> Buscar</>}
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
            <div className="grid gap-4 md:grid-cols-2">
              {songs.map((song, index) => (
                <Card 
                  key={song.id} 
                  className="opacity-0 animate-in fade-in-0 zoom-in-95 duration-500"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                >
                  <CardHeader>
                    <CardTitle className="truncate">{song.title}</CardTitle>
                    <CardDescription>{song.artist}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`https://www.youtube.com/watch?v=${song.youtubeVideoId}`} target="_blank" rel="noopener noreferrer">
                        <YouTubeIcon className="h-4 w-4 mr-2" />
                        Ver en YouTube
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
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
