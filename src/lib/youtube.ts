'use server';
/**
 * @fileOverview Funciones para interactuar con la API de YouTube.
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import type { Playlist, Song } from './types';

const youtube = google.youtube('v3');

// Ahora el input incluye una lista opcional de IDs de playlists a ignorar.
const GetPlaylistsInputSchema = z.object({
  accessToken: z.string().describe('OAuth2 Access Token'),
  ignoredPlaylistIds: z.array(z.string()).optional().describe('Lista de IDs de playlists a ignorar.'),
});


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
  async ({ accessToken, ignoredPlaylistIds }) => {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    try {
      const response = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults: 50,
        auth: oauth2Client,
      });

      let playlists =
        response.data.items?.map((item) => ({
          id: item.id || '',
          name: item.snippet?.title || 'Sin Título',
          description: item.snippet?.description || 'Sin Descripción',
        })) || [];

      // Filtra las playlists ignoradas si se proporciona la lista.
      if (ignoredPlaylistIds && ignoredPlaylistIds.length > 0) {
        const ignoredSet = new Set(ignoredPlaylistIds);
        playlists = playlists.filter(p => !ignoredSet.has(p.id));
      }
      
      return playlists.filter((p): p is Playlist => !!p.id);

    } catch (error: any) {
        // Detecta error de token expirado
        if (error.code === 401 || (error.response?.data?.error?.message.includes('Invalid Credentials'))) {
            throw new Error('YOUTUBE_TOKEN_EXPIRED');
        }
        throw error;
    }
  }
);

export async function getPlaylists(accessToken: string, ignoredPlaylistIds?: string[]): Promise<Playlist[]> {
  return await getPlaylistsFlow({ accessToken, ignoredPlaylistIds });
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
        publishedAt: z.string(),
      })
    ),
  },
  async ({ accessToken, playlistId }) => {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    let allItems: any[] = [];
    let nextPageToken: string | undefined | null = undefined;

    try {
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
    } catch (error: any) {
        if (error.code === 401 || (error.response?.data?.error?.message.includes('Invalid Credentials'))) {
            throw new Error('YOUTUBE_TOKEN_EXPIRED');
        }
        throw error;
    }


    const songs = allItems.map((item) => {
      const title = item.snippet?.title || 'Título Desconocido';
      const videoOwner =
        item.snippet?.videoOwnerChannelTitle?.replace(' - Topic', '') ||
        'Artista Desconocido';

      return {
        id: item.id || '',
        playlistId: playlistId,
        playlistName: '',
        title: title,
        artist: videoOwner,
        youtubeVideoId: item.snippet?.resourceId?.videoId || '',
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        publishedAt: item.snippet?.publishedAt || new Date(0).toISOString(),
      };
    });

    return songs.filter((s): s is Song => !!s.id && !!s.youtubeVideoId);
  }
);


const GetAllSongsInputSchema = z.object({
  accessToken: z.string().describe('OAuth2 Access Token'),
  playlistId: z.string().describe('The ID of the playlist to fetch songs from.'),
});


const getSongsFromPlaylistFlow = ai.defineFlow(
  {
    name: 'getSongsFromPlaylistFlow',
    inputSchema: GetAllSongsInputSchema,
    outputSchema: z.array(z.custom<Song>()),
  },
  async ({accessToken, playlistId}) => {
    try {
        // Primero, obtenemos los detalles de la playlist para tener su nombre.
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const playlistResponse = await youtube.playlists.list({
            part: ['snippet'],
            id: [playlistId],
            auth: oauth2Client,
        });

        const playlistName = playlistResponse.data.items?.[0]?.snippet?.title || 'Playlist Desconocida';

        const songs = await getPlaylistItemsFlow({
            accessToken,
            playlistId: playlistId,
        });

        // Añadimos el nombre de la playlist a cada canción.
        return songs.map((song) => ({
            ...song,
            playlistName: playlistName,
        }));
    } catch (error: any) {
        if (error.code === 401 || (error.response?.data?.error?.message.includes('Invalid Credentials'))) {
            throw new Error('YOUTUBE_TOKEN_EXPIRED');
        }
        throw error;
    }
  }
);

// Nueva función para obtener canciones de UNA playlist
export async function getSongsFromPlaylist(accessToken: string, playlistId: string): Promise<Song[]> {
  return await getSongsFromPlaylistFlow({ accessToken, playlistId });
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
        const errorMessage = error?.response?.data?.error?.message || error.message || 'Error desconocido de la API.';
        throw new Error(`Error de la API de YouTube: ${errorMessage}`);
      }
    }
  );
  
export async function deletePlaylistItem(accessToken: string, playlistItemId: string): Promise<boolean> {
    return await deletePlaylistItemFlow({ accessToken, playlistItemId });
}
