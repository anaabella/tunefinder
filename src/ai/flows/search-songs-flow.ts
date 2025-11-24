'use server';
/**
 * @fileOverview Flow to search songs based on a query.
 *
 * - searchSongsFlow - A function that filters songs based on a search query.
 * - SearchSongsInput - The input type for the searchSongsFlow function.
 * - SearchSongsOutput - The return type for the searchSongsFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Song } from '@/lib/types';

const SongSchema = z.object({
  id: z.string(),
  playlistId: z.string(),
  playlistName: z.string(),
  title: z.string(),
  artist: z.string(),
  youtubeVideoId: z.string(),
  thumbnailUrl: z.string(),
  publishedAt: z.string(),
});

export const SearchSongsInputSchema = z.object({
  songs: z.array(SongSchema).describe('The list of songs to search through.'),
  query: z.string().describe('The search query.'),
});

export const SearchSongsOutputSchema = z.array(SongSchema);

export type SearchSongsInput = z.infer<typeof SearchSongsInputSchema>;
export type SearchSongsOutput = z.infer<typeof SearchSongsOutputSchema>;

export const searchSongsFlow = ai.defineFlow(
  {
    name: 'searchSongsFlow',
    inputSchema: SearchSongsInputSchema,
    outputSchema: SearchSongsOutputSchema,
  },
  async ({ songs, query }) => {
    if (!query) {
      return songs;
    }
    const lowerCaseQuery = query.toLowerCase();
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
    );
  }
);

export async function searchSongs(
  input: SearchSongsInput
): Promise<SearchSongsOutput> {
  return await searchSongsFlow(input);
}
