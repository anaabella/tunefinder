
'use server';
/**
 * @fileOverview Flow to search songs based on a query.
 *
 * - searchSongs - A function that fetches all songs and filters them based on a search query on the server.
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
    // Step 1: If the query is empty, return no results.
    // The heavy lifting is only done when a search is performed.
    if (!query) {
      return [];
    }
    
    // Step 2: Fetch all songs from all playlists on the server.
    const allSongs = await getAllSongsFromAllPlaylists(accessToken, ignoredPlaylistIds);
    
    const lowerCaseQuery = query.toLowerCase();

    // Step 3: Perform the filtering logic on the server side.
    const filteredSongs = allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerCaseQuery) ||
        (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
    );

    return filteredSongs;
  }
);

/**
 * Fetches all songs from a user's YouTube playlists and filters them based on a query.
 * The entire operation runs on the server to avoid freezing the client.
 * @param input The search input containing the access token and query.
 * @returns A promise that resolves to an array of filtered songs.
 */
export async function searchSongs(
  input: SearchSongsInput
): Promise<SearchSongsOutput> {
  return await searchSongsFlow(input);
}
