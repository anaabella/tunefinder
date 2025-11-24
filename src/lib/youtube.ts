
'use server';
/**
 * @fileOverview Funciones para interactuar con la API de YouTube.
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import type { Playlist, Song } from './types';

const youtube = google.youtube('v3');

const GetPlaylistsInputSchema = z.string().describe('OAuth2 Access Token');

const getPlaylistsFlow = ai.defineFlow(
  {
    name: 'getPlaylistsFlow',
    inputSchema: GetPlaylistsInputSchema,
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      })
    ),
  },
  async (accessToken) => {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const response = await youtube.playlists.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50,
      auth: oauth2Client,
    });

    const playlists =
      response.data.items?.map((item) => ({
        id: item.id || '',
        name: item.snippet?.title || 'Sin Título',
        description: item.snippet?.description || 'Sin Descripción',
      })) || [];

    return playlists.filter((p): p is Playlist => !!p.id);
  }
);

export async function getPlaylists(accessToken: string): Promise<Playlist[]> {
  return await getPlaylistsFlow(accessToken);
}

const GetPlaylistItemsInputSchema = z.object({
  accessToken: z.string().describe('OAuth2 Access Token'),
  playlistId: z.string().describe('ID of the YouTube playlist'),
});

const getPlaylistItemsFlow = ai.defineFlow(
  {
    name: 'getPlaylistItemsFlow',
    inputSchema: GetPlaylistItemsInputSchema,
    outputSchema: z.array(
      z.object({
        id: z.string(),
        playlistId: z.string(),
        playlistName: z.string(),
        title: z.string(),
        artist: z.string(),
        youtubeVideoId: z.string(),
        thumbnailUrl: z.string(),
      })
    ),
  },
  async ({ accessToken, playlistId }) => {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    let allItems: any[] = [];
    let nextPageToken: string | undefined | null = undefined;

    do {
      const response = await youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: playlistId,
        maxResults: 50,
        pageToken: nextPageToken || undefined,
        auth: oauth2Client,
      });

      if (response.data.items) {
        allItems = allItems.concat(response.data.items);
      }

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    const songs = allItems.map((item) => {
      const title = item.snippet?.title || 'Título Desconocido';
      // Prioritize the video owner channel title for artist, often more accurate for music.
      const videoOwner =
        item.snippet?.videoOwnerChannelTitle?.replace(' - Topic', '') ||
        'Artista Desconocido';

      return {
        // We use item.id for the playlist item ID, needed for deletion.
        id: item.id || '',
        playlistId: playlistId,
        playlistName: '', // Will be filled in the search flow
        title: title,
        artist: videoOwner,
        youtubeVideoId: item.snippet?.resourceId?.videoId || '',
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      };
    });

    return songs.filter((s): s is Song => !!s.id && !!s.youtubeVideoId);
  }
);

export async function getPlaylistItems(
  accessToken: string,
  playlistId: string
): Promise<Song[]> {
  return await getPlaylistItemsFlow({ accessToken, playlistId });
}

const SearchAllPlaylistsInputSchema = z.object({
  accessToken: z.string().describe('OAuth2 Access Token'),
  query: z.string().describe('Search query for song title or artist'),
});

const searchAllPlaylistsFlow = ai.defineFlow(
  {
    name: 'searchAllPlaylistsFlow',
    inputSchema: SearchAllPlaylistsInputSchema,
    outputSchema: z.array(z.custom<Song>()),
  },
  async ({ accessToken, query }) => {
    const playlists = await getPlaylistsFlow(accessToken);

    const allSongsPromises = playlists.map(async (playlist) => {
      if (!playlist.id) return [];
      const songs = await getPlaylistItemsFlow({
        accessToken,
        playlistId: playlist.id,
      });
      // Add playlist name to each song
      return songs.map((song) => ({
        ...song,
        playlistName: playlist.name,
      }));
    });

    const allSongsArrays = await Promise.all(allSongsPromises);
    const allSongs = allSongsArrays.flat();
    
    const lowerCaseQuery = query.toLowerCase();

    const filteredSongs = allSongs.filter(song => 
      song.title.toLowerCase().includes(lowerCaseQuery) || 
      (song.artist && song.artist.toLowerCase().includes(lowerCaseQuery))
    );
    
    // Sort results by playlist name
    filteredSongs.sort((a, b) => a.playlistName.localeCompare(b.playlistName));

    return filteredSongs;
  }
);

export async function searchAllPlaylists(accessToken: string, query: string): Promise<Song[]> {
  return await searchAllPlaylistsFlow({ accessToken, query });
}


const DeletePlaylistItemInputSchema = z.object({
  accessToken: z.string().describe('OAuth2 Access Token'),
  playlistItemId: z.string().describe('The ID of the playlist item to delete'),
});


const deletePlaylistItemFlow = ai.defineFlow(
    {
      name: 'deletePlaylistItemFlow',
      inputSchema: DeletePlaylistItemInputSchema,
      outputSchema: z.boolean(),
    },
    async ({ accessToken, playlistItemId }) => {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
  
      try {
        await youtube.playlistItems.delete({
          id: playlistItemId,
          auth: oauth2Client,
        });
        return true;
      } catch (error: any) {
        console.error('Error detallado de la API de YouTube al eliminar:', JSON.stringify(error, null, 2));
        // Propagate the specific error message from the YouTube API
        const errorMessage = error?.response?.data?.error?.message || error.message || 'Error desconocido de la API.';
        throw new Error(`Error de la API de YouTube: ${errorMessage}`);
      }
    }
  );
  
export async function deletePlaylistItem(accessToken: string, playlistItemId: string): Promise<boolean> {
    return await deletePlaylistItemFlow({ accessToken, playlistItemId });
}
