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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPlaylists } from '@/lib/youtube';
import type { Playlist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface IgnorePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
}

const IGNORED_PLAYLISTS_KEY = 'ignored-playlists';

export function IgnorePlaylistDialog({
  open,
  onOpenChange,
  accessToken,
}: IgnorePlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Load initially ignored playlists from localStorage
      const storedIgnored = localStorage.getItem(IGNORED_PLAYLISTS_KEY);
      if (storedIgnored) {
        try {
          const parsed = JSON.parse(storedIgnored);
          setIgnoredIds(new Set(parsed));
        } catch (e) {
          console.error('Failed to parse ignored playlists from localStorage', e);
        }
      }

      // Fetch all playlists
      const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
          const fetchedPlaylists = await getPlaylists(accessToken);
          setPlaylists(fetchedPlaylists);
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error al cargar playlists',
            description: error.message || 'No se pudieron obtener tus playlists.',
          });
          onOpenChange(false); // Close dialog on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchPlaylists();
    }
  }, [open, accessToken, toast, onOpenChange]);

  const handleCheckboxChange = (playlistId: string) => {
    setIgnoredIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = () => {
    try {
      const idsToStore = Array.from(ignoredIds);
      localStorage.setItem(IGNORED_PLAYLISTS_KEY, JSON.stringify(idsToStore));
      toast({
        title: 'Preferencias guardadas',
        description: 'Tu búsqueda ahora excluirá las playlists seleccionadas.',
      });
      onOpenChange(false);
      // We might need to trigger a data refresh in the main view
      // For now, we'll rely on the user to re-search or reload.
       window.location.reload();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudieron guardar tus preferencias.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ignorar Playlists</DialogTitle>
          <DialogDescription>
            Selecciona las playlists que no quieres que aparezcan en los resultados de búsqueda.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="ml-4 text-muted-foreground">Cargando playlists...</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] my-4 pr-6">
            <div className="space-y-4">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`ignore-${playlist.id}`}
                    checked={ignoredIds.has(playlist.id)}
                    onCheckedChange={() => handleCheckboxChange(playlist.id)}
                  />
                  <Label htmlFor={`ignore-${playlist.id}`} className="flex-1 cursor-pointer">
                    {playlist.name}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveChanges} disabled={isLoading}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
