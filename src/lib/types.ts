
export type Song = {
  id: string; // This is the playlistItemId, which is what we need to delete/move
  playlistId: string;
  playlistName: string;
  title: string;
  artist: string;
  youtubeVideoId: string; // This is the ID of the video itself
  thumbnailUrl: string;
  publishedAt: string;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
};
