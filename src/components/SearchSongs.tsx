'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import type { Song } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { searchSongs } from '@/ai/flows/search-songs-flow';
import { YouTubeIcon } from './icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Search } from 'lucide-react';
import { SongResults } from './SongResults';

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
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [query, setQuery] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const [isSearching, startSearchTransition] = useTransition();

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!user || !accessToken) {
      return;
    }

    if (!hasSearched) setHasSearched(true);
    
    startSearchTransition(async () => {
      try {
        const ignoredPlaylistsStr = localStorage.getItem('ignored-playlists') || '[]';
        const ignoredPlaylistIds = JSON.parse(ignoredPlaylistsStr);
        
        // Call the server-side flow with just the query
        const results = await searchSongs({ accessToken, query: searchQuery, ignoredPlaylistIds });
        
        setFilteredSongs(results);
      } catch (error: any) {
        // Check for specific error message indicating token expiration
        if (error.message === 'YOUTUBE_TOKEN_EXPIRED' || (error.cause as any)?.message === 'YOUTUBE_TOKEN_EXPIRED') {
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
  }, [user, accessToken, toast, hasSearched]);
  
  // Debounce effect for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch(query);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [query, handleSearch]);
  
  // Fetch initial songs (all of them) when the component mounts with an empty query
  useEffect(() => {
    handleSearch('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isTokenExpired) return <RefreshSession />;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">
          Busca en todas tus Playlists
        </h2>
        <p className="text-muted-foreground text-lg">
            Escribe en la barra de abajo para buscar por título o artista en todas tus playlists de YouTube.
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
             {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
          </div>
        </CardContent>
      </Card>

      <SongResults
        songs={filteredSongs}
        setSongs={setFilteredSongs}
        accessToken={accessToken}
        isLoading={isSearching && !hasSearched}
        isSearching={isSearching}
        searchQuery={query}
        initialSearch={!hasSearched}
      />
    </div>
  );
}
