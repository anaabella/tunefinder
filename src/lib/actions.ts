'use server';

import type { Playlist, Song } from '@/lib/types';

const playlists: Playlist[] = [
  { 
    id: 'pl-1',
    name: 'Classic Rock Anthems',
    songs: [
        { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
        { id: '2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', url: 'https://www.youtube.com/watch?v=QkF3oxziUI4' },
        { id: '3', title: 'Hotel California', artist: 'Eagles', url: 'https://www.youtube.com/watch?v=098391-Gfke' },
        { id: '4', title: 'Like a Rolling Stone', artist: 'Bob Dylan', url: 'https://www.youtube.com/watch?v=IwOfCgkyEj0' },
        { id: '5', title: 'Smells Like Teen Spirit', artist: 'Nirvana', url: 'https://www.youtube.com/watch?v=hTWKbfoikeg' },
    ]
  },
  {
    id: 'pl-2',
    name: '80s Pop Hits',
    songs: [
        { id: '6', title: 'Imagine', artist: 'John Lennon', url: 'https://www.youtube.com/watch?v=YkgkThdzX-8' },
        { id: '7', title: 'One', artist: 'U2', url: 'https://www.youtube.com/watch?v=ftjEcrrf7r0' },
        { id: '8', title: 'Billie Jean', artist: 'Michael Jackson', url: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y' },
        { id: '9', title: 'Hey Jude', artist: 'The Beatles', url: 'https://www.youtube.com/watch?v=A_MjCqQoLLA' },
    ]
  },
  {
    id: 'pl-3',
    name: 'Modern Indie',
    songs: [
        { id: '10', title: 'Rolling in the Deep', artist: 'Adele', url: 'https://www.youtube.com/watch?v=rYEDA3JcQqw' },
        { id: '11', title: 'Shape of You', artist: 'Ed Sheeran', url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
        { id: '12', title: 'Blinding Lights', artist: 'The Weeknd', url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ' },
    ]
  }
];

export async function getPlaylistByName(playlistName: string): Promise<{ songs: Song[] | null; error: string | null; }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const playlist = playlists.find(p => p.name.toLowerCase() === playlistName.toLowerCase());

  if (!playlist) {
    return { songs: null, error: `Playlist "${playlistName}" not found.` };
  }

  return { songs: playlist.songs, error: null };
}

export async function searchPlaylists(query: string): Promise<string[]> {
    if (!query) {
        return [];
    }
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const results = playlists
        .map(p => p.name)
        .filter(name => name.toLowerCase().includes(query.toLowerCase()));
    
    return results;
}
