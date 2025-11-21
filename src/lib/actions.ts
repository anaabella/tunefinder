"use server";

import type { Song } from '@/lib/types';

const mockPlaylist: Song[] = [
  { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
  { id: '2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', url: 'https://www.youtube.com/watch?v=QkF3oxziUI4' },
  { id: '3', title: 'Hotel California', artist: 'Eagles', url: 'https://www.youtube.com/watch?v=098391-Gfke' },
  { id: '4', title: 'Like a Rolling Stone', artist: 'Bob Dylan', url: 'https://www.youtube.com/watch?v=IwOfCgkyEj0' },
  { id: '5', title: 'Smells Like Teen Spirit', artist: 'Nirvana', url: 'https://www.youtube.com/watch?v=hTWKbfoikeg' },
  { id: '6', title: 'Imagine', artist: 'John Lennon', url: 'https://www.youtube.com/watch?v=YkgkThdzX-8' },
  { id: '7', title: 'One', artist: 'U2', url: 'https://www.youtube.com/watch?v=ftjEcrrf7r0' },
  { id: '8', title: 'Billie Jean', artist: 'Michael Jackson', url: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y' },
  { id: '9', title: 'Hey Jude', artist: 'The Beatles', url: 'https://www.youtube.com/watch?v=A_MjCqQoLLA' },
  { id: '10', title: 'Rolling in the Deep', artist: 'Adele', url: 'https://www.youtube.com/watch?v=rYEDA3JcQqw' },
  { id: '11', title: 'Shape of You', artist: 'Ed Sheeran', url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
  { id: '12', title: 'Blinding Lights', artist: 'The Weeknd', url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ' },
];

export async function getPlaylistSongs(playlistUrl: string): Promise<{ songs: Song[] | null; error: string | null; }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Basic validation for demo purposes
  if (!playlistUrl.includes('youtube.com/playlist')) {
    return { songs: null, error: 'Please enter a valid YouTube playlist URL.' };
  }

  // In a real app, you would fetch and parse the playlist here.
  // For this demo, we'll return a mock playlist.
  return { songs: mockPlaylist, error: null };
}
