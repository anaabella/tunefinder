'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getPlaylists, movePlaylistItem } from '@/lib/youtube';
import type { Playlist, Song } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface MoveSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  accessToken: string;
  onSongMoved: (originalPlaylistItemId: string) => void;
}

export function MoveSongDialog({
  open,
  onOpenChange,
  song,
  accessToken,
  onSongMoved,
}: MoveSongDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [destinationPlaylistId, setDestinationPlaylistId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && accessToken) {
      setIsLoading(true);
      getPlaylists(accessToken)
        .then((fetchedPlaylists) => {
          // Filter out the song's current playlist
          const availablePlaylists = fetchedPlaylists.filter(p => p.id !== song?.playlistId);
          setPlaylists(availablePlaylists);
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Error al cargar playlists',
            description: 'No se pudieron obtener tus playlists.',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, accessToken, song, toast]);

  const handleMoveSong = async () => {
    if (!song || !destinationPlaylistId || !accessToken) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Por favor, selecciona una playlist de destino.',
      });
      return;
    }

    setIsMoving(true);
    try {
      await movePlaylistItem({
        accessToken,
        playlistItemId: song.id,
        newPlaylistId: destinationPlaylistId,
        videoId: song.youtubeVideoId,
      });

      toast({
        title: '¡Canción movida!',
        description: `"${song.title}" se movió a la nueva playlist.`,
      });
      onSongMoved(song.id); // Notify parent to remove the song from the list
      onOpenChange(false); // Close dialog
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al mover la canción',
        description: error.message || 'No se pudo completar la operación.',
      });
    } finally {
      setIsMoving(false);
    }
  };
  
    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
        setDestinationPlaylistId('');
        }
    }, [open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Canción</DialogTitle>
          <DialogDescription>
            Mover <span className="font-semibold">{song?.title}</span> de{' '}
            <span className="font-semibold">{song?.playlistName}</span> a otra playlist.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="py-4">
            <Select value={destinationPlaylistId} onValueChange={setDestinationPlaylistId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una playlist de destino" />
              </SelectTrigger>
              <SelectContent>
                {playlists.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleMoveSong} disabled={isLoading || isMoving || !destinationPlaylistId}>
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
