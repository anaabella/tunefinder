'use client';

import { useState } from 'react';
import Image from 'next/image';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deletePlaylistItem } from '@/lib/youtube';
import type { Song } from '@/lib/types';
import { Trash2, PlayCircle, Music4, PauseCircle, Loader } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAudioPreview } from './AudioPreviewController';
import { getSongPreview } from '@/ai/flows/get-song-preview-flow';

interface SongResultsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  accessToken: string | null;
  isLoading?: boolean;
  isSearching?: boolean;
  searchQuery?: string;
}

const SongSkeleton = () => (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card text-card-foreground">
        <Skeleton className="h-16 w-28 rounded-md flex-shrink-0" />
        <div className="flex-grow min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    </div>
);


export function SongResults({
  songs,
  setSongs,
  accessToken,
  isLoading,
  isSearching,
  searchQuery,
}: SongResultsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { playPreview, stopPreview, currentPreview } = useAudioPreview();
  const { toast } = useToast();

  const handlePreviewClick = async (song: Song) => {
    if (currentPreview?.songId === song.id && currentPreview.state === 'playing') {
      stopPreview();
      return;
    }

    if (currentPreview?.state === 'loading' && currentPreview?.songId === song.id) {
      // It's already loading, do nothing
      return;
    }

    playPreview(song.id, ''); // Triggers the loading state immediately

    try {
        const previewUrl = await getSongPreview({ title: song.title, artist: song.artist });
        playPreview(song.id, previewUrl);
    } catch (error) {
        console.error("Failed to get song preview:", error);
        toast({
            variant: "destructive",
            title: "Error de Previsualización",
            description: "No se pudo obtener la vista previa de la canción.",
        });
        stopPreview(); // Clear loading state on error
    }
  };

  const handleDeleteSong = async (songIdToDelete: string) => {
    setDeletingId(songIdToDelete);
    if (!accessToken) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Se perdió la sesión. Por favor, inicia sesión de nuevo.',
      });
      setDeletingId(null);
      return false;
    }

    try {
      const success = await deletePlaylistItem(accessToken, songIdToDelete);

      if (success) {
        toast({
          title: 'Canción eliminada',
          description:
            'La canción ha sido eliminada de tu playlist de YouTube.',
        });
        
        const songElement = document.getElementById(`song-${songIdToDelete}`);
        if(songElement) {
            songElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            songElement.style.opacity = '0';
            songElement.style.transform = 'translateX(-100%)';
            songElement.addEventListener('transitionend', () => {
                 setSongs((prev) => prev.filter((song) => song.id !== songIdToDelete));
            }, { once: true });
        } else {
             setSongs((prev) => prev.filter((song) => song.id !== songIdToDelete));
        }
        
        return true;
      } else {
        throw new Error(
          'No se pudo eliminar la canción. Revisa los permisos o inténtalo de nuevo.'
        );
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar la canción.',
      });
      return false;
    } finally {
       // Allow animation to complete before resetting the deleting state
       setTimeout(() => setDeletingId(null), 500);
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-3">
            <h3 className="text-2xl font-bold font-headline">Cargando canciones...</h3>
            {Array.from({ length: 5 }).map((_, index) => (
                <SongSkeleton key={index} />
            ))}
        </div>
    );
  }
  
  if (songs.length === 0 && !isLoading && !isSearching) {
    if (searchQuery) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No se encontraron resultados para <span className="font-semibold text-foreground">"{searchQuery}"</span>.</p>
            </div>
        )
    }
    return (
        <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
            <Music4 className="w-12 h-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No se encontraron canciones</h3>
            <p className="text-muted-foreground max-w-md">Parece que no tienes canciones en tus playlists de YouTube, o las playlists están vacías. ¡Añade algunas y vuelve a intentarlo!</p>
        </div>
    )
  }


  return (
    <div className="space-y-4">
       {(isLoading || isSearching) && (songs.length === 0) ? (
         <div className="space-y-3">
             {Array.from({ length: 5 }).map((_, index) => (
                 <SongSkeleton key={index} />
             ))}
         </div>
       ) : (
        <>
            <h3 className="text-2xl font-bold font-headline">
                Resultados{' '}
                <span className="text-base font-normal text-muted-foreground">
                ({songs.length} encontrados)
                </span>
            </h3>
            <div className="flex flex-col gap-3">
            {songs.map((song) => (
                <div
                key={song.id}
                id={`song-${song.id}`}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card text-card-foreground transition-opacity"
                >
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
                    <p className="text-sm text-muted-foreground truncate">
                    {song.artist}
                    </p>
                    <p className="text-xs text-muted-foreground">
                    En: <span className="font-medium">{song.playlistName}</span>
                    </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handlePreviewClick(song)} aria-label="Reproducir preview">
                        {currentPreview?.songId === song.id && currentPreview.state === 'loading' ? (
                            <Loader className="h-5 w-5 animate-spin text-primary" />
                        ) : currentPreview?.songId === song.id && currentPreview.state === 'playing' ? (
                            <PauseCircle className="h-5 w-5 text-primary" />
                        ) : (
                            <PlayCircle className="h-5 w-5 text-primary" />
                        )}
                    </Button>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === song.id}
                        aria-label="Eliminar canción"
                        >
                        {deletingId === song.id ? (
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
                            Esta acción no se puede deshacer. Esto eliminará
                            permanentemente la canción{' '}
                            <span className="font-semibold">"{song.title}"</span> de
                            tu playlist{' '}
                            <span className="font-semibold">
                            "{song.playlistName}"
                            </span>{' '}
                            en YouTube.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async (e) => {
                            e.preventDefault();
                            handleDeleteSong(song.id);
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
        </>
       )}
    </div>
  );
}
