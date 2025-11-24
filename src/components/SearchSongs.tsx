
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';
import { Firestore, collection, query, where, getDocs } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Song } from "@/lib/types";
import { YouTubeIcon } from "@/components/icons";
import { Search, Music } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  songName: z.string().min(2, { message: "Please enter at least 2 characters." }),
});

export function SearchSongs() {
  const [submittedQuery, setSubmittedQuery] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const songsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !submittedQuery) return null;
    const songsCollectionRef = collection(firestore, `users/${user.uid}/songs`);
    // This query is intentionally simple for demonstration.
    // For a real-world application, you might want to use a more advanced
    // search solution like Algolia or Elasticsearch, as Firestore's
    // native querying capabilities for text search are limited.
    // This query finds songs where the title starts with the submitted query.
    return query(
      songsCollectionRef,
      where('title', '>=', submittedQuery),
      where('title', '<=', submittedQuery + '\uf8ff')
    );
  }, [user, firestore, submittedQuery]);
  
  const { data: songs, isLoading, error } = useCollection<Song>(songsQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { songName: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmittedQuery(values.songName);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight">Encuentra Cualquier Canción</h2>
        <p className="text-muted-foreground text-lg">
          Busca una canción por su nombre en todas tus playlists.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Buscar una Canción</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4">
              <FormField
                control={form.control}
                name="songName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="sr-only">Nombre de la canción</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="p. ej. Bohemian Rhapsody" {...field} className="pl-10" autoComplete="off" />
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
                    Buscando...
                  </>
                ) : <><Search className="h-4 w-4 mr-2" /> Buscar</>}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {submittedQuery && isLoading && (
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

      {submittedQuery && !isLoading && songs && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-headline">Resultados <span className="text-base font-normal text-muted-foreground">({songs.length} encontrados)</span></h3>
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
                    <CardDescription>{song.artist} &middot; {song.playlistName}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`https://www.youtube.com/watch?v=${song.youtubeVideoId}`} target="_blank" rel="noopener noreferrer">
                        <YouTubeIcon className="h-4 w-4 mr-2" />
                        Ver en YouTube
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No se encontraron canciones que coincidan.</p>
              <p className="text-sm text-muted-foreground/80">Intenta con otro término de búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
