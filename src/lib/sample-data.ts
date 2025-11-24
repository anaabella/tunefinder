
import type { Playlist, Song } from './types';

export const samplePlaylists: Omit<Playlist, 'id'>[] = [
  {
    name: 'Rock Classics',
    description: 'The best rock anthems of all time.',
  },
  {
    name: 'Indie Hits',
    description: 'Your favorite indie tunes.',
  },
];

export const sampleSongs: Omit<Song, 'id' | 'playlistId'>[] = [
    {
        title: "Bohemian Rhapsody",
        artist: "Queen",
        playlistName: "Rock Classics",
        youtubeVideoId: "fJ9rUzIMcZQ"
    },
    {
        title: "Stairway to Heaven",
        artist: "Led Zeppelin",
        playlistName: "Rock Classics",
        youtubeVideoId: "QkF3oxziUI4"
    },
    {
        title: "Hotel California",
        artist: "Eagles",
        playlistName: "Rock Classics",
        youtubeVideoId: "098391Qd-ss"
    },
    {
        title: "The Less I Know The Better",
        artist: "Tame Impala",
        playlistName: "Indie Hits",
        youtubeVideoId: "sBzrzS1Ag_g"
    },
    {
        title: "Pumped Up Kicks",
        artist: "Foster The People",
        playlistName: "Indie Hits",
        youtubeVideoId: "SDTZ7iX4vTQ"
    }
];
