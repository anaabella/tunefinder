
"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Song } from "@/lib/types";
import { Search, Music, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllSongsFromAllPlaylists, deletePlaylistItem } from "@/lib/youtube";
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
} from "@/components/ui/alert-dialog";

interface SearchSongsProps {
  accessToken: string | null;
}

export function SearchSongs({ accessToken }: SearchSongsProps) {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  // Effect to fetch all songs once on component mount
  useEffect(() => {
    if (!user || !accessToken) {
      setIsLoading(false);
      return;
    }

    const fetchAllSongs = async () => {
      setIsLoading(true);
      try {
        const results = await getAllSongsFromAllPlaylists(accessToken);
        setAllSongs(results);
        setFilteredSongs(results); // Initially, show all songs
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error al cargar tus canciones",
          description: error.message || "No se pudieron obtener las canciones de tus playlists.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSongs();
  }, [user, accessToken, toast]);

  // Effect to filter songs based on query
  useEffect(() => {
    const lowerCaseQuery = query.toLowerCase();
    
    if (lowerCaseQuery === '') {
      setFilteredSongs(allSongs);
    } else {
      const results = allSongs.filter(song =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredSongs(results);
    }
  }, [query, allSongs]);

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
        // Update both allSongs and filteredSongs to reflect the deletion
        setAllSongs((prev) => prev.filter((song) => song.id !== songIdToDelete));
        setFilteredSongs((prev) => prev.filter((song) => song.id !== songIdToDelete));
        setIsDeleting(null);
        return true;
      } else {
        throw new Error("No se pudo eliminar la canción. Revisa los permisos o inténtalo de nuevo.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la canción.",
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
                Escribe para encontrar una canción o artista en todas tus playlists de YouTube.
            </p>
        </div>

      <Card className="shadow-lg sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="pt-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="p. ej. Bohemian Rhapsody, Queen..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10 h-12 text-base" 
                    autoComplete="off" 
                />
            </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Cargando toda tu música...</p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-headline">Resultados <span className="text-base font-normal text-muted-foreground">({filteredSongs.length} encontrados)</span></h3>
          {filteredSongs.length > 0 ? (
             <div className="flex flex-col gap-3">
             {filteredSongs.map((song) => (
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
                          <AlertDialogAction 
                            onClick={async (e) => {
                                e.preventDefault();
                                const success = await handleDeleteSong(song.id);
                                // The AlertDialog will close automatically if the action is successful,
                                // because the component that triggered it will be removed from the list.
                                // If not successful, we leave it open.
                            }}
                          >
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
              <p className="text-muted-foreground">No se encontraron canciones que coincidan con tu búsqueda.</p>
              <p className="text-sm text-muted-foreground/80">
                {query ? "Intenta con otro término." : "Parece que no tienes canciones en tus playlists de YouTube."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
