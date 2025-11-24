
'use client';

import { useState } from 'react';
import type { Playlist } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchSongs } from './SearchSongs';
import { Music2 } from 'lucide-react';

interface PlaylistsProps {
  initialPlaylists: Playlist[];
}

export function Playlists({ initialPlaylists }: PlaylistsProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );

  const selectedPlaylist = initialPlaylists.find(
    (p) => p.id === selectedPlaylistId
  );

  if (initialPlaylists.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No se encontraron playlists en tu cuenta de YouTube.</p>
        <p className="text-sm text-muted-foreground/80">
          Asegúrate de que tu cuenta de Google tiene playlists en YouTube.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-3xl mx-auto w-full space-y-4">
        <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Selecciona una Playlist</h2>
            <p className="text-muted-foreground text-lg">
            Elige una de tus playlists de YouTube para empezar a buscar.
            </p>
        </div>
        <Select onValueChange={setSelectedPlaylistId}>
          <SelectTrigger className="w-full h-12 text-base">
             <div className="flex items-center gap-3">
                <Music2 className="h-5 w-5 text-muted-foreground" />
                <SelectValue placeholder="Selecciona una playlist..." />
             </div>
          </SelectTrigger>
          <SelectContent>
            {initialPlaylists.map((playlist) => (
              <SelectItem key={playlist.id} value={playlist.id}>
                {playlist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlaylist && <SearchSongs playlist={selectedPlaylist} />}
    </div>
  );
}
