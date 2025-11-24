
"use client";

import { useState, useEffect } from "react";
import Image from 'next/image';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Song } from "@/lib/types";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSongsFromPlaylist, deletePlaylistItem, getPlaylists } from "@/lib/youtube"; // Cambiado a getSongsFromPlaylist
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
import { Playlists } from "./Playlists";

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

// Este componente ahora maneja la lógica de carga y búsqueda
// para una playlist seleccionada.
function PlaylistSongSearcher({ accessToken, playlistId }: { accessToken: string, playlistId: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSongs = async () => {
      if (!playlistId || !accessToken) return;
      setIsLoading(true);
      try {
        const playlistSongs = await getSongsFromPlaylist(accessToken, playlistId);
        setSongs(playlistSongs);
        setFilteredSongs(playlistSongs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));
      } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Error al cargar las canciones",
            description: error.message || "No se pudieron obtener las canciones de la playlist.",
          });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, [playlistId, accessToken, toast]);

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

  if (isLoading) {
    return (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Cargando canciones...</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-8">
        <Card className="shadow-lg sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardContent className="pt-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Busca en esta playlist..." 
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
                                e.preventDefault();
                                const deleted = await handleDeleteSong(song.id);
                                if (!deleted) {
                                  e.preventDefault();
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
            </div>
          )}
        </div>
    </div>
  );
}


export function SearchSongs({ accessToken }: SearchSongsProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  // Effect to fetch all playlists once on component mount
  useEffect(() => {
    if (!user || !accessToken) {
      setIsLoading(false);
      return;
    }

    const fetchPlaylists = async () => {
      setIsLoading(true);
      setIsTokenExpired(false);
      try {
        const ignoredPlaylistsStr = localStorage.getItem('ignored-playlists') || '[]';
        const ignoredPlaylistIds = JSON.parse(ignoredPlaylistsStr);

        const results = await getPlaylists(accessToken, ignoredPlaylistIds);
        setPlaylists(results);
      } catch (error: any) {
        if (error.message === 'YOUTUBE_TOKEN_EXPIRED') {
            setIsTokenExpired(true);
            localStorage.removeItem('yt-access-token');
        } else {
            toast({
              variant: "destructive",
              title: "Error al cargar tus playlists",
              description: error.message || "No se pudieron obtener las playlists.",
            });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [user, accessToken, toast]);

  if (isTokenExpired) return <RefreshSession />;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">Cargando tus playlists...</p>
      </div>
    );
  }
  
  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
       <Playlists 
            initialPlaylists={playlists} 
            onPlaylistSelected={setSelectedPlaylistId} 
       />

       {selectedPlaylist && accessToken && (
        <PlaylistSongSearcher 
            accessToken={accessToken}
            playlistId={selectedPlaylist.id}
        />
       )}
    </div>
  );
}
