
"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Song } from "@/lib/types";
import { Search, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { YouTubeIcon } from "./icons";

interface SearchSongsProps {
  accessToken: string | null;
}

function RefreshSession() {
    const handleLogin = () => {
        window.location.reload();
    };
  
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-bold">Tu sesión de YouTube ha caducado</h2>
        <p className="text-muted-foreground">
          Para continuar, por favor refresca la página. Si el problema persiste, inicia sesión de nuevo.
        </p>
        <Button onClick={handleLogin}>
          <YouTubeIcon className="mr-2 h-4 w-4" /> Refrescar Página
        </Button>
      </div>
    );
}

export function SearchSongs({ accessToken }: SearchSongsProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  // Effect to fetch all songs from all playlists
  useEffect(() => {
    if (!user || !accessToken) {
      setIsLoading(false);
      return;
    }

    const fetchAllSongs = async () => {
      setIsLoading(true);
      setIsTokenExpired(false);
      try {
        const ignoredPlaylistsStr = localStorage.getItem('ignored-playlists') || '[]';
        const ignoredPlaylistIds = JSON.parse(ignoredPlaylistsStr);
        
        const results = await getAllSongsFromAllPlaylists(accessToken, ignoredPlaylistIds);
        setSongs(results);
        setFilteredSongs(results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));
      } catch (error: any) {
        if (error.message === 'YOUTUBE_TOKEN_EXPIRED') {
            setIsTokenExpired(true);
            localStorage.removeItem('yt-access-token');
        } else {
            toast({
              variant: "destructive",
              title: "Error al cargar tus canciones",
              description: error.message || "No se pudieron obtener las canciones de tus playlists.",
            });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSongs();
  }, [user, accessToken, toast]);

  // Effect for filtering songs based on query
  useEffect(() => {
    const lowerCaseQuery = query.toLowerCase();
    
    if (lowerCaseQuery === '') {
      const sortedByDate = [...songs].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setFilteredSongs(sortedByDate);
    } else {
      const results = songs.filter(song =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
      );
      setFilteredSongs(results);
    }
  }, [query, songs]);

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
        setSongs((prev) => prev.filter((song) => song.id !== songIdToDelete));
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
      return false;
    } finally {
        setIsDeleting(null);
    }
  };
  
  if (isTokenExpired) return <RefreshSession />;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Cargando todas tus canciones...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Busca en todas tus Playlists</h2>
        <p className="text-muted-foreground text-lg">
          Has encontrado {songs.length} canciones en total. ¡Usa la barra de abajo para buscar!
        </p>
      </div>
        
      <Card className="shadow-lg sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardContent className="pt-6">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                      placeholder="Busca por título o artista en todas tus playlists..." 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10 h-12 text-base" 
                      autoComplete="off" 
                  />
              </div>
          </CardContent>
      </Card>
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
                              fill
                              style={{ objectFit: 'cover' }}
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
                              const closeDialog = () => {
                                  const cancelButton = e.currentTarget.parentElement?.querySelector('button');
                                  if (cancelButton) cancelButton.click();
                              }
                              e.preventDefault();
                              const deleted = await handleDeleteSong(song.id);
                              if (deleted) {
                                closeDialog();
                              }
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
            {query.length > 0 && <p className="text-sm text-muted-foreground/80">Intenta con otro término.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

