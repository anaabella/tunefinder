
export type Song = {
  id: string;
  playlistId: string;
  playlistName: string;
  title: string;
  artist: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
};
