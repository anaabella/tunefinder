'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LocalPlaylistSearch() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      // Basic validation for playlist file types
      if (selectedFile.name.endsWith('.m3u') || selectedFile.name.endsWith('.m3u8')) {
        setFile(selectedFile);
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
    accept: {
      'audio/x-mpegurl': ['.m3u', '.m3u8'],
    },
  });
  
  const handleProcessFile = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      // Here we will call the AI flow to process the content
      console.log('File content:', content);
      toast({
        title: 'Procesando...',
        description: 'La playlist se está analizando. Esto puede tardar un momento.',
      });
      // Placeholder for future implementation
    };
    reader.readAsText(file);
  };


  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Busca en tu Playlist Local</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Exporta una playlist desde Poweramp u otra app (en formato .m3u o .m3u8) y súbela aquí para buscar tus canciones.
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
        <Button onClick={handleProcessFile} disabled={!file} size="lg">
          Buscar en la Playlist
        </Button>
      </div>

      {/* Results will be displayed here in a future step */}
    </div>
  );
}
