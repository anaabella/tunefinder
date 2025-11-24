'use server';
/**
 * @fileOverview Flow to get a song preview URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import fetch from 'node-fetch';

const GetSongPreviewInputSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist of the song.'),
});

// The output can be a URL or an error message.
const GetSongPreviewOutputSchema = z.object({
    previewUrl: z.string().url().optional().describe('The URL of the song preview.'),
    error: z.string().optional().describe('An error message if the preview could not be found.'),
});


export type GetSongPreviewInput = z.infer<typeof GetSongPreviewInputSchema>;
export type GetSongPreviewOutput = z.infer<typeof GetSongPreviewOutputSchema>;

async function searchTrack(query: string): Promise<string | null> {
    const searchUrl = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
          // Don't treat API errors as fatal, just return null
          console.error(`Deezer API responded with status: ${response.status}`);
          return null;
        }
        const data: any = await response.json();
        if (data.data && data.data.length > 0 && data.data[0].preview) {
            // Return the preview URL of the first result
            return data.data[0].preview;
        }
        return null;
    } catch (error) {
        console.error("Error searching for track on Deezer:", error);
        return null;
    }
}


export const getSongPreviewFlow = ai.defineFlow(
  {
    name: 'getSongPreviewFlow',
    inputSchema: GetSongPreviewInputSchema,
    outputSchema: GetSongPreviewOutputSchema,
  },
  async ({ title, artist }) => {
    // Deezer search is generally better with "artist - title"
    const query = `${artist} - ${title}`;
    let previewUrl = await searchTrack(query);

    // If the first query fails, try with just the title
    if (!previewUrl) {
      previewUrl = await searchTrack(title);
    }
    
    if (!previewUrl) {
        // Instead of throwing an error, return an object with an error message
        return { error: 'No song preview could be found.' };
    }
    
    // Return a success object
    return { previewUrl };
  }
);

export async function getSongPreview(
  input: GetSongPreviewInput
): Promise<GetSongPreviewOutput> {
  return await getSongPreviewFlow(input);
}
