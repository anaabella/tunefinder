
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
import { getAllSongsFromAllPlaylists } from '@/lib/youtube';

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
  accessToken: z.string().describe('The YouTube access token.'),
  query: z.string().describe('The search query.'),
  ignoredPlaylistIds: z.array(z.string()).optional().describe('An optional list of playlist IDs to ignore.'),
});

const SearchSongsOutputSchema = z.array(SongSchema);

export type SearchSongsInput = z.infer<typeof SearchSongsInputSchema>;
export type SearchSongsOutput = z.infer<typeof SearchSongsOutputSchema>;

const searchSongsFlow = ai.defineFlow(
  {
    name: 'searchSongsFlow',
    inputSchema: SearchSongsInputSchema,
    outputSchema: SearchSongsOutputSchema,
  },
  async ({ accessToken, query, ignoredPlaylistIds }) => {
    
    const allSongs = await getAllSongsFromAllPlaylists(accessToken, ignoredPlaylistIds);
    
    if (!query) {
      // If the query is empty, return all songs sorted by date
      return allSongs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    
    const lowerCaseQuery = query.toLowerCase();

    // Perform the filtering logic on the server side.
    const filteredSongs = allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
    );

    return filteredSongs;
  }
);

export async function searchSongs(
  input: SearchSongsInput
): Promise<SearchSongsOutput> {
  return await searchSongsFlow(input);
}
