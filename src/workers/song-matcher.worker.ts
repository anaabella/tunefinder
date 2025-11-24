import type { Song } from '@/lib/types';

interface LocalSong {
  title: string;
  artist: string;
}

interface WorkerData {
  allYouTubeSongs: Song[];
  parsedSongs: LocalSong[];
}

if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent<WorkerData>) => {
    const { allYouTubeSongs, parsedSongs } = e.data;

    // Ensure parsedSongs is not undefined or null
    if (!parsedSongs) {
        postMessage([]);
        return;
    }

    const matches: Song[] = [];
    const lowerCaseParsed = parsedSongs.map(s => ({
      title: s.title.toLowerCase().trim(),
      artist: s.artist.toLowerCase().trim(),
    }));

    const ytSongsSet = new Set<string>();

    allYouTubeSongs.forEach(ytSong => {
      const ytTitle = ytSong.title.toLowerCase().trim();
      // const ytArtist = ytSong.artist.toLowerCase().trim();

      if (lowerCaseParsed.some(localSong => 
        (localSong.title && ytTitle.includes(localSong.title)) || 
        (ytTitle && localSong.title && ytTitle.includes(localSong.title))
      )) {
        // Avoid adding duplicates
        if (!ytSongsSet.has(ytSong.id)) {
          matches.push(ytSong);
          ytSongsSet.add(ytSong.id);
        }
      }
    });

    postMessage(matches);
  };
}

export default {};
