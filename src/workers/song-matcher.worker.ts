import type { Song } from '@/lib/types';

interface LocalSong {
  title: string;
  artist: string;
}

interface WorkerData {
  allYouTubeSongs: Song[];
  parsedSongs: LocalSong[];
}

/**
 * Normalizes a string by converting to lowercase, removing diacritics,
 * and stripping non-alphanumeric characters.
 */
function normalize(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Decompose combined graphemes into base characters and diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric chars
}

/**
 * Calculates the Levenshtein distance between two strings.
 * A measure of the difference between two sequences.
 */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= b.length; i++) matrix[0][i] = i;
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[a.length][b.length];
}


if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent<WorkerData>) => {
    const { allYouTubeSongs, parsedSongs } = e.data;

    if (!parsedSongs || parsedSongs.length === 0) {
        postMessage([]);
        return;
    }

    const matches: Song[] = [];
    const matchedYtSongIds = new Set<string>();

    const normalizedLocalSongs = parsedSongs.map(s => ({
      title: normalize(s.title),
      artist: normalize(s.artist),
    }));

    // Iterate over each song from the local file
    normalizedLocalSongs.forEach(localSong => {
      let bestMatch: Song | null = null;
      let minDistance = Infinity;

      // Find the best matching YouTube song for the current local song
      allYouTubeSongs.forEach(ytSong => {
        if (matchedYtSongIds.has(ytSong.id)) return; // Skip if already matched

        const normalizedYtTitle = normalize(ytSong.title);
        const normalizedYtArtist = normalize(ytSong.artist);
        
        // Combine title and artist for a more robust comparison
        const localCombined = `${localSong.artist}${localSong.title}`;
        const ytCombined = `${normalizedYtArtist}${normalizedYtTitle}`;

        const distance = levenshtein(localCombined, ytCombined);
        
        // A simple heuristic: if the strings are very similar, consider it a match
        const similarityThreshold = Math.max(localCombined.length, ytCombined.length) * 0.25; // Allow 25% difference

        if (distance < minDistance && distance <= similarityThreshold) {
          minDistance = distance;
          bestMatch = ytSong;
        }
      });

      if (bestMatch) {
        // We found a good match for the local song, add it to results
        matches.push(bestMatch);
        matchedYtSongIds.add(bestMatch.id); // Mark as matched
      }
    });

    postMessage(matches);
  };
}

// Export empty object to satisfy TypeScript's module requirement
export default {};
