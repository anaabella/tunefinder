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
import { Trash2 } from 'lucide-react';

interface SongResultsProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  accessToken: string | null;
  isLoading?: boolean;
}

export function SongResults({
  songs,
  setSongs,
  accessToken,
  isLoading,
}: SongResultsProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteSong = async (songIdToDelete: string) => {
    setIsDeleting(songIdToDelete);
    if (!accessToken) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Se perdió la sesión. Por favor, inicia sesión de nuevo.',
      });
      setIsDeleting(null);
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
        setSongs((prev) => prev.filter((song) => song.id !== songIdToDelete));
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
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-4 text-muted-foreground">
          Cargando todas tus canciones...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold font-headline">
        Resultados{' '}
        <span className="text-base font-normal text-muted-foreground">
          ({songs.length} encontrados)
        </span>
      </h3>
      {songs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {songs.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 rounded-lg border bg-card text-card-foreground"
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
              <div className="flex-shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleting === song.id}
                      aria-label="Eliminar canción"
                    >
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
                          const closeDialog = () => {
                            const cancelButton =
                              e.currentTarget.parentElement?.querySelector(
                                'button'
                              );
                            if (cancelButton) cancelButton.click();
                          };
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
          <p className="text-muted-foreground">
            No se encontraron canciones que coincidan con tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
