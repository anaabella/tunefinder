
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parsePlaylistFile } from '@/ai/flows/parse-playlist-flow';
import type { Song } from '@/lib/types';
import { getAllSongsFromAllPlaylists } from '@/lib/youtube';
import { useUser } from '@/firebase';
import { SongResults } from './SongResults';
import { Input } from './ui/input';
import SongMatcherWorker from 'worker-loader!../workers/song-matcher.worker';

interface LocalSong {
  title: string;
  artist: string;
}

export function LocalPlaylistSearch() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localSongs, setLocalSongs] = useState<LocalSong[]>([]);
  const [allYouTubeSongs, setAllYouTubeSongs] = useState<Song[]>([]);
  const [matchedSongs, setMatchedSongs] = useState<Song[]>([]);
  const [isYouTubeLoading, setIsYouTubeLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();
  const { user } = useUser();
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('yt-access-token') : null;

  // Cargar todas las canciones de YouTube cuando el componente se monta si el usuario está logueado
  useEffect(() => {
    if (user && accessToken) {
      const fetchAllSongs = async () => {
        setIsYouTubeLoading(true);
        try {
          const ignoredPlaylistsStr = localStorage.getItem('ignored-playlists') || '[]';
          const ignoredPlaylistIds = JSON.parse(ignoredPlaylistsStr);
          const results = await getAllSongsFromAllPlaylists(accessToken, ignoredPlaylistIds);
          setAllYouTubeSongs(results);
          toast({
            title: 'Playlists de YouTube cargadas',
            description: `Se encontraron ${results.length} canciones en total.`,
          });
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error al cargar canciones de YouTube",
            description: error.message || "No se pudieron obtener las canciones de tus playlists.",
          });
        } finally {
          setIsYouTubeLoading(false);
        }
      };
      fetchAllSongs();
    }
  }, [user, accessToken, toast]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.name.endsWith('.m3u') || selectedFile.name.endsWith('.m3u8')) {
        setFile(selectedFile);
        setLocalSongs([]);
        setMatchedSongs([]);
        setSearchQuery('');
        toast({
          title: 'Archivo seleccionado',
          description: `Listo para procesar: ${selectedFile.name}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Formato no válido',
          description: 'Por favor, sube un archivo .m3u o .m3u8.',
        });
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'audio/x-mpegurl': ['.m3u', '.m3u8'] },
  });
  
  const handleProcessFile = () => {
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        toast({
          title: 'Procesando archivo local...',
          description: 'La playlist se está analizando.',
        });
        const parsedSongs = await parsePlaylistFile(content);
        setLocalSongs(parsedSongs);
        toast({
          title: 'Archivo procesado',
          description: `Se encontraron ${parsedSongs.length} canciones en el archivo. Ahora buscando coincidencias en YouTube...`,
        });

        const worker = new SongMatcherWorker();

        worker.onmessage = (e: MessageEvent<Song[]>) => {
            setMatchedSongs(e.data);
            toast({
                title: 'Búsqueda completada',
                description: `Se encontraron ${e.data.length} coincidencias en tus playlists de YouTube.`,
            });
            setIsProcessing(false);
            worker.terminate();
        };

        worker.postMessage({
            allYouTubeSongs,
            localSongs: parsedSongs,
        });

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error al procesar',
          description: error.message || 'No se pudo analizar el archivo de la playlist.',
        });
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };
  
  const filteredMatchedSongs = matchedSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (!user || !accessToken) {
    return (
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Función no disponible</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Debes iniciar sesión con Google para cargar tus canciones de YouTube y compararlas con un archivo local.
            </p>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Busca en tu Playlist Local</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Sube un archivo de playlist (.m3u, .m3u8) para encontrar esas canciones en tus playlists de YouTube y gestionarlas.
        </p>
      </div>

      <Card 
        {...getRootProps()} 
        className={`shadow-lg border-2 border-dashed transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'bg-card'}`}
      >
        <CardContent className="pt-6 text-center cursor-pointer">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4 p-8">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-semibold">Suelta el archivo aquí...</p>
            ) : file ? (
              <p className="font-semibold text-foreground">Archivo seleccionado: <span className="font-normal">{file.name}</span></p>
            ) : (
              <p className="text-muted-foreground">Arrastra y suelta un archivo de playlist, o haz clic para seleccionarlo</p>
            )}
            <p className="text-xs text-muted-foreground/80">Formatos soportados: .m3u, .m3u8</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button onClick={handleProcessFile} disabled={!file || isProcessing || isYouTubeLoading} size="lg">
          {isProcessing ? 'Buscando...' : 'Buscar Coincidencias en YouTube'}
        </Button>
      </div>
      
      {isYouTubeLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Cargando canciones de YouTube...</p>
        </div>
      )}


      {matchedSongs.length > 0 && (
        <>
            <Card className="shadow-lg sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardContent className="pt-6">
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                          placeholder="Busca en los resultados encontrados..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-12 text-base" 
                          autoComplete="off" 
                      />
                  </div>
              </CardContent>
            </Card>
            <SongResults songs={filteredMatchedSongs} setSongs={setMatchedSongs} accessToken={accessToken} />
        </>
      )}

      {localSongs.length > 0 && matchedSongs.length === 0 && !isProcessing && (
         <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No se encontraron coincidencias en tus playlists de YouTube.</p>
          </div>
      )}
    </div>
  );
}
