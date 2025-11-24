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
      auth: oauth2Client, // Usar la autenticación del usuario
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
