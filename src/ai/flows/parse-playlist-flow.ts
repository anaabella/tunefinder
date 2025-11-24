'use server';
/**
 * @fileOverview Flujo de IA para analizar el contenido de un archivo de playlist.
 *
 * - parsePlaylistFile - Analiza el contenido de un archivo de playlist (ej. .m3u) y extrae las canciones.
 * - ParsePlaylistFileInput - El tipo de entrada para la función `parsePlaylistFile`.
 * - ParsePlaylistFileOutput - El tipo de retorno para la función `parsePlaylistFile`.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define el esquema de entrada: el contenido del archivo como un string.
const ParsePlaylistFileInputSchema = z.string().describe(
    "El contenido completo de un archivo de playlist, como un string. Típicamente en formato M3U o M3U8."
);
export type ParsePlaylistFileInput = z.infer<typeof ParsePlaylistFileInputSchema>;

// Define el esquema de salida: un array de objetos de canción simplificados.
const ParsePlaylistFileOutputSchema = z.array(
  z.object({
    title: z.string().describe("El título de la canción."),
    artist: z.string().describe("El artista de la canción. Si no se puede determinar, se puede dejar como 'Desconocido'."),
  })
);
export type ParsePlaylistFileOutput = z.infer<typeof ParsePlaylistFileOutputSchema>;


const prompt = ai.definePrompt({
    name: 'parsePlaylistPrompt',
    input: { schema: ParsePlaylistFileInputSchema },
    output: { schema: ParsePlaylistFileOutputSchema },
    prompt: `Eres un experto en analizar archivos de playlist.
    Tu tarea es leer el contenido de un archivo de playlist (.m3u o .m3u8) y extraer el título y el artista de cada canción.

    El formato M3U a menudo se ve así:
    #EXTM3U
    #EXTINF:231,Artista - Título de la Canción
    /ruta/al/archivo/cancion1.mp3
    #EXTINF:180,Otro Artista - Título de Otra Canción
    /ruta/al/archivo/cancion2.mp3

    - La línea que comienza con '#EXTINF' contiene la información de la canción.
    - El formato común es 'Artista - Título'.
    - Ignora las líneas que son solo rutas de archivo o comentarios que no sean '#EXTINF'.
    - Si no puedes determinar el artista, usa "Artista Desconocido".

    Analiza el siguiente contenido y devuelve un array de objetos con el título y el artista de cada canción.

    Contenido de la Playlist:
    {{{input}}}
    `,
});

const parsePlaylistFileFlow = ai.defineFlow(
    {
      name: 'parsePlaylistFileFlow',
      inputSchema: ParsePlaylistFileInputSchema,
      outputSchema: ParsePlaylistFileOutputSchema,
    },
    async (playlistContent) => {
      const { output } = await prompt(playlistContent);
      return output || [];
    }
);

/**
 * Analiza el contenido de un archivo de playlist para extraer los títulos y artistas.
 * @param content El contenido del archivo de playlist como un string.
 * @returns Una promesa que se resuelve en un array de objetos con título y artista.
 */
export async function parsePlaylistFile(content: ParsePlaylistFileInput): Promise<ParsePlaylistFileOutput> {
  const result = await parsePlaylistFileFlow(content);
  return result;
}
