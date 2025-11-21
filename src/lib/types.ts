export type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
};

export type Playlist = {
  id: string;
  name: string;
  songs: Song[];
};
