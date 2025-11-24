
'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import type { Playlist, Song } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { getPlaylists } from '@/lib/youtube';
import { searchSongs } from '@/ai/flows/search-songs-flow';
import { YouTubeIcon } from './icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Search } from 'lucide-react';
import { SongResults } from './SongResults';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
        Para continuar, por favor refresca la página. Si el problema persiste,
        inicia sesión de nuevo.
      </p>
      <Button onClick={handleLogin}>
        <YouTubeIcon className="mr-2 h-4 w-4" /> Refrescar Página
      </Button>
    </div>
  );
}

export function SearchSongs({ accessToken }: SearchSongsProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const [isSearching, startSearchTransition] = useTransition();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('all');

  useEffect(() => {
    if (accessToken) {
      getPlaylists(accessToken).then(setPlaylists).catch(() => {
        setIsTokenExpired(true);
      });
    }
  }, [accessToken]);
  
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!user || !accessToken) return;
    
    // No search if query is empty
    if (!searchQuery) {
        setSongs([]);
        setHasSearched(false);
        return;
    }

    setHasSearched(true);
    startSearchTransition(async () => {
      try {
        const ignoredPlaylistsStr = localStorage.getItem('ignored-playlists') || '[]';
        const ignoredPlaylistIds = JSON.parse(ignoredPlaylistsStr);
        
        const results = await searchSongs({ 
          accessToken, 
          query: searchQuery, 
          ignoredPlaylistIds 
        });
        
        setSongs(results);
      } catch (error: any) {
        const errorMessage = error.message || (error.cause as any)?.message;
        if (errorMessage === 'YOUTUBE_TOKEN_EXPIRED') {
          setIsTokenExpired(true);
          localStorage.removeItem('yt-access-token');
        } else {
            console.error("Search failed:", error);
            toast({
                variant: "destructive",
                title: "Error de Búsqueda",
                description: "No se pudo completar la búsqueda.",
            });
        }
      }
    });
  }, [user, accessToken, toast]);
  
  // Debounce effect for search input
  useEffect(() => {
    const handler = setTimeout(() => {
        handleSearch(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query, handleSearch]);

  const filteredSongs = useMemo(() => {
    if (selectedPlaylist === 'all') {
      return songs;
    }
    return songs.filter(song => song.playlistId === selectedPlaylist);
  }, [songs, selectedPlaylist]);
  
  if (isTokenExpired) return <RefreshSession />;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
          Busca en todas tus Playlists
        </h2>
        <p className="text-muted-foreground text-lg">
            Escribe para buscar por título o artista. Usa el filtro para acotar la búsqueda a una playlist.
        </p>
      </div>

      <Card className="shadow-lg sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Busca por título o artista..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 text-base"
                autoComplete="off"
              />
            </div>
            <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
              <SelectTrigger className="h-12 md:w-56">
                <SelectValue placeholder="Filtrar por playlist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Playlists</SelectItem>
                {playlists.map(playlist => (
                  <SelectItem key={playlist.id} value={playlist.id}>{playlist.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <SongResults
        songs={filteredSongs}
        setSongs={setSongs}
        accessToken={accessToken}
        isLoading={isSearching && !hasSearched}
        isSearching={isSearching}
        searchQuery={query}
        initialSearch={!hasSearched && !query}
      />
    </div>
  );
}
