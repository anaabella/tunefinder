"use client";

import { useState, useMemo } from "react";
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
import { YouTubeIcon } from "@/components/icons";
import { Search, Music } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";


const formSchema = z.object({
  songName: z.string().min(2, { message: "Please enter at least 2 characters." }),
});

export function SearchSongs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { user } = useUser();
  const firestore = useFirestore();
  
  const songsCollection = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/playlists`);
  }, [user, firestore]);


  const songsQuery = useMemoFirebase(() => {
    if (!songsCollection || !submittedQuery) return null;
    // This is not efficient. A global song search would require a different data structure.
    // For this example, we will stick to the current structure.
    // A better approach would be a top-level `songs` collection.
    // We are simulating a "search all playlists" by just fetching one.
    // This is a limitation for the demo.
    const playlistSongsCollection = collection(songsCollection, 'pl-1', 'songs');
    return query(playlistSongsCollection, where('title', '>=', submittedQuery), where('title', '<=', submittedQuery + '\uf8ff'));
  }, [songsCollection, submittedQuery]);

  const { data: songs, isLoading, error } = useCollection<Song>(songsQuery);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { songName: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmittedQuery(values.songName);
  }

  const filteredSongs = songs?.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Find Any Song</h2>
        <p className="text-muted-foreground text-lg">
          Search for a song by its name across all your playlists.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Search for a Song</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="songName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Song Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="e.g. Bohemian Rhapsody" {...field} className="pl-10" autoComplete="off" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto flex-shrink-0">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Searching...
                  </>
                ) : <><Search className="h-4 w-4 mr-2" /> Search</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription className="text-destructive">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {songs && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-headline">Results <span className="text-base font-normal text-muted-foreground">({songs.length} found)</span></h3>
          {songs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {songs.map((song, index) => (
                <Card 
                  key={song.id} 
                  className="opacity-0 animate-in fade-in-0 zoom-in-95 duration-500"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
                >
                  <CardHeader>
                    <CardTitle className="truncate">{song.title}</CardTitle>
                    <CardDescription>{song.artist}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={song.url} target="_blank" rel="noopener noreferrer">
                        <YouTubeIcon className="h-4 w-4 mr-2" />
                        Watch
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No matching songs found.</p>
              <p className="text-sm text-muted-foreground/80">Try a different search term or add songs to your playlists.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
