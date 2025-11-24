
'use server';
/**
 * @fileOverview Flow to search songs based on a query.
 *
 * - searchSongs - A function that filters songs based on a search query.
 * - SearchSongsInput - The input type for the searchSongs function.
 * - SearchSongsOutput - The return type for the searchSongs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Song } from '@/lib/types';

// Define a Zod schema that matches the Song type for validation.
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

const SearchSongsInputSchema = z.object({
  songs: z.array(SongSchema).describe('The list of songs to search through.'),
  query: z.string().describe('The search query.'),
});

// The output is an array of songs that match the schema.
const SearchSongsOutputSchema = z.array(SongSchema);

export type SearchSongsInput = z.infer<typeof SearchSongsInputSchema>;
export type SearchSongsOutput = z.infer<typeof SearchSongsOutputSchema>;

// Define the flow
const searchSongsFlow = ai.defineFlow(
  {
    name: 'searchSongsFlow',
    inputSchema: SearchSongsInputSchema,
    outputSchema: SearchSongsOutputSchema,
  },
  async ({ songs, query }) => {
    // If the query is empty, return all songs.
    if (!query) {
      return songs;
    }

    const lowerCaseQuery = query.toLowerCase();

    // Perform the filtering logic on the server side.
    const filteredSongs = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
    );

    return filteredSongs;
  }
);

/**
 * Wraps the Genkit flow to be easily called from the application.
 * @param input The songs list and the search query.
 * @returns A promise that resolves to the filtered list of songs.
 */
export async function searchSongs(
  input: SearchSongsInput
): Promise<SearchSongsOutput> {
  return await searchSongsFlow(input);
}
