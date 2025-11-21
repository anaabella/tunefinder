"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@/lib/types";
import { getPlaylistByName, searchPlaylists } from "@/lib/actions";
import { YouTubeIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ListMusic, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formSchema = z.object({
  playlistName: z.string().min(2, { message: "Please enter at least 2 characters." }),
});

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlistLoaded, setPlaylistLoaded] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { playlistName: "" },
  });

  const watchPlaylistName = form.watch('playlistName');

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length > 1) {
      const results = await searchPlaylists(query);
      setSuggestions(results);
      setIsSuggestionsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSuggestions(watchPlaylistName);
    }, 300);
    return () => clearTimeout(debounce);
  }, [watchPlaylistName, fetchSuggestions]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setPlaylistLoaded(false);
    setSongs([]);
    setIsSuggestionsOpen(false);
    setPlaylistName(values.playlistName);

    const result = await getPlaylistByName(values.playlistName);
    
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else if (result.songs) {
      setSongs(result.songs);
      setPlaylistLoaded(true);
      toast({
        title: "Playlist loaded!",
        description: `Found ${result.songs.length} songs in "${values.playlistName}".`,
      });
    }
  }

  const handleDeleteSong = (songId: string) => {
    setSongs((prevSongs) => prevSongs.filter((song) => song.id !== songId));
    toast({
      title: "Song removed",
      description: "The song has been removed from your list.",
    });
  };

  const filteredSongs = playlistLoaded ? songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('playlistName', suggestion);
    onSubmit({ playlistName: suggestion });
  }
  
  return (
    <div className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Find Any Song in Your Playlist</h2>
          <p className="text-muted-foreground text-lg">
            Search for a playlist by name and we'll help you find songs within it.
          </p>
        </div>

        <Card className="shadow-lg transition-all hover:shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-6 w-6 text-sm font-bold">1</span> Enter Playlist Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
                <Popover open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
                  <PopoverTrigger asChild className="w-full">
                    <FormField
                      control={form.control}
                      name="playlistName"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel className="sr-only">Playlist Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ListMusic className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g. Classic Rock Anthems" {...field} className="pl-10" autoComplete="off" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <div className="flex flex-col gap-1 p-1">
                      {suggestions.map((suggestion) => (
                        <Button 
                          key={suggestion}
                          variant="ghost" 
                          className="justify-start"
                          onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto flex-shrink-0">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Loading...
                    </>
                  ) : 'Load Playlist'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && <LoadingSkeletons />}

        {playlistLoaded && (
          <div className="space-y-6 animate-in fade-in-0 duration-500">
             <Card className="shadow-lg transition-all hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full h-6 w-6 text-sm font-bold">2</span> Search in "{playlistName}"</CardTitle>
                <CardDescription>Search by title or artist in the loaded playlist of {songs.length} songs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search for 'Bohemian Rhapsody'..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    aria-label="Search songs"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold font-headline">Results <span className="text-base font-normal text-muted-foreground">({filteredSongs.length} found)</span></h3>
              {filteredSongs.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredSongs.map((song, index) => (
                    <Card 
                      key={song.id} 
                      className="opacity-0 animate-in fade-in-0 zoom-in-95 duration-500"
                      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                    >
                      <CardHeader>
                        <CardTitle className="truncate">{song.title}</CardTitle>
                        <CardDescription>{song.artist}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex gap-2">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={song.url} target="_blank" rel="noopener noreferrer">
                            <YouTubeIcon className="h-4 w-4 mr-2" />
                            Watch
                          </Link>
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={() => handleDeleteSong(song.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No matching songs found.</p>
                  <p className="text-sm text-muted-foreground/80">Try a different search term.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-10 w-full rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
